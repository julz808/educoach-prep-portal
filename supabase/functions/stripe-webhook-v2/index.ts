import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@12.9.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Stripe Product ID to Database Product Type mapping - CORRECTED WITH ACTUAL IDs
const STRIPE_PRODUCT_TO_DB_TYPE: { [key: string]: string } = {
  // ACTUAL STRIPE PRODUCT IDs FROM USER'S ACCOUNT
  'prod_ShqrKwKE5Ii2rZ': 'VIC Selective Entry (Year 9 Entry)',     // VIC selective
  'prod_ShqqjPuJGAP2FW': 'NSW Selective Entry (Year 7 Entry)',     // NSW selective  
  'prod_ShqqrSpEygs1Da': 'ACER Scholarship (Year 7 Entry)',        // ACER
  'prod_ShqpEsp5rkFKmf': 'EduTest Scholarship (Year 7 Entry)',     // EduTest
  'prod_ShqppA31VnjzIP': 'Year 7 NAPLAN',                          // Year 7 NAPLAN
  'prod_Shqo1r4nLXrZ1O': 'Year 5 NAPLAN'                           // Year 5 NAPLAN
};

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !webhookSecret) {
      console.error('❌ Missing required environment variables');
      return new Response('Server configuration error', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
    });

    // Get request body
    const body = await req.text();

    console.log('🎯 Webhook received with signature verification...');
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      // Use manual signature verification
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

      const payload = timestamp + '.' + body;
      
      // Use crypto.subtle for HMAC verification
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
      
      const isValidSignature = signatures.some(sig => 
        signature_hex === sig
      );

      if (!isValidSignature) {
        console.error('❌ Invalid signature');
        throw new Error('Invalid signature');
      }

      event = JSON.parse(body);
      console.log('✅ Webhook signature verified successfully');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Initialize Supabase with service role
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
          'X-Client-Info': 'stripe-webhook-v2@1.0.0'
        }
      }
    });

    // Test database connection
    console.log('🔍 Testing service role database access...');
    try {
      const { count, error: testError } = await supabase
        .from('pending_purchases')
        .select('*', { count: 'exact', head: true });
      
      if (testError) {
        console.error('❌ Service role database test failed:', testError);
      } else {
        console.log('✅ Service role database access confirmed, pending_purchases count:', count);
      }
    } catch (dbTestError) {
      console.error('❌ Database connection test failed:', dbTestError);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('🎉 Processing completed checkout session:', session.id);
      
      // Extract metadata and customer info
      const userId = session.metadata?.userId;
      const productId = session.metadata?.productId;
      const userEmail = session.customer_email || session.customer_details?.email;

      console.log('📋 Session details:', {
        userId,
        productId,
        userEmail: userEmail ? `${userEmail.substring(0, 10)}...` : 'none',
        status: session.status,
        paymentStatus: session.payment_status
      });

      if (!userEmail) {
        console.error('❌ Missing customer email');
        return new Response('Missing customer email', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Check if this is a guest checkout
      const isGuestCheckout = !userId || userId === 'guest';

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
            isGuestCheckout,
            userEmail: userEmail?.substring(0, 10) + '...'
          });

          if (!dbProductType) {
            console.error('❌ Unknown Stripe product ID:', stripeProductId);
            console.log('Available product mappings:', Object.keys(STRIPE_PRODUCT_TO_DB_TYPE));
            
            // Try to map from metadata productId as fallback
            const metadataProductId = session.metadata?.productId;
            console.log('🔄 Trying metadata productId fallback:', metadataProductId);
            
            let fallbackProductType: string | undefined;
            if (metadataProductId) {
              // Map common metadata productId values to DB types
              const METADATA_TO_DB_TYPE: { [key: string]: string } = {
                'year-7-naplan': 'Year 7 NAPLAN',
                'year-5-naplan': 'Year 5 NAPLAN',
                'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
                'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
                'edutest-scholarship': 'EduTest Scholarship (Year 7 Entry)',
                'acer-scholarship': 'ACER Scholarship (Year 7 Entry)'
              };
              
              fallbackProductType = METADATA_TO_DB_TYPE[metadataProductId];
            }
            
            if (fallbackProductType) {
              console.log('✅ Using fallback product type:', fallbackProductType);
              // Use the fallback type (don't modify const object)
              dbProductType = fallbackProductType;
            } else {
              console.error('❌ No fallback mapping found for metadata productId:', metadataProductId);
              continue;
            }
          }

          if (isGuestCheckout) {
            // GUEST PURCHASE: Store as pending purchase
            console.log('💳 Guest purchase - storing as pending purchase');
            
            try {
              const { data: pendingPurchase, error: pendingError } = await supabase
                .from('pending_purchases')
                .insert({
                  customer_email: userEmail,
                  product_type: dbProductType,
                  stripe_session_id: session.id,
                  stripe_customer_id: session.customer || null,
                  amount_paid: item.amount_total || 0,
                  currency: session.currency || 'aud',
                  payment_status: session.payment_status,
                  stripe_metadata: session.metadata || {}
                })
                .select()
                .single();

              if (pendingError) {
                console.error('❌ Error creating pending purchase:', pendingError);
                return new Response('Error storing purchase', { 
                  status: 500,
                  headers: corsHeaders 
                });
              }

              console.log('✅ Pending purchase created:', pendingPurchase.id);

              // Send purchase confirmation email with registration invitation
              console.log('📧 Sending purchase confirmation email...');
              
              // Note: In production, you'd send a custom email here
              // For now, we'll rely on the registration flow to handle this
              console.log('✅ Purchase stored successfully. User will be invited to register.');

            } catch (error) {
              console.error('❌ Error processing guest purchase:', error);
              return new Response('Error processing purchase', { 
                status: 500,
                headers: corsHeaders 
              });
            }

          } else {
            // AUTHENTICATED USER PURCHASE: Grant access immediately
            console.log('👤 Authenticated user purchase - granting immediate access');
            
            // Verify user exists
            const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(userId);
            
            if (userError || !existingUser.user) {
              console.error('❌ User not found:', userId);
              return new Response('User not found', { 
                status: 400,
                headers: corsHeaders 
              });
            }

            // Check if user already has access
            const { data: existingAccess, error: checkError } = await supabase
              .from('user_products')
              .select('id')
              .eq('user_id', userId)
              .eq('product_type', dbProductType)
              .single();

            if (checkError && checkError.code !== 'PGRST116') { // Not found is OK
              console.error('❌ Error checking existing access:', checkError);
              continue;
            }

            if (existingAccess) {
              console.log('ℹ️ User already has access to product:', dbProductType);
              continue;
            }

            // Grant access by creating user_products record
            const { data: newAccess, error: accessError } = await supabase
              .from('user_products')
              .insert({
                user_id: userId,
                product_type: dbProductType,
                stripe_session_id: session.id,
                stripe_customer_id: session.customer || null,
                amount_paid: item.amount_total || 0,
                currency: session.currency || 'aud',
                is_active: true
              })
              .select()
              .single();

            if (accessError) {
              console.error('❌ Error granting product access:', accessError);
              return new Response('Error granting access', { 
                status: 500,
                headers: corsHeaders 
              });
            }

            console.log('✅ Product access granted:', newAccess.id);
          }
        }
      }

      console.log('✅ Webhook processing completed successfully');
      return new Response('Webhook processed successfully', { 
        status: 200,
        headers: corsHeaders 
      });

    } else {
      console.log(`⏭️ Unhandled event type: ${event.type}`);
      return new Response('Unhandled event type', { 
        status: 200,
        headers: corsHeaders 
      });
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return new Response(`Webhook Error: ${error.message}`, { 
      status: 400,
      headers: corsHeaders 
    });
  }
})