import Stripe from 'stripe';

// Comprehensive Stripe webhook diagnostic
const stripeSecretKey = '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';
const expectedWebhookUrl = 'https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear';

if (!stripeSecretKey) {
  console.error('❌ Missing STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-08-16',
});

async function diagnoseWebhookSetup() {
  console.log('🔍 STRIPE WEBHOOK DIAGNOSTIC STARTING...\n');
  
  try {
    // Step 1: List all webhook endpoints
    console.log('1️⃣ Checking webhook endpoints in Stripe...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    console.log(`Found ${webhooks.data.length} webhook endpoints:`);
    
    let correctWebhookFound = false;
    
    for (const webhook of webhooks.data) {
      const isOurWebhook = webhook.url.includes('stripe-webhook') || 
                          webhook.url.includes('mcxxiunseawojmojikvb');
      
      console.log(`\n📍 Webhook: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Status: ${webhook.status}`);
      console.log(`   Events: ${webhook.enabled_events.join(', ')}`);
      console.log(`   Created: ${new Date(webhook.created * 1000).toISOString()}`);
      
      if (webhook.url === expectedWebhookUrl) {
        correctWebhookFound = true;
        console.log('   ✅ This matches our expected URL!');
        
        if (!webhook.enabled_events.includes('checkout.session.completed')) {
          console.log('   ❌ PROBLEM: Missing checkout.session.completed event!');
        } else {
          console.log('   ✅ Has checkout.session.completed event');
        }
        
        if (webhook.status !== 'enabled') {
          console.log('   ❌ PROBLEM: Webhook is not enabled!');
        } else {
          console.log('   ✅ Webhook is enabled');
        }
      } else if (isOurWebhook) {
        console.log('   ⚠️ This looks like our webhook but URL doesn\'t match exactly');
        console.log(`   Expected: ${expectedWebhookUrl}`);
      }
    }
    
    if (!correctWebhookFound) {
      console.log('\n❌ CRITICAL PROBLEM: No webhook found with the expected URL!');
      console.log(`Expected URL: ${expectedWebhookUrl}`);
      console.log('\nThis explains why webhook is not being called.');
    }
    
    // Step 2: Check recent webhook attempts
    console.log('\n2️⃣ Checking recent webhook delivery attempts...');
    
    for (const webhook of webhooks.data) {
      if (webhook.url.includes('stripe-webhook') || 
          webhook.url.includes('mcxxiunseawojmojikvb')) {
        
        try {
          const attempts = await stripe.webhookEndpoints.listAttempts(webhook.id, {
            limit: 10
          });
          
          console.log(`\n📨 Recent attempts for ${webhook.url}:`);
          
          if (attempts.data.length === 0) {
            console.log('   ❌ NO RECENT ATTEMPTS - This confirms webhook is not being triggered');
          } else {
            for (const attempt of attempts.data.slice(0, 5)) {
              console.log(`   📅 ${new Date(attempt.created * 1000).toISOString()}`);
              console.log(`   📊 Response: ${attempt.response_status_code}`);
              console.log(`   ⏱️ Duration: ${attempt.response_time}ms`);
              if (attempt.response_status_code >= 400) {
                console.log(`   ❌ ERROR: ${attempt.response_status_code}`);
              }
            }
          }
        } catch (error) {
          console.log(`   ⚠️ Could not fetch attempts: ${error.message}`);
        }
      }
    }
    
    // Step 3: Check recent events
    console.log('\n3️⃣ Checking recent checkout.session.completed events...');
    
    const recentEvents = await stripe.events.list({
      type: 'checkout.session.completed',
      limit: 5
    });
    
    console.log(`Found ${recentEvents.data.length} recent checkout.session.completed events:`);
    
    for (const event of recentEvents.data) {
      console.log(`\n🎯 Event: ${event.id}`);
      console.log(`   Created: ${new Date(event.created * 1000).toISOString()}`);
      console.log(`   Webhook attempts: ${event.request ? 'Yes' : 'No'}`);
      
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`   Session: ${session.id}`);
      console.log(`   Customer email: ${session.customer_email || session.customer_details?.email}`);
      console.log(`   Payment status: ${session.payment_status}`);
      console.log(`   Amount: ${session.amount_total} ${session.currency?.toUpperCase()}`);
      
      if (session.metadata?.userId) {
        console.log(`   User ID: ${session.metadata.userId}`);
      } else {
        console.log('   ❌ PROBLEM: No userId in metadata!');
      }
    }
    
    // Step 4: Recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    
    if (!correctWebhookFound) {
      console.log('1. ❌ CRITICAL: Create or update webhook endpoint in Stripe Dashboard');
      console.log(`   URL should be: ${expectedWebhookUrl}`);
      console.log('   Events should include: checkout.session.completed');
      console.log('   Status should be: enabled');
    }
    
    console.log('2. 🧪 Test webhook endpoint directly with curl:');
    console.log(`   curl -X POST ${expectedWebhookUrl} -H "Content-Type: application/json" -d '{}'`);
    
    console.log('3. 📊 Check Supabase Edge Function logs for any errors');
    console.log('4. 🔄 Make a test purchase to verify webhook triggers');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Full error:', error);
  }
}

diagnoseWebhookSetup();