/**
 * Clean up orphaned question attempts that reference old questions table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to prompt user for confirmation
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function cleanupOrphanedAttempts() {
  console.log('🧹 CLEANUP ORPHANED QUESTION ATTEMPTS');
  console.log('='.repeat(80));
  console.log('');

  // Get all question attempts
  const { data: allAttempts, error: attemptsError } = await supabase
    .from('question_attempt_history')
    .select('question_id, user_id, session_id, attempted_at');

  if (attemptsError) {
    console.error('❌ Error fetching attempts:', attemptsError);
    return;
  }

  console.log(`📊 Total question attempts: ${allAttempts?.length || 0}`);
  console.log('');

  if (!allAttempts || allAttempts.length === 0) {
    console.log('✅ No question attempts exist - nothing to clean up');
    return;
  }

  // Get unique question IDs
  const uniqueQuestionIds = [...new Set(allAttempts.map(a => a.question_id))];

  // Check which exist in questions_v2
  console.log('🔍 Checking which questions exist in questions_v2...');
  const v2QuestionIds = new Set<string>();
  const batchSize = 100;

  for (let i = 0; i < uniqueQuestionIds.length; i += batchSize) {
    const batch = uniqueQuestionIds.slice(i, i + batchSize);
    const { data: v2Batch } = await supabase
      .from('questions_v2')
      .select('id')
      .in('id', batch);

    v2Batch?.forEach(q => v2QuestionIds.add(q.id));
  }

  console.log(`✅ Found ${v2QuestionIds.size} questions in questions_v2`);
  console.log('');

  // Find attempts that reference questions NOT in v2
  const orphanedAttempts = allAttempts.filter(a => !v2QuestionIds.has(a.question_id));

  console.log(`🗑️  Orphaned attempts to delete: ${orphanedAttempts.length}`);
  console.log(`✅ Valid attempts to keep: ${allAttempts.length - orphanedAttempts.length}`);
  console.log('');

  if (orphanedAttempts.length === 0) {
    console.log('✅ No orphaned attempts found - nothing to clean up!');
    return;
  }

  // Show some details
  console.log('📋 DETAILS:');
  console.log(`   Oldest attempt: ${orphanedAttempts[0]?.attempted_at || 'N/A'}`);
  console.log(`   Newest attempt: ${orphanedAttempts[orphanedAttempts.length - 1]?.attempted_at || 'N/A'}`);
  console.log(`   Unique users affected: ${new Set(orphanedAttempts.map(a => a.user_id)).size}`);
  console.log('');

  console.log('⚠️  WARNING:');
  console.log('   These attempts reference the OLD questions table (v1).');
  console.log('   They need to be deleted to allow the foreign key constraint update.');
  console.log('');
  console.log('   This is safe because:');
  console.log('   - Current tests use questions_v2 (these are old/stale data)');
  console.log('   - Test session data is preserved in user_test_sessions');
  console.log('   - New attempts will be created correctly after the FK fix');
  console.log('');

  const answer = await askQuestion('Do you want to DELETE these orphaned attempts? (yes/no): ');

  if (answer.toLowerCase() !== 'yes') {
    console.log('');
    console.log('❌ Cleanup cancelled. No changes made.');
    return;
  }

  console.log('');
  console.log('🗑️  Deleting orphaned attempts...');

  // Delete in batches to avoid timeout
  const deleteIds = orphanedAttempts.map(a => ({
    question_id: a.question_id,
    user_id: a.user_id,
    session_id: a.session_id
  }));

  let deletedCount = 0;
  const deleteBatchSize = 100;

  for (let i = 0; i < deleteIds.length; i += deleteBatchSize) {
    const batch = deleteIds.slice(i, i + deleteBatchSize);

    // Delete each one (can't batch delete with composite conditions easily)
    for (const item of batch) {
      const { error: deleteError } = await supabase
        .from('question_attempt_history')
        .delete()
        .eq('question_id', item.question_id)
        .eq('user_id', item.user_id)
        .eq('session_id', item.session_id);

      if (!deleteError) {
        deletedCount++;
      }
    }

    console.log(`   Progress: ${Math.min(i + deleteBatchSize, deleteIds.length)}/${deleteIds.length}`);
  }

  console.log('');
  console.log(`✅ Deleted ${deletedCount} orphaned attempts`);
  console.log('');

  // Verify
  const { data: remaining, error: verifyError } = await supabase
    .from('question_attempt_history')
    .select('id', { count: 'exact', head: true });

  if (!verifyError) {
    console.log(`📊 Remaining question attempts: ${remaining || 0}`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('');
  console.log('✅ CLEANUP COMPLETE!');
  console.log('');
  console.log('📝 NEXT STEPS:');
  console.log('   1. Run the foreign key fix again:');
  console.log('      Open FIX_INSIGHTS_FOREIGN_KEY.sql in Supabase SQL Editor');
  console.log('');
  console.log('   2. Complete a NEW test to generate fresh question attempts');
  console.log('');
  console.log('   3. Check Insights - scores should now show correctly!');
  console.log('');
}

cleanupOrphanedAttempts().catch(console.error);
