import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.0.0'

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
      hasSupabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      authHeader: req.headers.get('Authorization')?.substring(0, 20) + '...'
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-11-20',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser()

    console.log('🔍 Auth Debug:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });

    if (!user) {
      console.error('❌ User authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { priceId, productId, userId, userEmail, successUrl, cancelUrl } = await req.json()

    if (!priceId || !productId || !userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user matches authenticated user
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Stripe checkout session
    console.log('🔍 Creating Stripe session with:', {
      priceId,
      productId,
      userId,
      userEmail: userEmail?.substring(0, 10) + '...'
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail,
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
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['AU'], // Restrict to Australia
      },
      tax_id_collection: {
        enabled: false, // Set to true if you want to collect ABN/tax numbers
      },
      allow_promotion_codes: true, // Allow discount codes
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `EduCourse - ${productId}`,
          metadata: {
            userId: userId,
            productId: productId,
          },
        },
      },
    })

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