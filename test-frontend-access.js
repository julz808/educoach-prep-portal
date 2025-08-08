import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.TNpEFgSITMB1ZBIfhQkmkpgudf5bfxH3vVqJPgHPLjY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAccess() {
  console.log('🔍 Testing frontend access logic...\n');

  const userId = 'c9435b2d-4548-4127-a7b7-24d873c9d695';
  const productType = 'VIC Selective Entry (Year 9 Entry)';

  // Test the exact same query the frontend uses
  console.log('1. Testing hasProductAccess query...');
  const { data, error } = await supabase
    .from('user_products')
    .select('id')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error checking product access:', error);
    return false;
  }

  const hasAccess = !!data;
  console.log(`✅ hasProductAccess result: ${hasAccess}`);
  if (data) {
    console.log('   Access record ID:', data.id);
  }

  // Test getUserProducts query
  console.log('\n2. Testing getUserProducts query...');
  const { data: products, error: productsError } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (productsError) {
    console.error('❌ Error fetching user products:', productsError);
  } else {
    console.log(`✅ Found ${products.length} active products:`);
    products.forEach(product => {
      console.log(`   - ${product.product_type} (purchased: ${product.purchased_at})`);
    });
  }

  // Test with authentication context (what the frontend would use)
  console.log('\n3. Testing with RLS (Row Level Security)...');
  // Note: This will fail without proper auth token, but let's see what happens
}

testFrontendAccess().catch(console.error);