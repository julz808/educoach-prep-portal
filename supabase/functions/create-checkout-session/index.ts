import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@17.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Debug environment variables
    console.log('🔍 Environment Debug:', {
      hasStripeKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
      stripeKeyPrefix: Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 8),
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      authHeader: req.headers.get('Authorization')?.substring(0, 20) + '...'
    });

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('❌ Missing STRIPE_SECRET_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing Stripe configuration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Parse request body first to get userId
    const body = await req.json()
    const { priceId, productId, userId, userEmail, successUrl, cancelUrl } = body

    console.log('🔍 Request body:', {
      hasPriceId: !!priceId,
      hasProductId: !!productId,
      hasUserId: !!userId,
      hasUserEmail: !!userEmail,
      priceId,
      productId,
      userId,
      userEmail,
      successUrl,
      cancelUrl
    });

    if (!priceId || !productId || !userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: priceId, productId, userId and userEmail are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }


    // Create Stripe checkout session
    console.log('🔍 Creating Stripe session with:', {
      priceId,
      productId,
      userId,
      userEmail: userEmail ? userEmail.substring(0, 10) + '...' : 'guest'
    });

    const sessionConfig: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        productId: productId,
        source: 'educourse_platform'
      }
    };

    // Always add customer_email for authenticated users
    sessionConfig.customer_email = userEmail;

    console.log('🔍 Final session config:', JSON.stringify(sessionConfig, null, 2));
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('✅ Session created successfully:', session.id);

    console.log('Created checkout session:', session.id, 'for user:', userId, 'product:', productId)

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack?.substring(0, 500)
    });
    
    // Check if this is a Stripe authentication error
    const isStripeAuthError = error.type === 'StripeAuthenticationError' || 
                              error.statusCode === 401 ||
                              error.message?.includes('Invalid API key');
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.type || 'Unknown error type',
        isStripeAuthError,
        statusCode: error.statusCode
      }),
      { 
        status: isStripeAuthError ? 401 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})