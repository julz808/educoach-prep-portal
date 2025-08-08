import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.TNpEFgSITMB1ZBIfhQkmkpgudf5bfxH3vVqJPgHPLjY';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

// Client that user would use
const userClient = createClient(supabaseUrl, supabaseAnonKey);
// Admin client
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthenticatedAccess() {
  console.log('🔍 Testing authenticated access flow...\n');

  const userId = 'c9435b2d-4548-4127-a7b7-24d873c9d695';
  const userEmail = 'juliansunou@gmail.com';
  const productType = 'VIC Selective Entry (Year 9 Entry)';

  // 1. Set a simple password for the user using admin client
  console.log('1. Setting password for user...');
  const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
    userId,
    { password: 'testpassword123' }
  );

  if (updateError) {
    console.error('❌ Failed to set password:', updateError.message);
    return;
  }
  console.log('✅ Password set for user');

  // 2. Sign in as the user
  console.log('\n2. Signing in as user...');
  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email: userEmail,
    password: 'testpassword123'
  });

  if (signInError) {
    console.error('❌ Sign in failed:', signInError.message);
    return;
  }
  
  console.log('✅ User signed in successfully');
  console.log('   User ID:', signInData.user?.id);
  console.log('   Session exists:', !!signInData.session);

  // 3. Test product access query as authenticated user
  console.log('\n3. Testing product access as authenticated user...');
  const { data: products, error: productsError } = await userClient
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (productsError) {
    console.error('❌ Product access query failed:', productsError);
  } else {
    console.log(`✅ Authenticated user sees ${products.length} products:`);
    products.forEach(product => {
      console.log(`   - ${product.product_type} (${product.id})`);
    });
  }

  // 4. Test the specific hasProductAccess query
  console.log('\n4. Testing hasProductAccess query...');
  const { data: accessData, error: accessError } = await userClient
    .from('user_products')
    .select('id')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .eq('is_active', true)
    .single();

  if (accessError && accessError.code !== 'PGRST116') {
    console.error('❌ Access check failed:', accessError);
  } else {
    const hasAccess = !!accessData;
    console.log(`✅ hasProductAccess result: ${hasAccess}`);
  }

  // 5. Test what happens when the user checks "VIC selective" (what the dashboard shows)
  console.log('\n5. Testing VIC Selective access check...');
  
  // The frontend might be checking for different product type strings
  const possibleProductTypes = [
    'VIC Selective Entry (Year 9 Entry)',
    'VIC Selective Entry', 
    'vic-selective',
    'VIC selective',
    'VIC Selective'
  ];

  for (const testProductType of possibleProductTypes) {
    const { data: testData, error: testError } = await userClient
      .from('user_products')
      .select('id, product_type')
      .eq('user_id', userId)
      .eq('product_type', testProductType)
      .eq('is_active', true)
      .maybeSingle();

    if (testError && testError.code !== 'PGRST116') {
      console.log(`   ❌ "${testProductType}": Error - ${testError.message}`);
    } else {
      const hasThisAccess = !!testData;
      console.log(`   ${hasThisAccess ? '✅' : '❌'} "${testProductType}": ${hasThisAccess}`);
    }
  }
}

testAuthenticatedAccess().catch(console.error);