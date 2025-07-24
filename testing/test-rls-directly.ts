import { createClient } from '@supabase/supabase-js';

// Test RLS policies directly using different authentication contexts
const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.U0ppAI69lKAkWqxkUd7FHg5pUxwBJ0QwEXLHj2UtVj0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

async function testRLSPolicies() {
  console.log('🧪 Testing RLS policies for user_products table');
  
  const targetUserId = '2c2e5c44-d953-48bc-89d7-52b8333edbda';
  const productType = 'ACER Scholarship (Year 7 Entry)';
  
  // Test 1: Service role access (should always work)
  console.log('\n1️⃣ Testing service role access...');
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('user_products')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('product_type', productType);
      
    if (serviceError) {
      console.error('❌ Service role query failed:', serviceError);
    } else {
      console.log('✅ Service role query succeeded, records found:', serviceData?.length || 0);
      if (serviceData && serviceData.length > 0) {
        console.log('📄 Records:', serviceData);
      }
    }
  } catch (error) {
    console.error('❌ Service role query exception:', error);
  }
  
  // Test 2: Anonymous client access (should fail with RLS)
  console.log('\n2️⃣ Testing anonymous access...');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: anonData, error: anonError } = await anonClient
      .from('user_products')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('product_type', productType);
      
    if (anonError) {
      console.log('✅ Anonymous access correctly blocked:', anonError.message);
    } else {
      console.warn('⚠️ Anonymous access unexpectedly succeeded:', anonData?.length || 0);
    }
  } catch (error) {
    console.log('✅ Anonymous access correctly threw exception:', error.message);
  }
  
  // Test 3: Check if target user exists
  console.log('\n3️⃣ Checking if target user exists...');
  try {
    const { data: userList, error: userError } = await serviceClient.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
    } else {
      const targetUser = userList.users.find(u => u.id === targetUserId);
      if (targetUser) {
        console.log('✅ Target user found:', {
          id: targetUser.id,
          email: targetUser.email,
          created_at: targetUser.created_at,
          confirmed_at: targetUser.confirmed_at
        });
      } else {
        console.error('❌ Target user not found in auth.users');
      }
    }
  } catch (error) {
    console.error('❌ Error checking user existence:', error);
  }
  
  // Test 4: Create a test record to verify INSERT policy works
  console.log('\n4️⃣ Testing INSERT policy with service role...');
  try {
    const { data: insertData, error: insertError } = await serviceClient
      .from('user_products')
      .upsert({
        user_id: targetUserId,
        product_type: productType,
        is_active: true,
        purchased_at: new Date().toISOString(),
        stripe_session_id: 'test_rls_check',
        amount_paid: 19900,
        currency: 'aud'
      }, {
        onConflict: 'user_id,product_type'
      })
      .select();
      
    if (insertError) {
      console.error('❌ INSERT failed:', insertError);
    } else {
      console.log('✅ INSERT succeeded:', insertData);
    }
  } catch (error) {
    console.error('❌ INSERT exception:', error);
  }
  
  // Test 5: Verify the record exists after insert
  console.log('\n5️⃣ Verifying record exists after insert...');
  try {
    const { data: verifyData, error: verifyError } = await serviceClient
      .from('user_products')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('product_type', productType);
      
    if (verifyError) {
      console.error('❌ Verification query failed:', verifyError);
    } else {
      console.log('✅ Verification succeeded, records found:', verifyData?.length || 0);
      if (verifyData && verifyData.length > 0) {
        console.log('📄 Current record:', verifyData[0]);
      }
    }
  } catch (error) {
    console.error('❌ Verification exception:', error);
  }
}

testRLSPolicies().catch(console.error);