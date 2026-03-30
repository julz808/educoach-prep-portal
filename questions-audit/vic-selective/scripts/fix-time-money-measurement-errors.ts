/**
 * Fix Time, Money & Measurement Errors
 *
 * This script fixes 1 error found during manual audit:
 * - Question 62 (054b1e50-99d4-4ace-956c-c42afd1f512a): Duplicate charge - first hour counted twice
 *
 * See: questions-audit/vic-selective/error-docs/TIME_MONEY_MEASUREMENT_ERRORS.md
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface QuestionFix {
  id: string;
  questionNumber: number;
  issue: string;
  newSolution: string;
}

const fixes: QuestionFix[] = [
  {
    id: '054b1e50-99d4-4ace-956c-c42afd1f512a',
    questionNumber: 62,
    issue: 'Arithmetic error: $4.50 added twice. Should be $4.50+$9.00+$1.50=$15.00 (not $19.50)',
    newSolution: `• Calculate total parking time: From 9:38 AM to 2:26 PM is 4 hours and 48 minutes
• Apply pricing structure:
  - First hour: $4.50
  - Next 3 full hours (hours 2, 3, 4): 3 × $3.00 = $9.00
  - Partial hour (48 minutes): $1.50
• Total fee: $4.50 + $9.00 + $1.50 = $15.00
• Therefore, the answer is B because the car parked for 4 hours and 48 minutes, requiring payment for the first hour ($4.50), three additional full hours ($9.00), and one partial hour ($1.50), totaling $15.00`
  }
];

async function verifyQuestionExists(id: string, questionNumber: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, solution, correct_answer')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error(`❌ Question ${questionNumber} (${id}) not found in database`);
    return false;
  }

  console.log(`✓ Question ${questionNumber} found in database`);
  console.log(`  Current answer: ${data.correct_answer}`);
  console.log(`  Current solution (first 150 chars): ${data.solution.substring(0, 150)}...`);
  return true;
}

async function applyFix(fix: QuestionFix): Promise<boolean> {
  console.log(`\n📝 Fixing Question ${fix.questionNumber} (${fix.id})`);
  console.log(`   Issue: ${fix.issue}`);

  const { data, error } = await supabase
    .from('questions_v2')
    .update({ solution: fix.newSolution })
    .eq('id', fix.id)
    .select();

  if (error) {
    console.error(`❌ Failed to update Question ${fix.questionNumber}:`, error.message);
    return false;
  }

  console.log(`✅ Question ${fix.questionNumber} solution updated successfully`);
  return true;
}

async function verifyFix(id: string, questionNumber: number, expectedSolution: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('solution')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error(`❌ Failed to verify Question ${questionNumber}`);
    return false;
  }

  if (data.solution === expectedSolution) {
    console.log(`✓ Question ${questionNumber} verification passed`);
    return true;
  } else {
    console.error(`❌ Question ${questionNumber} verification failed - solution doesn't match`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('VIC SELECTIVE - TIME, MONEY & MEASUREMENT - FIX SCRIPT');
  console.log('='.repeat(80));
  console.log(`Total fixes to apply: ${fixes.length}`);
  console.log('');

  // Step 1: Verify all questions exist
  console.log('Step 1: Verifying questions exist in database...');
  console.log('-'.repeat(80));

  let allExist = true;
  for (const fix of fixes) {
    const exists = await verifyQuestionExists(fix.id, fix.questionNumber);
    if (!exists) allExist = false;
  }

  if (!allExist) {
    console.error('\n❌ Some questions not found. Aborting.');
    process.exit(1);
  }

  console.log('\n✅ All questions found in database');

  // Step 2: Apply fixes
  console.log('\n' + '='.repeat(80));
  console.log('Step 2: Applying fixes...');
  console.log('-'.repeat(80));

  let successCount = 0;
  for (const fix of fixes) {
    const success = await applyFix(fix);
    if (success) successCount++;
  }

  console.log(`\n${successCount}/${fixes.length} fixes applied successfully`);

  // Step 3: Verify fixes
  console.log('\n' + '='.repeat(80));
  console.log('Step 3: Verifying fixes...');
  console.log('-'.repeat(80));

  let verifyCount = 0;
  for (const fix of fixes) {
    const verified = await verifyFix(fix.id, fix.questionNumber, fix.newSolution);
    if (verified) verifyCount++;
  }

  console.log(`\n${verifyCount}/${fixes.length} fixes verified successfully`);

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions processed: ${fixes.length}`);
  console.log(`Successfully applied: ${successCount}`);
  console.log(`Successfully verified: ${verifyCount}`);

  if (verifyCount === fixes.length) {
    console.log('\n✅ ALL FIXES COMPLETED SUCCESSFULLY');
    console.log('\nNext steps:');
    console.log('1. Update PROGRESS.md to mark Time, Money & Measurement as complete');
    console.log('2. Move on to final sub-skill: Number Grids & Matrices');
  } else {
    console.log('\n⚠️  SOME FIXES FAILED - Please review errors above');
    process.exit(1);
  }
}

main().catch(console.error);
