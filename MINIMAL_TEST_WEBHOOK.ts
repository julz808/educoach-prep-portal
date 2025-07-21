import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  console.log('🧪 MINIMAL TEST WEBHOOK:', req.method, req.url);
  console.log('🧪 Headers received:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get all environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    console.log('🧪 Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      stripeKeyLength: stripeSecretKey?.length,
      stripeKeyStart: stripeSecretKey?.substring(0, 8),
      hasWebhookSecret: !!webhookSecret,
      webhookSecretLength: webhookSecret?.length,
      webhookSecretStart: webhookSecret?.substring(0, 8)
    });

    // Get the stripe signature
    const signature = req.headers.get('stripe-signature');
    console.log('🧪 Stripe signature:', {
      hasSignature: !!signature,
      signatureLength: signature?.length,
      signatureStart: signature?.substring(0, 20)
    });

    // Get the body
    const body = await req.text();
    console.log('🧪 Body info:', {
      bodyLength: body.length,
      bodyStart: body.substring(0, 100)
    });

    // Return success without doing anything else
    console.log('✅ MINIMAL TEST SUCCESS - No actual processing');
    return new Response(JSON.stringify({ 
      test: true, 
      received: true,
      message: 'Minimal test webhook successful'
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200,
    });

  } catch (error: any) {
    console.error('💥 MINIMAL TEST ERROR:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      test: true
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500,
    });
  }
});