/**
 * Test script to diagnose progress clearing issues
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClearProgress() {
  console.log('\n🔍 Testing Progress Clearing Functions\n');

  // Step 1: Test if we can call the function
  console.log('1️⃣ Testing if RPC functions are callable...\n');

  // Step 2: Check for test sessions
  console.log('2️⃣ Checking for existing test sessions...');

  const { data: sessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('user_id, product_type, test_mode, id')
    .limit(5);

  if (sessionsError) {
    console.log('❌ Error fetching sessions:', sessionsError.message);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('⚠️  No test sessions found in database');
    console.log('   This is why clearing appears to do nothing - there\'s nothing to clear!\n');
    return;
  }

  console.log(`✅ Found ${sessions.length} test sessions (showing first 5):`);
  sessions.forEach((s, i) => {
    console.log(`   ${i + 1}. User: ${s.user_id}, Product: ${s.product_type}, Mode: ${s.test_mode}`);
  });
  console.log('');

  // Step 3: Get unique users
  const uniqueUserIds = [...new Set(sessions.map(s => s.user_id))];
  const testUserId = uniqueUserIds[0];

  console.log(`3️⃣ Testing with user: ${testUserId}`);

  // Step 4: Count progress before clearing
  const { count: beforeCount } = await supabase
    .from('user_test_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', testUserId);

  console.log(`   Sessions before clear: ${beforeCount}\n`);

  // Step 5: Test the clear function
  console.log('4️⃣ Testing clear_all_user_progress function...');

  const { data, error } = await supabase.rpc('clear_all_user_progress', {
    p_user_id: testUserId
  });

  if (error) {
    console.log('❌ RPC Error:', error);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
    return;
  }

  console.log('✅ RPC call succeeded\n');

  // Step 6: Count progress after clearing
  const { count: afterCount } = await supabase
    .from('user_test_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', testUserId);

  console.log(`5️⃣ Results:`);
  console.log(`   Sessions before: ${beforeCount}`);
  console.log(`   Sessions after: ${afterCount}`);

  if (afterCount === 0) {
    console.log('   ✅ SUCCESS! Progress was cleared\n');
  } else {
    console.log('   ⚠️  Sessions still exist - possible RLS issue\n');
  }

  // Step 7: Check product_type values
  console.log('6️⃣ Checking product_type values in database...');

  const { data: productTypes } = await supabase
    .from('user_test_sessions')
    .select('product_type')
    .limit(100);

  const uniqueProducts = [...new Set(productTypes?.map(p => p.product_type) || [])];

  console.log('   Unique product_type values found:');
  uniqueProducts.forEach(p => console.log(`   - "${p}"`));
  console.log('');

  console.log('💡 Frontend uses these values:');
  console.log('   - "year-5-naplan"');
  console.log('   - "year-7-naplan"');
  console.log('   - "acer-scholarship"');
  console.log('   - "edutest-scholarship"');
  console.log('   - "nsw-selective"');
  console.log('   - "vic-selective"');
  console.log('');

  if (uniqueProducts.some(p => p.includes('NAPLAN') || p.includes('Entry'))) {
    console.log('⚠️  MISMATCH DETECTED!');
    console.log('   Database uses different format than frontend');
    console.log('   This is why clearing by product doesn\'t work!\n');
  }
}

testClearProgress()
  .then(() => {
    console.log('✅ Diagnostic complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
