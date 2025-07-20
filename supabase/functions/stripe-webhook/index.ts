import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Stripe product ID to database product type mapping
const STRIPE_PRODUCT_TO_DB_TYPE: Record<string, string> = {
  // Current live product IDs
  'prod_Shqo1r4nLXrZ1O': 'Year 5 NAPLAN',
  'prod_ShqppA31VnjzIP': 'Year 7 NAPLAN', 
  'prod_ShqpEsp5rkFKmf': 'EduTest Scholarship (Year 7 Entry)',
  'prod_ShqqrSpEygs1Da': 'ACER Scholarship (Year 7 Entry)',
  'prod_ShqqjPuJGAP2FW': 'NSW Selective Entry (Year 7 Entry)',
  'prod_ShqrKwKE5Ii2rZ': 'VIC Selective Entry (Year 9 Entry)',
  
  // Legacy product IDs (keep for backwards compatibility)
  'prod_ShnPdOiDYbl6r0': 'Year 5 NAPLAN',
  'prod_ShnRiUgfv0qnuc': 'Year 7 NAPLAN', 
  'prod_ShnVu21eaNIeqa': 'EduTest Scholarship (Year 7 Entry)',
  'prod_ShnYQIQbQp0qzx': 'ACER Scholarship (Year 7 Entry)',
  'prod_ShnNTdv0tv1ikx': 'NSW Selective Entry (Year 7 Entry)',
  'prod_ShnKBAkGwieDH0': 'VIC Selective Entry (Year 9 Entry)'
};

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      return new Response('Missing stripe-signature header', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-08-16',
    })

    // Initialize Supabase with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('❌ Missing STRIPE_WEBHOOK_SECRET')
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Get raw body for signature verification
    const body = await req.text()
    
    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified:', event.type)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('🎉 Payment successful for session:', session.id)
        
        // Extract metadata from the session
        const userId = session.metadata?.userId
        const productId = session.metadata?.productId
        const userEmail = session.customer_email || session.customer_details?.email

        if (!userId) {
          console.error('❌ Missing userId in session metadata')
          return new Response('Missing userId in metadata', { 
            status: 400,
            headers: corsHeaders 
          })
        }

        // Get the line items to determine what was purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        })

        console.log('📦 Line items:', lineItems.data.length)

        // Process each purchased item
        for (const item of lineItems.data) {
          if (item.price?.product && typeof item.price.product === 'object') {
            const stripeProductId = item.price.product.id
            const dbProductType = STRIPE_PRODUCT_TO_DB_TYPE[stripeProductId]
            
            console.log('🔍 Processing product:', {
              stripeProductId,
              dbProductType,
              userId,
              userEmail
            })

            if (!dbProductType) {
              console.error('❌ Unknown Stripe product ID:', stripeProductId)
              continue
            }

            // Check if user already has access
            const { data: existingAccess } = await supabase
              .from('user_products')
              .select('id')
              .eq('user_id', userId)
              .eq('product_type', dbProductType)
              .single()

            if (existingAccess) {
              console.log('✅ User already has access to this product')
              continue
            }

            // Grant access to the product
            const { data, error } = await supabase
              .from('user_products')
              .insert({
                user_id: userId,
                product_type: dbProductType,
                is_active: true,
                purchased_at: new Date().toISOString(),
                stripe_session_id: session.id,
                stripe_customer_id: session.customer,
                amount_paid: session.amount_total,
                currency: session.currency
              })

            if (error) {
              console.error('❌ Failed to grant product access:', error)
              return new Response(`Failed to grant access: ${error.message}`, { 
                status: 500,
                headers: corsHeaders 
              })
            }

            console.log('✅ Product access granted:', {
              userId,
              productType: dbProductType,
              sessionId: session.id
            })
          }
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed for PaymentIntent:', paymentIntent.id)
        // You could log this to your database or send notifications
        break
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellations if you add subscriptions later
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔄 Subscription cancelled:', subscription.id)
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Internal server error processing webhook'
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500,
      }
    )
  }
})