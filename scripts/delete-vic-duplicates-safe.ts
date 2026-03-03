import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteDuplicatesSafely() {
  console.log('🗑️  VIC Selective Entry Duplicate Deletion Script\n');
  console.log('This script will:');
  console.log('1. Load duplicate IDs from audit report');
  console.log('2. Backup all duplicates to JSON');
  console.log('3. Delete duplicates from database');
  console.log('4. Verify deletion\n');

  // Load report
  const reportPath = '/Users/julz88/Documents/educoach-prep-portal-2/vic-selective-duplicates-report.json';
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Report file not found! Run audit script first.');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const idsToDelete = report.duplicateGroups.flatMap((g: any) => g.questionsToDelete);

  console.log(`📊 Summary from audit report:`);
  console.log(`   - Total duplicate groups: ${report.summary.totalDuplicateGroups}`);
  console.log(`   - Questions to delete: ${report.summary.totalQuestionsToDelete}`);
  console.log(`   - Unique questions to keep: ${report.summary.totalQuestionsToKeep}\n`);

  if (idsToDelete.length === 0) {
    console.log('✅ No duplicates to delete!');
    return;
  }

  // Step 1: Backup
  console.log('📦 Step 1: Creating backup...');
  const { data: backupData, error: backupError } = await supabase
    .from('questions_v2')
    .select('*')
    .in('id', idsToDelete);

  if (backupError) {
    console.error('❌ Backup failed:', backupError);
    process.exit(1);
  }

  const backupPath = `/Users/julz88/Documents/educoach-prep-portal-2/vic-duplicates-backup-${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`✅ Backed up ${backupData?.length || 0} questions to: ${backupPath}\n`);

  // Step 2: Delete
  console.log('🗑️  Step 2: Deleting duplicates...');
  const { error: deleteError, count } = await supabase
    .from('questions_v2')
    .delete({ count: 'exact' })
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('❌ Deletion failed:', deleteError);
    console.log(`ℹ️  Backup preserved at: ${backupPath}`);
    process.exit(1);
  }

  console.log(`✅ Deleted ${count} duplicate questions\n`);

  // Step 3: Verify
  console.log('🔍 Step 3: Verifying deletion...');

  // Check if any deleted IDs still exist
  const { data: remainingCheck, error: checkError } = await supabase
    .from('questions_v2')
    .select('id')
    .in('id', idsToDelete);

  if (checkError) {
    console.error('⚠️  Verification check failed:', checkError);
  } else if (remainingCheck && remainingCheck.length > 0) {
    console.error(`❌ ERROR: ${remainingCheck.length} questions were not deleted!`);
    console.log('Remaining IDs:', remainingCheck.map(r => r.id));
  } else {
    console.log('✅ Verification passed: All duplicate IDs removed\n');
  }

  // Step 4: Show final counts
  console.log('📊 Step 4: Final counts by section and mode:\n');

  const { data: finalCounts, error: countError } = await supabase
    .from('questions_v2')
    .select('section_name, test_mode')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .in('section_name', ['General Ability - Quantitative', 'General Ability - Verbal']);

  if (countError) {
    console.error('⚠️  Could not fetch final counts:', countError);
  } else {
    const counts: Record<string, Record<string, number>> = {};

    finalCounts?.forEach(row => {
      if (!counts[row.section_name]) {
        counts[row.section_name] = {};
      }
      counts[row.section_name][row.test_mode] = (counts[row.section_name][row.test_mode] || 0) + 1;
    });

    for (const [section, modes] of Object.entries(counts)) {
      console.log(`${section}:`);
      for (const [mode, count] of Object.entries(modes)) {
        console.log(`  ${mode}: ${count} questions`);
      }
      console.log();
    }
  }

  console.log('=' .repeat(80));
  console.log('✅ DELETION COMPLETE');
  console.log('=' .repeat(80));
  console.log(`\nBackup file: ${backupPath}`);
  console.log(`Report file: ${reportPath}`);
  console.log(`\nNext steps:`);
  console.log(`1. Run audit again to confirm zero duplicates`);
  console.log(`2. Update generation scripts to use crossModeDiversity: true`);
  console.log(`3. Consider adding database-level unique constraint`);
}

async function main() {
  try {
    await deleteDuplicatesSafely();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
