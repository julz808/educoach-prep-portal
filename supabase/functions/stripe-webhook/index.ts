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
  console.log('🌐 Webhook received:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables with debugging
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    console.log('🔍 Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      stripeKeyPrefix: stripeSecretKey?.substring(0, 8),
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 20),
      hasWebhookSecret: !!webhookSecret
    });

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !webhookSecret) {
      console.error('❌ Missing required environment variables');
      return new Response('Missing environment variables', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Get Stripe signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return new Response('Missing stripe-signature header', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Get raw body for signature verification
    const body = await req.text();
    console.log('📝 Webhook body length:', body.length);

    // Initialize Stripe after getting the body to avoid sync crypto issues
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-08-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    // Verify webhook signature with async handling
    let event: Stripe.Event;
    try {
      // Use manual signature verification to avoid SubtleCryptoProvider issues
      const elements = signature.split(',');
      const signatureElements: { [key: string]: string } = {};
      
      elements.forEach(element => {
        const [key, value] = element.split('=');
        signatureElements[key] = value;
      });

      const timestamp = signatureElements.t;
      const signatures = [signatureElements.v1, signatureElements.v0].filter(Boolean);
      
      if (!timestamp || signatures.length === 0) {
        throw new Error('Unable to extract timestamp and signatures from header');
      }

      // Create the payload for verification
      const payload = timestamp + '.' + body;
      
      // Use crypto.subtle for HMAC verification in Deno
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhookSecret);
      const messageData = encoder.encode(payload);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature_bytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const signature_hex = Array.from(new Uint8Array(signature_bytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Verify signature matches
      const isValid = signatures.some(sig => sig === signature_hex);
      
      if (!isValid) {
        throw new Error('Signature verification failed');
      }
      
      // Parse the event manually since signature is verified
      event = JSON.parse(body) as Stripe.Event;
      console.log('✅ Webhook signature verified manually:', event.type, event.id);
      
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Initialize Supabase with service role (admin access, bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'stripe-webhook@1.0.0'
        }
      }
    });

    // Test database connection and service role permissions
    console.log('🔍 Testing service role database access...');
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('user_products')
        .select('count(*)')
        .limit(1);
      
      if (testError) {
        console.error('❌ Service role database test failed:', testError);
        console.error('Error details:', JSON.stringify(testError, null, 2));
      } else {
        console.log('✅ Service role database access confirmed');
      }
    } catch (dbTestError) {
      console.error('❌ Database connection test failed:', dbTestError);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('🎉 Processing completed checkout session:', session.id);
      
      // Extract metadata from the session
      const userId = session.metadata?.userId;
      const productId = session.metadata?.productId;
      const userEmail = session.customer_email || session.customer_details?.email;

      console.log('📋 Session metadata:', {
        userId,
        productId,
        userEmail,
        status: session.status,
        paymentStatus: session.payment_status
      });

      // Check if this is a guest checkout
      const isGuestCheckout = !userId || userId === 'guest';
      let finalUserId = userId;

      if (isGuestCheckout) {
        console.log('🔍 Guest checkout detected, creating account for:', userEmail);
        
        if (!userEmail) {
          console.error('❌ Missing email for guest checkout');
          return new Response('Missing email for guest checkout', { 
            status: 400,
            headers: corsHeaders 
          });
        }

        // Create user account via Supabase Auth Admin API
        const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
          email: userEmail,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            created_via: 'stripe_purchase',
            stripe_session_id: session.id,
            product_purchased: productId
          }
        });

        if (createUserError) {
          console.error('❌ Error creating user:', createUserError);
          return new Response('Error creating user account', { 
            status: 500,
            headers: corsHeaders 
          });
        }

        if (!authUser.user) {
          console.error('❌ No user returned from createUser');
          return new Response('Failed to create user account', { 
            status: 500,
            headers: corsHeaders 
          });
        }

        finalUserId = authUser.user.id;
        console.log('✅ User account created:', finalUserId);

        // Send password setup email via Supabase auth
        try {
          const { error: emailError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: userEmail,
            options: {
              redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/callback?next=${encodeURIComponent(`/purchase-success?product=${productId}&email=${encodeURIComponent(userEmail)}`)}`
            }
          });
          
          if (emailError) {
            console.error('❌ Error sending setup email:', emailError);
          } else {
            console.log('✅ Password setup email sent to:', userEmail);
          }
        } catch (emailSendError) {
          console.error('❌ Email send error:', emailSendError);
        }
      }

      // Get the line items to determine what was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      });

      console.log('📦 Processing', lineItems.data.length, 'line items');

      // Process each purchased item
      for (const item of lineItems.data) {
        if (item.price?.product && typeof item.price.product === 'object') {
          const stripeProductId = item.price.product.id;
          const dbProductType = STRIPE_PRODUCT_TO_DB_TYPE[stripeProductId];
          
          console.log('🔍 Processing product:', {
            stripeProductId,
            dbProductType,
            userId,
            userEmail: userEmail?.substring(0, 10) + '...'
          });

          if (!dbProductType) {
            console.error('❌ Unknown Stripe product ID:', stripeProductId);
            console.log('Available product mappings:', Object.keys(STRIPE_PRODUCT_TO_DB_TYPE));
            continue;
          }

          // Check if user already has access
          const { data: existingAccess, error: checkError } = await supabase
            .from('user_products')
            .select('id')
            .eq('user_id', finalUserId)
            .eq('product_type', dbProductType)
            .maybeSingle();

          if (checkError) {
            console.error('❌ Error checking existing access:', checkError);
          }

          if (existingAccess) {
            console.log('✅ User already has access to this product:', dbProductType);
            continue;
          }

          // Grant access to the product
          const { data, error } = await supabase
            .from('user_products')
            .insert({
              user_id: finalUserId,
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
            userId: finalUserId,
            productType: dbProductType,
            sessionId: session.id,
            amount: session.amount_total,
            wasGuestCheckout: isGuestCheckout
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
    console.error('Stack:', error.stack);
    
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