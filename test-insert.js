import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  console.log('🔍 Testing user_products insert...\n');

  const userId = 'c9435b2d-4548-4127-a7b7-24d873c9d695';
  const dbProductType = 'VIC Selective Entry (Year 9 Entry)';
  const sessionId = 'test-session-id';

  // First check if user already has access
  console.log('1. Checking existing access...');
  const { data: existingAccess, error: checkError } = await supabase
    .from('user_products')
    .select('id')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking existing access:', checkError);
  } else if (existingAccess) {
    console.log('✅ User already has access:', existingAccess);
  } else {
    console.log('✅ No existing access found');
  }

  // Now try to insert
  console.log('\n2. Attempting insert...');
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
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Insert successful:', data);
  }

  // Check if the record was actually created
  console.log('\n3. Verifying insert...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
  } else {
    console.log(`✅ Found ${verifyData.length} records:`, verifyData);
  }

  // Check user_products table structure
  console.log('\n4. Checking table structure...');
  const { data: tableData, error: tableError } = await supabase
    .from('user_products')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ Table structure check failed:', tableError);
  } else {
    console.log('✅ Table structure check passed');
    if (tableData.length > 0) {
      console.log('Sample record structure:', Object.keys(tableData[0]));
    }
  }
}

testInsert().catch(console.error);