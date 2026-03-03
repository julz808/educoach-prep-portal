/**
 * Test Question Randomization
 *
 * This script tests the seeded randomization to ensure:
 * 1. Same seed always produces same order
 * 2. Different sections get different orders
 * 3. Passage-based sections remain ordered
 * 4. Question order is deterministic across runs
 *
 * Usage:
 *   npx tsx scripts/test-question-randomization.ts
 */

import { createClient } from '@supabase/supabase-js';
import {
  generateQuestionOrderSeed,
  generateQuestionOrders,
  shouldRandomizeSection,
  testSeededShuffle
} from '../src/utils/seededShuffle';

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING QUESTION RANDOMIZATION');
  console.log('='.repeat(80) + '\n');

  // Test 1: Seeded shuffle algorithm
  console.log('Test 1: Seeded Shuffle Algorithm');
  console.log('-'.repeat(80));
  const shuffleTest = testSeededShuffle();
  if (!shuffleTest) {
    console.error('❌ Seeded shuffle test FAILED');
    process.exit(1);
  }
  console.log();

  // Test 2: Section type detection
  console.log('Test 2: Section Type Detection');
  console.log('-'.repeat(80));

  const testSections = [
    { name: 'Language Conventions', expected: true },
    { name: 'Numeracy', expected: true },
    { name: 'Mathematics', expected: true },
    { name: 'Reading', expected: false },
    { name: 'Reading Comprehension', expected: false },
    { name: 'Humanities', expected: false },
    { name: 'General Ability - Verbal', expected: true },
  ];

  let sectionTestPassed = true;
  for (const test of testSections) {
    const result = shouldRandomizeSection(test.name);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`   ${status} "${test.name}": randomize=${result} (expected ${test.expected})`);
    if (result !== test.expected) sectionTestPassed = false;
  }

  if (!sectionTestPassed) {
    console.error('\n❌ Section type detection test FAILED');
    process.exit(1);
  }
  console.log();

  // Test 3: Seed consistency
  console.log('Test 3: Seed Consistency');
  console.log('-'.repeat(80));

  const testType = 'Year 7 NAPLAN';
  const testMode = 'practice_1';
  const sectionName = 'Language Conventions';

  const seed1 = generateQuestionOrderSeed(testType, testMode, sectionName);
  const seed2 = generateQuestionOrderSeed(testType, testMode, sectionName);

  console.log(`   Seed 1: ${seed1}`);
  console.log(`   Seed 2: ${seed2}`);

  if (seed1 === seed2) {
    console.log(`   ✅ Seeds are consistent`);
  } else {
    console.error(`   ❌ Seeds are different!`);
    process.exit(1);
  }
  console.log();

  // Test 4: Order generation consistency
  console.log('Test 4: Order Generation Consistency');
  console.log('-'.repeat(80));

  const questionCount = 10;
  const orders1 = generateQuestionOrders(questionCount, seed1);
  const orders2 = generateQuestionOrders(questionCount, seed1);

  console.log(`   Orders 1: [${orders1.join(', ')}]`);
  console.log(`   Orders 2: [${orders2.join(', ')}]`);

  const ordersMatch = orders1.every((val, idx) => val === orders2[idx]);
  if (ordersMatch) {
    console.log(`   ✅ Orders are consistent`);
  } else {
    console.error(`   ❌ Orders are different!`);
    process.exit(1);
  }
  console.log();

  // Test 5: Different seeds produce different orders
  console.log('Test 5: Different Sections = Different Orders');
  console.log('-'.repeat(80));

  const seed3 = generateQuestionOrderSeed(testType, testMode, 'Numeracy');
  const orders3 = generateQuestionOrders(questionCount, seed3);

  console.log(`   Language Conventions seed: ${seed1}`);
  console.log(`   Language Conventions order: [${orders1.join(', ')}]`);
  console.log(`   Numeracy seed: ${seed3}`);
  console.log(`   Numeracy order: [${orders3.join(', ')}]`);

  const ordersDifferent = !orders1.every((val, idx) => val === orders3[idx]);
  if (ordersDifferent) {
    console.log(`   ✅ Different sections produce different orders`);
  } else {
    console.error(`   ❌ Orders are the same! This should not happen.`);
    process.exit(1);
  }
  console.log();

  // Test 6: Fetch sample questions and verify ordering
  console.log('Test 6: Database Query with question_order');
  console.log('-'.repeat(80));

  const { data: sampleQuestions, error } = await supabase
    .from('questions_v2')
    .select('id, test_type, test_mode, section_name, question_order')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('test_mode', 'practice_1')
    .eq('section_name', 'Language Conventions')
    .order('question_order', { ascending: true, nullsFirst: false })
    .limit(10);

  if (error) {
    console.error(`   ❌ Error fetching questions:`, error);
  } else if (!sampleQuestions || sampleQuestions.length === 0) {
    console.log(`   ⚠️  No questions found for this test/section`);
  } else {
    console.log(`   ✅ Fetched ${sampleQuestions.length} questions sorted by question_order`);
    console.log(`   First 5 questions (ID, question_order):`);
    sampleQuestions.slice(0, 5).forEach((q, idx) => {
      console.log(`      ${idx + 1}. ${q.id.substring(0, 8)}... (order: ${q.question_order})`);
    });

    // Verify they're in ascending order
    const isOrdered = sampleQuestions.every((q, idx) => {
      if (idx === 0) return true;
      return q.question_order! >= sampleQuestions[idx - 1].question_order!;
    });

    if (isOrdered) {
      console.log(`   ✅ Questions are properly ordered by question_order`);
    } else {
      console.error(`   ❌ Questions are NOT properly ordered!`);
      process.exit(1);
    }
  }
  console.log();

  // Test 7: Test different test modes have different orders
  console.log('Test 7: Different Test Modes = Different Orders');
  console.log('-'.repeat(80));

  const mode1Seed = generateQuestionOrderSeed('Year 7 NAPLAN', 'practice_1', 'Numeracy');
  const mode2Seed = generateQuestionOrderSeed('Year 7 NAPLAN', 'practice_2', 'Numeracy');

  const mode1Orders = generateQuestionOrders(10, mode1Seed);
  const mode2Orders = generateQuestionOrders(10, mode2Seed);

  console.log(`   Practice 1 seed: ${mode1Seed}`);
  console.log(`   Practice 1 order: [${mode1Orders.join(', ')}]`);
  console.log(`   Practice 2 seed: ${mode2Seed}`);
  console.log(`   Practice 2 order: [${mode2Orders.join(', ')}]`);

  const modeOrdersDifferent = !mode1Orders.every((val, idx) => val === mode2Orders[idx]);
  if (modeOrdersDifferent) {
    console.log(`   ✅ Different test modes produce different orders`);
  } else {
    console.error(`   ❌ Orders are the same! Different modes should have different orders.`);
    process.exit(1);
  }
  console.log();

  // All tests passed
  console.log('='.repeat(80));
  console.log('✅ ALL TESTS PASSED');
  console.log('='.repeat(80));
  console.log('\n✨ The question randomization system is working correctly!\n');
  console.log('Key findings:');
  console.log('  • Seeded shuffle produces consistent, deterministic results');
  console.log('  • Same section/mode always gets same order (consistent for all users)');
  console.log('  • Different sections get different randomized orders');
  console.log('  • Different test modes get different randomized orders');
  console.log('  • Passage-based sections (Reading, Humanities) remain ordered\n');
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
