import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { getStripePublishableKey, getStripeProductConfig, isStripeConfigured } from '@/config/stripeConfig';

let stripePromise: Promise<Stripe | null>;

// Initialize Stripe
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = getStripePublishableKey();
    if (!publishableKey || !isStripeConfigured()) {
      console.warn('Stripe is not configured. Please set up your Stripe API keys.');
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(publishableKey);
    }
  }
  return stripePromise;
};

// Create a checkout session for a product
export async function createCheckoutSession(productId: string): Promise<{ sessionId: string } | { error: string }> {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return { error: 'Stripe is not configured. Please contact support.' };
    }

    // Get product configuration
    const productConfig = getStripeProductConfig(productId);
    console.log('🔍 Product Config Debug:', {
      productId,
      productConfig,
      priceId: productConfig?.priceId,
      hasConfig: !!productConfig,
      priceIdLength: productConfig?.priceId?.length,
      envVarName: `VITE_STRIPE_${productId.toUpperCase().replace('-', '_')}_PRICE_ID`
    });
    
    if (!productConfig || !productConfig.priceId) {
      console.error('❌ Product config missing:', { productId, productConfig });
      return { error: 'Product configuration not found.' };
    }

    // Get current user (optional for guest checkout)
    const { data: { user } } = await supabase.auth.getUser();

    // Create checkout session via Edge Function
    console.log('🔍 Invoking create-checkout-session with:', {
      priceId: productConfig.priceId,
      productId,
      userId: user?.id || 'guest',
      userEmail: user?.email ? user.email.substring(0, 10) + '...' : 'guest',
      hasUser: !!user,
      isGuestCheckout: !user
    });

    // Preserve Google Ads click ID through the Stripe redirect.
    // Stripe strips unknown query params unless they're in the success URL we send.
    const gclid = (() => {
      try {
        const stored = localStorage.getItem('gclid');
        const ts = Number(localStorage.getItem('gclid_ts') || 0);
        const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
        if (stored && Date.now() - ts < NINETY_DAYS) return stored;
      } catch { /* noop */ }
      return null;
    })();

    const successUrl = new URL(`${window.location.origin}/purchase-success`);
    successUrl.searchParams.set('product', productId);
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
    if (gclid) successUrl.searchParams.set('gclid', gclid);

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: productConfig.priceId,
        productId: productId,
        userId: user?.id || 'guest',
        userEmail: user?.email || '',
        successUrl: successUrl.toString().replace(encodeURIComponent('{CHECKOUT_SESSION_ID}'), '{CHECKOUT_SESSION_ID}'),
        cancelUrl: `${window.location.origin}${window.location.pathname}`
      }
    });
    
    // Store email for guest checkout flow
    if (!user && productId) {
      // For guest checkout, we'll need to capture email during checkout
      // Email will be available after successful payment
      localStorage.setItem('checkoutProduct', productId);
    }

    console.log('🔍 Edge function response:', { 
      data, 
      error,
      hasData: !!data,
      hasError: !!error,
      errorDetails: error
    });

    if (error) {
      console.error('❌ Error creating checkout session:', {
        message: error.message,
        details: error,
        isAuthError: error.message?.includes('401') || error.message?.includes('Unauthorized')
      });
      return { error: error.message || 'Failed to create checkout session.' };
    }

    if (!data?.sessionId) {
      return { error: 'Invalid response from payment service.' };
    }

    return { sessionId: data.sessionId };
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

// Redirect to Stripe Checkout
export async function redirectToCheckout(productId: string): Promise<void> {
  try {
    // Show loading state
    console.log('Starting checkout for product:', productId);
    
    // Debug: Check Stripe configuration
    const publishableKey = getStripePublishableKey();
    console.log('🔍 Frontend Stripe Debug:', {
      hasPublishableKey: !!publishableKey,
      keyPrefix: publishableKey.substring(0, 8),
      keyLength: publishableKey.length,
      isLiveMode: publishableKey.startsWith('pk_live_')
    });

    // Create checkout session
    const result = await createCheckoutSession(productId);
    
    if ('error' in result) {
      throw new Error(result.error);
    }

    console.log('✅ Checkout session created:', result.sessionId);

    // Get Stripe instance
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe is not available. Please try again later.');
    }

    console.log('🚀 Redirecting to Stripe checkout with session:', result.sessionId);

    // Redirect to checkout
    console.log('🔄 Attempting redirect with Stripe instance:', !!stripe);
    const { error } = await stripe.redirectToCheckout({
      sessionId: result.sessionId
    });

    if (error) {
      console.error('❌ Stripe redirect error:', {
        type: error.type,
        message: error.message,
        code: error.code,
        decline_code: error.decline_code,
        param: error.param
      });
      
      // Check for specific error types
      if (error.type === 'invalid_request_error' && error.message?.includes('No such checkout.session')) {
        throw new Error('Checkout session not found. This usually means the publishable key doesn\'t match the secret key.');
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Checkout error:', error);
    // You might want to show a toast or modal here
    alert(error.message || 'Failed to start checkout. Please try again.');
  }
}

// Check if user has access to a product (wrapper for consistency)
export async function checkProductAccess(userId: string, productId: string): Promise<boolean> {
  try {
    const productConfig = getStripeProductConfig(productId);
    if (!productConfig) {
      console.warn('Product configuration not found for:', productId);
      return false;
    }

    const { data, error } = await supabase
      .from('user_products')
      .select('id')
      .eq('user_id', userId)
      .eq('product_type', productConfig.dbProductType)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking product access:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkProductAccess:', error);
    return false;
  }
}