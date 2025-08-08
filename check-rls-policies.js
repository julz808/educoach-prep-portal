import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for user_products table...\n');

  // Get RLS status for user_products table
  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('get_table_rls_status', { table_name: 'user_products' })
    .single();

  if (rlsError) {
    console.log('❌ Could not check RLS status:', rlsError.message);
    
    // Try alternative approach - check pg_tables directly
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'user_products');
    
    if (tablesError) {
      console.log('❌ Could not check table info:', tablesError.message);
    } else if (tables.length > 0) {
      console.log('✅ Table info:', tables[0]);
    }
  } else {
    console.log('✅ RLS Status:', rlsStatus);
  }

  // Get policies for user_products table
  console.log('\n🔍 Checking policies...');
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('schemaname', 'public')
    .eq('tablename', 'user_products');

  if (policiesError) {
    console.log('❌ Could not fetch policies:', policiesError.message);
  } else {
    console.log(`✅ Found ${policies.length} policies:`);
    policies.forEach(policy => {
      console.log(`  - ${policy.policyname}: ${policy.cmd} - ${policy.qual}`);
    });
  }

  // Test direct query as authenticated user
  console.log('\n🔍 Testing authenticated user access...');
  
  // First, let's try to sign in as the user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'juliansunou@gmail.com',
    password: 'test123456' // This might not work, but let's try
  });

  if (signInError) {
    console.log('❌ Could not sign in user (expected):', signInError.message);
    
    // Let's check what happens when we query with the user's ID using service role
    console.log('\n🔍 Using service role to check user access...');
    
    const userId = 'c9435b2d-4548-4127-a7b7-24d873c9d695';
    const { data: serviceRoleData, error: serviceRoleError } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId);
    
    if (serviceRoleError) {
      console.log('❌ Service role query failed:', serviceRoleError);
    } else {
      console.log(`✅ Service role sees ${serviceRoleData.length} products:`, serviceRoleData);
    }
  }
}

checkRLSPolicies().catch(console.error);