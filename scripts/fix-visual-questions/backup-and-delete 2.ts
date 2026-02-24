import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backupAndDelete() {
  console.log('\n🔄 Backing up and deleting visual questions\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Get all visual questions for backup
  console.log('Step 1: Fetching visual questions...');
  const { data: visualQuestions, error: fetchError } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('has_visual', true);

  if (fetchError) {
    console.error('❌ Error fetching visual questions:', fetchError);
    process.exit(1);
  }

  console.log(`✅ Found ${visualQuestions?.length || 0} visual questions\n`);

  // Breakdown by test type
  const breakdown: Record<string, number> = {};
  visualQuestions?.forEach(q => {
    breakdown[q.test_type] = (breakdown[q.test_type] || 0) + 1;
  });

  console.log('Breakdown by test type:');
  Object.entries(breakdown).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('');

  // Step 2: Create backup - save to JSON file
  console.log('Step 2: Creating backup...');

  const backupPath = './visual-questions-backup.json';
  fs.writeFileSync(backupPath, JSON.stringify(visualQuestions, null, 2));
  console.log(`✅ Backup saved to: ${backupPath}\n`);

  // Step 3: Delete visual questions
  console.log('Step 3: Deleting visual questions...');

  const { error: deleteError, count } = await supabase
    .from('questions_v2')
    .delete({ count: 'exact' })
    .eq('has_visual', true);

  if (deleteError) {
    console.error('❌ Error deleting visual questions:', deleteError);
    process.exit(1);
  }

  console.log(`✅ Deleted ${count || 0} visual questions\n`);

  // Step 4: Verify deletion
  console.log('Step 4: Verifying deletion...');

  const { count: remainingCount, error: verifyError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('has_visual', true);

  if (verifyError) {
    console.error('❌ Error verifying deletion:', verifyError);
    process.exit(1);
  }

  console.log(`✅ Remaining visual questions: ${remainingCount || 0}`);

  if (remainingCount === 0) {
    console.log('✅ All visual questions successfully deleted!\n');
  } else {
    console.log(`⚠️  Warning: ${remainingCount} visual questions still remain\n`);
  }

  // Step 5: Show remaining question counts
  console.log('Step 5: Remaining questions by test type...\n');

  const { data: allQuestions } = await supabase
    .from('questions_v2')
    .select('test_type');

  const remainingBreakdown: Record<string, number> = {};
  allQuestions?.forEach(q => {
    remainingBreakdown[q.test_type] = (remainingBreakdown[q.test_type] || 0) + 1;
  });

  Object.entries(remainingBreakdown).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\n\n📊 SUMMARY\n');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`✅ Backed up: ${visualQuestions?.length || 0} visual questions`);
  console.log(`✅ Deleted: ${count || 0} visual questions`);
  console.log(`✅ Remaining visual questions: ${remainingCount || 0}`);
  console.log(`\n📁 Total questions remaining: ${allQuestions?.length || 0}\n`);

  console.log('🎯 NEXT STEPS:\n');
  console.log('1. Run generation scripts to fill the gaps:');
  console.log('   npm run generate:vic');
  console.log('   npm run generate:nsw');
  console.log('   npm run generate:edutest');
  console.log('   npm run generate:acer\n');
  console.log('2. Generated questions will have:');
  console.log('   - Complete data in question_text');
  console.log('   - Tables in markdown format');
  console.log('   - Grid data as text');
  console.log('   - All measurements included');
  console.log('   - has_visual = false\n');
}

backupAndDelete().catch(console.error);
