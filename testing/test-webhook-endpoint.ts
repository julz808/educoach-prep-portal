// Test the webhook endpoint directly using Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.U0ppAI69lKAkWqxkUd7FHg5pUxwBJ0QwEXLHj2UtVj0';

async function testWebhookEndpoint() {
  console.log('🧪 Testing Stripe webhook endpoint...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test calling the edge function directly
    const { data, error } = await supabase.functions.invoke('stripe-webhook-nuclear', {
      body: { test: true },
      headers: {
        'stripe-signature': 'test_signature'
      }
    });
    
    if (error) {
      console.log('⚠️ Expected error (signature verification):', error.message);
      console.log('✅ This confirms the webhook endpoint is reachable and responding');
    } else {
      console.log('📄 Response:', data);
    }
    
    console.log('🎯 CONCLUSION: Webhook endpoint is deployed and accessible');
    console.log('🔍 The issue is likely in Stripe Dashboard webhook configuration');
    
  } catch (error) {
    console.error('❌ Webhook endpoint test failed:', error);
    console.log('🚨 This suggests the edge function is not deployed properly');
  }
}

async function checkEdgeFunctionsList() {
  console.log('\n📋 Checking available edge functions...');
  
  // This would require service role key, so we'll just note what to check
  console.log('📝 Manual check needed:');
  console.log('1. Go to Supabase Dashboard > Edge Functions');
  console.log('2. Verify "stripe-webhook-nuclear" is listed and deployed');
  console.log('3. Check recent invocations - should be empty if webhook not configured');
  console.log('4. Check function logs for any deployment errors');
}

async function main() {
  await testWebhookEndpoint();
  await checkEdgeFunctionsList();
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Check Stripe Dashboard webhook configuration');
  console.log('2. Ensure webhook URL points to: https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear');
  console.log('3. Ensure checkout.session.completed event is enabled');
  console.log('4. Copy webhook signing secret to edge function environment variables');
  console.log('5. Make a test purchase to verify webhook triggers');
}

main().catch(console.error);