/**
 * Fix Data Interpretation: Tables & Graphs Errors
 *
 * This script fixes 2 errors found during manual audit:
 * 1. Question 1 (8abd3773-2850-4b76-829b-4b7b70de1410): Solution uses wrong table values
 * 2. Question 32 (eeb581cc-00b1-4612-a661-3410334518dd): Solution references wrong categories
 *
 * See: questions-audit/vic-selective/error-docs/DATA_INTERPRETATION_ERRORS.md
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
    id: '8abd3773-2850-4b76-829b-4b7b70de1410',
    questionNumber: 1,
    issue: 'Solution uses wrong table values - needs complete rewrite',
    newSolution: `• Site A total: 24 + 30 + 26 + 28 = 108 fossils
• Site B total: 18 + 22 + 34 + 26 = 100 fossils
• Site C total: 32 + 28 + 20 + 30 = 110 fossils
• Highest total: Site C with 110 fossils
• Lowest total: Site B with 100 fossils
• Difference: 110 - 100 = 10 fossils
• This value (10) does not match any of options A through D
• Therefore, the answer is E because the difference between the highest and lowest site totals is 10 fossils, which is not among the given options`
  },
  {
    id: 'eeb581cc-00b1-4612-a661-3410334518dd',
    questionNumber: 32,
    issue: 'Solution references wrong game categories - needs complete rewrite',
    newSolution: `• Total Family games = 25 + 30 + 42 + 33 = 130
• Total Card games = 12 + 15 + 20 + 18 = 65
• Difference = 130 - 65 = 65
• Therefore, the answer is B because the store sold 65 more Family games than Card games during the entire four-day sale`
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
  console.log(`  Current solution (first 100 chars): ${data.solution.substring(0, 100)}...`);
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
  console.log('VIC SELECTIVE - DATA INTERPRETATION: TABLES & GRAPHS - FIX SCRIPT');
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
    console.log('1. Update PROGRESS.md to mark Data Interpretation as complete');
    console.log('2. Move on to next sub-skill: Geometry - Area, Perimeter & Volume');
  } else {
    console.log('\n⚠️  SOME FIXES FAILED - Please review errors above');
    process.exit(1);
  }
}

main().catch(console.error);
