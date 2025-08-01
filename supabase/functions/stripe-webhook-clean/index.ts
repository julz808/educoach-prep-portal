import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Stripe product ID to database product type mapping
const STRIPE_PRODUCT_TO_DB_TYPE: Record<string, string> = {
  'prod_Shqo1r4nLXrZ1O': 'Year 5 NAPLAN',
  'prod_ShqppA31VnjzIP': 'Year 7 NAPLAN', 
  'prod_ShqpEsp5rkFKmf': 'EduTest Scholarship (Year 7 Entry)',
  'prod_ShqqrSpEygs1Da': 'ACER Scholarship (Year 7 Entry)',
  'prod_ShqqjPuJGAP2FW': 'NSW Selective Entry (Year 7 Entry)',
  'prod_ShqrKwKE5Ii2rZ': 'VIC Selective Entry (Year 9 Entry)',
  'prod_ShnPdOiDYbl6r0': 'Year 5 NAPLAN',
  'prod_ShnRiUgfv0qnuc': 'Year 7 NAPLAN', 
  'prod_ShnVu21eaNIeqa': 'EduTest Scholarship (Year 7 Entry)',
  'prod_ShnYQIQbQp0qzx': 'ACER Scholarship (Year 7 Entry)',
  'prod_ShnNTdv0tv1ikx': 'NSW Selective Entry (Year 7 Entry)',
  'prod_ShnKBAkGwieDH0': 'VIC Selective Entry (Year 9 Entry)'
};

serve(async (req) => {
  console.log('🌐 Webhook received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    console.log('🔍 Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasWebhookSecret: !!webhookSecret
    });

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !webhookSecret) {
      console.error('❌ Missing required environment variables');
      return new Response('Missing environment variables', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return new Response('Missing stripe-signature header', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-08-16',
    });

    const body = await req.text();
    console.log('📝 Webhook body length:', body.length);
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified:', event.type, event.id);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔍 Testing service role database access...');
    const { data: testQuery, error: testError } = await supabase
      .from('user_products')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Service role database test failed:', testError);
    } else {
      console.log('✅ Service role database access confirmed');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('🎉 Processing completed checkout session:', session.id);
      
      const userId = session.metadata?.userId;
      const userEmail = session.customer_email || session.customer_details?.email;

      console.log('📋 Session metadata:', {
        userId,
        userEmail,
        status: session.status,
        paymentStatus: session.payment_status
      });

      if (!userId) {
        console.error('❌ Missing userId in session metadata');
        return new Response('Missing userId in metadata', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      });

      console.log('📦 Processing', lineItems.data.length, 'line items');

      for (const item of lineItems.data) {
        if (item.price?.product && typeof item.price.product === 'object') {
          const stripeProductId = item.price.product.id;
          const dbProductType = STRIPE_PRODUCT_TO_DB_TYPE[stripeProductId];
          
          console.log('🔍 Processing product:', {
            stripeProductId,
            dbProductType,
            userId
          });

          if (!dbProductType) {
            console.error('❌ Unknown Stripe product ID:', stripeProductId);
            continue;
          }

          const { data: existingAccess, error: checkError } = await supabase
            .from('user_products')
            .select('id')
            .eq('user_id', userId)
            .eq('product_type', dbProductType)
            .maybeSingle();

          if (checkError) {
            console.error('❌ Error checking existing access:', checkError);
          }

          if (existingAccess) {
            console.log('✅ User already has access to this product:', dbProductType);
            continue;
          }

          const { data, error } = await supabase
            .from('user_products')
            .insert({
              user_id: userId,
              product_type: dbProductType,
              is_active: true,
              purchased_at: new Date().toISOString(),
              stripe_session_id: session.id,
              stripe_customer_id: session.customer,
              amount_paid: session.amount_total || 0,
              currency: session.currency || 'aud'
            });

          if (error) {
            console.error('❌ Failed to grant product access:', error);
            return new Response(`Failed to grant access: ${error.message}`, { 
              status: 500,
              headers: corsHeaders 
            });
          }

          console.log('✅ Product access granted successfully:', {
            userId,
            productType: dbProductType,
            sessionId: session.id
          });
        }
      }
    } else {
      console.log('ℹ️ Unhandled event type:', event.type);
    }

    console.log('✅ Webhook processed successfully');
    return new Response(JSON.stringify({ received: true }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    
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
    );
  }
});