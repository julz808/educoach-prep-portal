/**
 * Quick Consistency Check
 *
 * Fast check for the most common issues causing user-reported problems
 *
 * Run with: npx tsx scripts/quick-consistency-check.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickCheck() {
  console.log('🔍 Quick Consistency Check\n');

  // Test 1: Check for NULL question_order (causes ordering instability)
  console.log('1️⃣  Checking for NULL question_order values...');
  const { data: nullOrders } = await supabase
    .from('questions_v2')
    .select('test_type, mode, section_name', { count: 'exact' })
    .is('question_order', null);

  if (nullOrders && nullOrders.length > 0) {
    console.log(`   ❌ Found ${nullOrders.length} questions with NULL question_order`);
    console.log('   ⚠️  This WILL cause questions to shift on page refresh!');
  } else {
    console.log('   ✅ All questions have question_order set');
  }

  // Test 2: Check for missing answer_options
  console.log('\n2️⃣  Checking for missing answer_options...');
  const { data: missingOptions } = await supabase
    .from('questions_v2')
    .select('id, test_type, section_name')
    .is('answer_options', null)
    .limit(10);

  if (missingOptions && missingOptions.length > 0) {
    console.log(`   ❌ Found ${missingOptions.length} questions with missing answer_options`);
    console.log('   First few:', missingOptions.slice(0, 3));
  } else {
    console.log('   ✅ All questions have answer_options');
  }

  // Test 3: Check for active sessions with missing data
  console.log('\n3️⃣  Checking active sessions...');
  const { data: sessions } = await supabase
    .from('user_test_sessions')
    .select('id, product_type, test_mode, question_order, session_data')
    .eq('status', 'active')
    .limit(10);

  if (sessions) {
    const withoutQuestionOrder = sessions.filter(s => !s.question_order || s.question_order.length === 0);
    const withoutSessionData = sessions.filter(s => !s.session_data);

    if (withoutQuestionOrder.length > 0) {
      console.log(`   ⚠️  ${withoutQuestionOrder.length} active sessions missing question_order`);
    }
    if (withoutSessionData.length > 0) {
      console.log(`   ⚠️  ${withoutSessionData.length} active sessions missing session_data`);
    }
    if (withoutQuestionOrder.length === 0 && withoutSessionData.length === 0) {
      console.log(`   ✅ All ${sessions.length} active sessions have complete data`);
    }
  }

  // Test 4: Verify question fetching consistency
  console.log('\n4️⃣  Testing question fetching consistency...');

  const testType = 'VIC Selective Entry (Year 9 Entry)';
  const mode = 'practice_1';
  const section = 'Numerical Reasoning';

  const fetch1 = await supabase
    .from('questions_v2')
    .select('id')
    .eq('test_type', testType)
    .eq('mode', mode)
    .eq('section_name', section)
    .order('question_order', { ascending: true })
    .limit(20);

  const fetch2 = await supabase
    .from('questions_v2')
    .select('id')
    .eq('test_type', testType)
    .eq('mode', mode)
    .eq('section_name', section)
    .order('question_order', { ascending: true })
    .limit(20);

  if (fetch1.data && fetch2.data) {
    const ids1 = fetch1.data.map(q => q.id);
    const ids2 = fetch2.data.map(q => q.id);

    const orderMatches = ids1.length === ids2.length &&
      ids1.every((id, idx) => id === ids2[idx]);

    if (orderMatches) {
      console.log(`   ✅ Questions fetch consistently (tested ${ids1.length} questions)`);
    } else {
      console.log(`   ❌ Questions fetch in DIFFERENT ORDER!`);
      console.log(`   ⚠️  This causes "questions changing on refresh" bug`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Quick Check Complete\n');
}

quickCheck().catch(console.error);
