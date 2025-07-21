import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

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
  console.log('🚀 FIXED NUCLEAR WEBHOOK ACTIVE:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    console.log('🔧 Fixed nuclear webhook environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasWebhookSecret: !!webhookSecret
    });

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !webhookSecret) {
      console.error('💥 Missing environment variables');
      return new Response('Missing environment variables', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('💥 Missing stripe signature');
      return new Response('Missing stripe-signature header', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-08-16',
    });

    const body = await req.text();
    console.log('📦 Webhook body length:', body.length);
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('🎯 FIXED NUCLEAR signature verified:', event.type, event.id);
    } catch (err: any) {
      console.error('💥 Signature verification failed:', err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // 🔥 CRITICAL FIX: Proper Supabase service role authentication
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'X-Client-Info': 'fixed-nuclear-webhook'
        }
      }
    });

    console.log('🧪 Testing FIXED nuclear database access...');
    const { data: testQuery, error: testError } = await supabase
      .from('user_products')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('💥 FIXED Database test failed:', testError);
      console.error('Error details:', JSON.stringify(testError, null, 2));
    } else {
      console.log('🎯 FIXED Nuclear database access CONFIRMED');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('🎉 FIXED NUCLEAR PROCESSING:', session.id);
      
      const userId = session.metadata?.userId;
      const userEmail = session.customer_email || session.customer_details?.email;

      console.log('📋 Fixed nuclear session data:', {
        userId,
        userEmail,
        status: session.status,
        paymentStatus: session.payment_status
      });

      if (!userId) {
        console.error('💥 Missing userId');
        return new Response('Missing userId in metadata', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      });

      console.log('🛒 Fixed nuclear processing', lineItems.data.length, 'items');

      for (const item of lineItems.data) {
        if (item.price?.product && typeof item.price.product === 'object') {
          const stripeProductId = item.price.product.id;
          const dbProductType = STRIPE_PRODUCT_TO_DB_TYPE[stripeProductId];
          
          console.log('🎯 Fixed nuclear product processing:', {
            stripeProductId,
            dbProductType,
            userId
          });

          if (!dbProductType) {
            console.error('💥 Unknown product ID:', stripeProductId);
            continue;
          }

          const { data: existingAccess, error: checkError } = await supabase
            .from('user_products')
            .select('id')
            .eq('user_id', userId)
            .eq('product_type', dbProductType)
            .maybeSingle();

          if (checkError) {
            console.error('💥 Access check error:', checkError);
          }

          if (existingAccess) {
            console.log('✅ Fixed nuclear: User already has access:', dbProductType);
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
            console.error('💥 FIXED Nuclear access grant FAILED:', error);
            console.error('Database error details:', JSON.stringify(error, null, 2));
            return new Response(`Failed to grant access: ${error.message}`, { 
              status: 500,
              headers: corsHeaders 
            });
          }

          console.log('🚀 FIXED NUCLEAR ACCESS GRANTED:', {
            userId,
            productType: dbProductType,
            sessionId: session.id
          });
        }
      }
    } else {
      console.log('ℹ️ Fixed nuclear: Unhandled event type:', event.type);
    }

    console.log('🎯 FIXED NUCLEAR WEBHOOK SUCCESS');
    return new Response(JSON.stringify({ received: true, fixed: true }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200,
    });

  } catch (error: any) {
    console.error('💥 FIXED NUCLEAR WEBHOOK ERROR:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Fixed nuclear webhook error',
        stack: error.stack
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