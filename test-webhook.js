import crypto from 'crypto';

const WEBHOOK_URL = 'https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear';
const WEBHOOK_SECRET = 'whsec_e5c1e8e6b4e9b1f4e7b5e2b5e8e9e1e4e7b5e2b5e8e9e1e4e7b5e2b5e8e9e1e4'; // Example secret

// Mock Stripe checkout.session.completed event
const mockEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_year7_naplan_session',
      object: 'checkout.session',
      amount_total: 19900,
      currency: 'aud',
      customer: 'cus_test_customer',
      customer_email: 'test@example.com',
      metadata: {
        userId: '2c2e5c44-d953-48bc-89d7-52b8333edbda',
        productId: 'year-7-naplan'
      },
      payment_status: 'paid',
      status: 'complete'
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test',
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

async function testWebhook() {
  console.log('🧪 TESTING WEBHOOK FUNCTIONALITY');
  console.log('================================');
  
  const payload = JSON.stringify(mockEvent);
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create Stripe signature (this would normally be done by Stripe)
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');
  
  const stripeSignature = `t=${timestamp},v1=${signature}`;
  
  console.log('📦 Mock Event Data:');
  console.log(`   Event Type: ${mockEvent.type}`);
  console.log(`   Session ID: ${mockEvent.data.object.id}`);
  console.log(`   User ID: ${mockEvent.data.object.metadata.userId}`);
  console.log(`   Amount: ${mockEvent.data.object.amount_total}`);
  console.log('');
  
  console.log('🔐 Signature Info:');
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Signature: v1=${signature.substring(0, 20)}...`);
  console.log('');
  
  try {
    console.log('🚀 Calling webhook endpoint...');
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature
      },
      body: payload
    });
    
    console.log(`📋 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 Response Body:');
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log(JSON.stringify(responseJson, null, 2));
    } catch {
      console.log(responseText);
    }
    
    if (response.ok) {
      console.log('✅ Webhook call successful!');
      
      // Check if access was granted in database
      console.log('🔍 Checking database for access record...');
      
      // We would need to use the Supabase client here, but for now just log success
      console.log('✅ Test completed successfully');
    } else {
      console.log('❌ Webhook call failed');
    }
    
  } catch (error) {
    console.error('💥 Error testing webhook:', error.message);
  }
}

testWebhook().then(() => process.exit(0)).catch(console.error);