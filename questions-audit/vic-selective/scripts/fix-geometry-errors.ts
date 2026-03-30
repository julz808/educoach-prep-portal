/**
 * Fix Geometry: Area, Perimeter & Volume Errors
 *
 * This script fixes 1 error found during manual audit:
 * - Question 41 (461c6a09-ec2a-441a-aef7-3fe3f0b6f600): Arithmetic error in 3D diagonal calculation
 *
 * See: questions-audit/vic-selective/error-docs/GEOMETRY_ERRORS.md
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
    id: '461c6a09-ec2a-441a-aef7-3fe3f0b6f600',
    questionNumber: 41,
    issue: 'Arithmetic error: 2025+1024+576 = 3625 (not 4225), so √3625 ≈ 60 cm (not 65 cm)',
    newSolution: `• The diagonal rod stretches through 3 dimensions of the rectangular prism
• Using the 3D diagonal formula: diagonal = √(length² + width² + height²)
• diagonal = √(45² + 32² + 24²)
• diagonal = √(2025 + 1024 + 576)
• diagonal = √3625
• diagonal ≈ 60.21 cm
• Rounded to the nearest whole number = 60 cm
• Therefore, the answer is C because the length of the diagonal rod is 60 cm`
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
  console.log('VIC SELECTIVE - GEOMETRY: AREA, PERIMETER & VOLUME - FIX SCRIPT');
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
    console.log('1. Update PROGRESS.md to mark Geometry as complete');
    console.log('2. Move on to next sub-skill: Time, Money & Measurement');
  } else {
    console.log('\n⚠️  SOME FIXES FAILED - Please review errors above');
    process.exit(1);
  }
}

main().catch(console.error);
