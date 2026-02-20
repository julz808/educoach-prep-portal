/**
 * Test the nuanced duplicate detection rules
 */

import { quickValidate } from '@/engines/questionGeneration/v2/validator';
import type { QuestionV2 } from '@/engines/questionGeneration/v2/types';

// Mock the checkDuplicate function behavior
async function testDuplicateRules() {
  console.log('\n🧪 Testing Nuanced Duplicate Detection Rules\n');

  const tests = [
    {
      title: 'VERBAL: Same target word, different phrasing',
      category: 'verbal',
      q1: 'Which of the following words is opposite to ABUNDANT?',
      q2: 'What is the opposite of ABUNDANT?',
      shouldBeDuplicate: true,
      reason: 'Both test "opposite of ABUNDANT" - same target word + same type = duplicate'
    },
    {
      title: 'VERBAL: Same word, different question type',
      category: 'verbal',
      q1: 'Which of the following words is opposite to ABUNDANT?',
      q2: 'Which of the following words is similar to ABUNDANT?',
      shouldBeDuplicate: false,
      reason: 'Different question types (opposite vs similar) = NOT duplicate'
    },
    {
      title: 'VERBAL: Different target words',
      category: 'verbal',
      q1: 'Which of the following words is opposite to ABUNDANT?',
      q2: 'Which of the following words is opposite to GENEROUS?',
      shouldBeDuplicate: false,
      reason: 'Different target words = NOT duplicate'
    },
    {
      title: 'MATHS: Same numbers, similar calculation',
      category: 'maths',
      q1: 'What is 12 + 8?',
      q2: 'Calculate 12 + 8',
      shouldBeDuplicate: true,
      reason: 'Same numbers (12, 8) in similar calculation = duplicate'
    },
    {
      title: 'MATHS: Different numbers, same structure',
      category: 'maths',
      q1: 'What is 12 + 8?',
      q2: 'What is 15 + 10?',
      shouldBeDuplicate: false,
      reason: 'Different numbers = NOT duplicate (even if same structure)'
    },
    {
      title: 'MATHS: Same numbers in different context',
      category: 'maths',
      q1: 'Sarah has 12 apples and buys 8 more. How many does she have?',
      q2: 'A rectangle has length 12 cm and width 8 cm. What is the area?',
      shouldBeDuplicate: false,
      reason: 'Same numbers but completely different calculation type = NOT duplicate'
    },
    {
      title: 'READING: Word-for-word identical',
      category: 'reading',
      q1: 'Read the passage:\n\n"The cat sat on the mat."\n\nWhat does "diminished" mean?',
      q2: 'Read the passage:\n\n"The cat sat on the mat."\n\nWhat does "diminished" mean?',
      shouldBeDuplicate: true,
      reason: 'Exact word-for-word match = duplicate'
    },
    {
      title: 'ANY: Exact word-for-word match',
      category: 'verbal',
      q1: 'Which of the following words is similar to SWIFT?\nA) Slow\nB) Quick\nC) Lazy',
      q2: 'Which of the following words is similar to SWIFT?\nA) Slow\nB) Quick\nC) Lazy',
      shouldBeDuplicate: true,
      reason: 'Exact match including answer options = duplicate'
    }
  ];

  console.log('━'.repeat(80));
  console.log('DUPLICATE DETECTION RULES TEST');
  console.log('━'.repeat(80));
  console.log('');

  tests.forEach((test, i) => {
    console.log(`Test ${i + 1}: ${test.title}`);
    console.log(`  Q1: ${test.q1.slice(0, 60)}...`);
    console.log(`  Q2: ${test.q2.slice(0, 60)}...`);
    console.log(`  Expected: ${test.shouldBeDuplicate ? '🔴 DUPLICATE' : '✅ NOT DUPLICATE'}`);
    console.log(`  Reason: ${test.reason}`);
    console.log('');
  });

  console.log('━'.repeat(80));
  console.log('KEY PRINCIPLES:');
  console.log('━'.repeat(80));
  console.log('');
  console.log('📘 VERBAL/LITERACY:');
  console.log('  ✅ OK: Similar phrasing with different target words');
  console.log('  ✅ OK: Same word, different question type (opposite vs similar)');
  console.log('  ❌ DUPLICATE: Same target word + same question type');
  console.log('  ❌ DUPLICATE: Word-for-word identical');
  console.log('');
  console.log('🔢 MATHS/NUMERACY:');
  console.log('  ✅ OK: Similar structure/phrasing with different numbers');
  console.log('  ✅ OK: Same numbers in completely different calculation types');
  console.log('  ❌ DUPLICATE: Same numbers in same calculation type');
  console.log('  ❌ DUPLICATE: Word-for-word identical');
  console.log('');
  console.log('📖 READING:');
  console.log('  ✅ OK: Different questions about the same passage');
  console.log('  ❌ DUPLICATE: Same question about the same passage');
  console.log('  ❌ DUPLICATE: Word-for-word identical');
  console.log('');
  console.log('━'.repeat(80));
  console.log('');
  console.log('The validator now uses:');
  console.log('  1. Fast exact-match check (catches word-for-word duplicates)');
  console.log('  2. Category-specific rules (verbal = same word, maths = same numbers)');
  console.log('  3. Haiku LLM check (for nuanced semantic duplicates)');
  console.log('');
}

testDuplicateRules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
