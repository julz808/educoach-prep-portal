import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

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
      'X-Client-Info': 'webhook-debug@1.0.0'
    }
  }
});

async function debugWebhookFlow() {
  console.log('🔍 Debugging webhook flow for juliansunou@gmail.com...\n');

  const userEmail = 'juliansunou@gmail.com';

  // 1. Check if user exists
  console.log('1. Checking if user already exists...');
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error listing users:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === userEmail);
  if (existingUser) {
    console.log('✅ User exists:', {
      id: existingUser.id,
      email: existingUser.email,
      created_at: existingUser.created_at,
      email_confirmed_at: existingUser.email_confirmed_at
    });

    // 2. Simulate what the webhook would do for guest checkout
    console.log('\n2. Testing webhook user creation logic...');
    
    // The webhook would try to create a user - let's see what happens
    try {
      const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: {
          created_via: 'stripe_purchase',
          stripe_session_id: 'test-session-123',
          product_purchased: 'vic-selective'
        }
      });

      if (createUserError) {
        console.log('❌ User creation would fail (expected for existing user):', createUserError.message);
        
        // The webhook would use the existing user ID
        console.log('🔄 Using existing user ID for product access...');
        await testProductAccess(existingUser.id);
        
      } else if (authUser.user) {
        console.log('✅ New user would be created:', authUser.user.id);
        await testProductAccess(authUser.user.id);
      }
    } catch (error) {
      console.error('❌ Exception in user creation:', error);
    }

  } else {
    console.log('❌ User does not exist');
  }
}

async function testProductAccess(userId) {
  console.log(`\n3. Testing product access grant for user: ${userId}`);
  
  const dbProductType = 'VIC Selective Entry (Year 9 Entry)';
  const sessionId = 'cs_live_b1FjuqmNQqYqc4OxRcpFi19xinjqfV2rqu2HsU1kxKpJFI5TkdSBSwlRkh';

  // Check if user already has access (like webhook does)
  const { data: existingAccess, error: checkError } = await supabase
    .from('user_products')
    .select('id')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking existing access:', checkError);
    return;
  }

  if (existingAccess) {
    console.log('✅ User already has access to this product:', dbProductType);
    return;
  }

  // Grant access to the product (like webhook does)
  const { data, error } = await supabase
    .from('user_products')
    .insert({
      user_id: userId,
      product_type: dbProductType,
      is_active: true,
      purchased_at: new Date().toISOString(),
      stripe_session_id: sessionId,
      stripe_customer_id: 'test-customer',
      amount_paid: 0,
      currency: 'aud'
    });

  if (error) {
    console.error('❌ Failed to grant product access:', error);
  } else {
    console.log('✅ Product access granted successfully:', {
      userId,
      productType: dbProductType,
      sessionId
    });
  }

  // Verify
  const { data: verifyData, error: verifyError } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
  } else {
    console.log(`✅ Verification: User has ${verifyData.length} products`);
  }
}

debugWebhookFlow().catch(console.error);