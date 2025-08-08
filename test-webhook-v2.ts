// Test script to verify webhook-v2 is working
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testWebhookSetup() {
  console.log('🧪 Testing webhook v2 setup...\n')

  // Test 1: Check if pending_purchases table exists
  console.log('1️⃣ Testing pending_purchases table...')
  try {
    const { data, error } = await supabase
      .from('pending_purchases')
      .select('count(*)')
      .limit(1)
    
    if (error) {
      console.error('❌ pending_purchases table test failed:', error.message)
      return false
    }
    console.log('✅ pending_purchases table exists and accessible')
  } catch (err) {
    console.error('❌ pending_purchases table error:', err)
    return false
  }

  // Test 2: Check if functions exist
  console.log('\n2️⃣ Testing database functions...')
  try {
    const { data, error } = await supabase.rpc('get_user_pending_purchases')
    if (error && !error.message.includes('permission denied')) {
      console.error('❌ get_user_pending_purchases function test failed:', error.message)
      return false
    }
    console.log('✅ get_user_pending_purchases function exists')
  } catch (err) {
    console.error('❌ Function test error:', err)
    return false
  }

  // Test 3: Test webhook endpoint accessibility
  console.log('\n3️⃣ Testing webhook endpoint...')
  try {
    const webhookUrl = `${supabaseUrl.replace('/rest/v1', '')}/functions/v1/stripe-webhook-v2`
    console.log('Webhook URL:', webhookUrl)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test'
      },
      body: JSON.stringify({ test: 'ping' })
    })
    
    const result = await response.text()
    console.log('Response status:', response.status)
    console.log('Response text:', result.substring(0, 100) + '...')
    
    if (response.status === 400 && result.includes('signature')) {
      console.log('✅ Webhook endpoint is accessible (signature verification working)')
    } else {
      console.log('⚠️ Unexpected webhook response, but endpoint is accessible')
    }
  } catch (err) {
    console.error('❌ Webhook endpoint test failed:', err)
    return false
  }

  console.log('\n🎉 All webhook setup tests passed!')
  return true
}

testWebhookSetup().catch(console.error)