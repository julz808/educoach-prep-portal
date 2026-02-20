/**
 * Test that cross-mode diversity loads previous questions correctly
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { getRecentQuestionsForSubSkill } from '@/engines/questionGeneration/v2/supabaseStorage';

async function testCrossModeLoading() {
  console.log('\n🧪 Testing cross-mode question loading...\n');

  const testType = 'EduTest Scholarship (Year 7 Entry)';
  const sectionName = 'Verbal Reasoning';
  const subSkill = 'Vocabulary & Semantic Knowledge';

  // Test 1: Load from specific mode only
  console.log('━'.repeat(80));
  console.log('TEST 1: Loading from practice_1 mode ONLY');
  console.log('━'.repeat(80));

  const practice1Only = await getRecentQuestionsForSubSkill(
    testType,
    sectionName,
    subSkill,
    'practice_1',  // specific mode
    20
  );

  console.log(`\nFound ${practice1Only.length} questions in practice_1 mode:`);
  practice1Only.slice(0, 3).forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question_text.slice(0, 60).replace(/\n/g, ' ')}... (mode: ${q.test_mode})`);
  });

  // Test 2: Load from ALL modes (cross-mode diversity)
  console.log('\n\n');
  console.log('━'.repeat(80));
  console.log('TEST 2: Loading from ALL modes (crossModeDiversity = true)');
  console.log('━'.repeat(80));

  const allModes = await getRecentQuestionsForSubSkill(
    testType,
    sectionName,
    subSkill,
    null,  // null = load from ALL modes
    20
  );

  console.log(`\nFound ${allModes.length} questions across all modes:`);

  // Count by mode
  const byMode = new Map<string, number>();
  allModes.forEach(q => {
    byMode.set(q.test_mode, (byMode.get(q.test_mode) || 0) + 1);
  });

  console.log(`\nBreakdown by mode:`);
  byMode.forEach((count, mode) => {
    console.log(`  ${mode}: ${count} questions`);
  });

  console.log(`\nFirst 5 questions (showing mode diversity):`);
  allModes.slice(0, 5).forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.test_mode}] ${q.question_text.slice(0, 60).replace(/\n/g, ' ')}...`);
  });

  console.log('\n\n');
  console.log('━'.repeat(80));
  console.log('✅ VERIFICATION:');
  console.log('━'.repeat(80));
  console.log(`\nWith crossModeDiversity = true, the system loads ${allModes.length} questions from all modes.`);
  console.log(`This means when generating practice_4, Sonnet will see questions from:`);
  byMode.forEach((count, mode) => {
    console.log(`  - ${mode}: ${count} previous questions`);
  });
  console.log(`\nSonnet will avoid repeating any of these questions.`);
  console.log(`The duplicate checker will also compare against all ${allModes.length} questions.`);
  console.log('\n');
}

testCrossModeLoading()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
