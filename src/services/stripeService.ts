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
      hasConfig: !!productConfig
    });
    
    if (!productConfig || !productConfig.priceId) {
      console.error('❌ Product config missing:', { productId, productConfig });
      return { error: 'Product configuration not found.' };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Please sign in to purchase.' };
    }

    // Create checkout session via Edge Function
    console.log('🔍 Invoking create-checkout-session with:', {
      priceId: productConfig.priceId,
      productId,
      userId: user.id,
      userEmail: user.email?.substring(0, 10) + '...',
      hasUser: !!user,
      userSessionValid: !!user.aud
    });

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: productConfig.priceId,
        productId: productId,
        userId: user.id,
        userEmail: user.email,
        successUrl: `${window.location.origin}/purchase-success?product=${productId}`,
        cancelUrl: `${window.location.origin}/dashboard`
      }
    });

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

    // Create checkout session
    const result = await createCheckoutSession(productId);
    
    if ('error' in result) {
      throw new Error(result.error);
    }

    // Get Stripe instance
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe is not available. Please try again later.');
    }

    // Redirect to checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: result.sessionId
    });

    if (error) {
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