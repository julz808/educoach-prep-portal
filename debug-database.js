import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDatabase() {
  console.log('🔍 Debugging database for juliansunou@gmail.com...\n');

  // 1. Check auth.users
  console.log('1. Checking auth.users...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching users:', authError);
  } else {
    const testUser = authUsers.users.find(u => u.email === 'juliansunou@gmail.com');
    if (testUser) {
      console.log('✅ User found in auth.users:', {
        id: testUser.id,
        email: testUser.email,
        created_at: testUser.created_at,
        email_confirmed_at: testUser.email_confirmed_at
      });
    } else {
      console.log('❌ User NOT found in auth.users');
    }
  }

  // 2. Check profiles
  console.log('\n2. Checking profiles...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'juliansunou@gmail.com');
  
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
  } else if (profiles.length > 0) {
    console.log('✅ Profile found:', profiles[0]);
  } else {
    console.log('❌ Profile NOT found');
  }

  // 3. Check user_products
  console.log('\n3. Checking user_products...');
  const { data: userProducts, error: productsError } = await supabase
    .from('user_products')
    .select(`
      *,
      profiles!inner(email)
    `)
    .eq('profiles.email', 'juliansunou@gmail.com');
  
  if (productsError) {
    console.error('Error fetching user_products:', productsError);
  } else if (userProducts.length > 0) {
    console.log('✅ Product access found:', userProducts);
  } else {
    console.log('❌ Product access NOT found');
  }

  // 4. Check all recent user_products (last 2 hours)
  console.log('\n4. Checking all recent user_products...');
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: recentProducts, error: recentError } = await supabase
    .from('user_products')
    .select(`
      *,
      profiles!inner(email)
    `)
    .gte('created_at', twoHoursAgo)
    .order('created_at', { ascending: false });
  
  if (recentError) {
    console.error('Error fetching recent products:', recentError);
  } else {
    console.log(`✅ Found ${recentProducts.length} recent product access records:`);
    recentProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.profiles.email} - ${product.product_type} (${product.created_at})`);
    });
  }

  // 5. Check pending purchases
  console.log('\n5. Checking pending_purchases...');
  const { data: pendingPurchases, error: pendingError } = await supabase
    .from('pending_purchases')
    .select('*')
    .eq('email', 'juliansunou@gmail.com')
    .order('created_at', { ascending: false });
  
  if (pendingError) {
    console.error('Error fetching pending purchases:', pendingError);
  } else if (pendingPurchases.length > 0) {
    console.log('✅ Pending purchases found:', pendingPurchases);
  } else {
    console.log('❌ No pending purchases found');
  }
}

debugDatabase().catch(console.error);