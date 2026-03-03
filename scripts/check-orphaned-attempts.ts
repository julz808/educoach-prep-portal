/**
 * Check for orphaned question attempts that reference non-existent questions
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function checkOrphanedAttempts() {
  console.log('🔍 CHECKING FOR ORPHANED QUESTION ATTEMPTS');
  console.log('='.repeat(80));
  console.log('');

  // Get all question attempts
  const { data: allAttempts, error: attemptsError } = await supabase
    .from('question_attempt_history')
    .select('*');

  if (attemptsError) {
    console.error('❌ Error fetching attempts:', attemptsError);
    return;
  }

  console.log(`📊 Total question attempts in database: ${allAttempts?.length || 0}`);
  console.log('');

  if (!allAttempts || allAttempts.length === 0) {
    console.log('✅ No question attempts exist - table is empty');
    console.log('   The foreign key constraint should work after cleanup.');
    return;
  }

  // Get unique question IDs from attempts
  const uniqueQuestionIds = [...new Set(allAttempts.map(a => a.question_id))];
  console.log(`📝 Unique question IDs referenced: ${uniqueQuestionIds.length}`);
  console.log('');

  // Check which question IDs exist in questions_v2 (in batches to avoid URL length limits)
  console.log('🔍 Checking questions_v2 (in batches)...');
  const v2QuestionIds = new Set<string>();
  const batchSize = 100;

  for (let i = 0; i < uniqueQuestionIds.length; i += batchSize) {
    const batch = uniqueQuestionIds.slice(i, i + batchSize);
    const { data: v2Batch, error: v2Error } = await supabase
      .from('questions_v2')
      .select('id')
      .in('id', batch);

    if (v2Error) {
      console.error(`❌ Error checking questions_v2 batch ${i / batchSize + 1}:`, v2Error);
      continue;
    }

    v2Batch?.forEach(q => v2QuestionIds.add(q.id));
  }

  console.log(`✅ Questions found in questions_v2: ${v2QuestionIds.size}`);
  console.log('');

  // Check which question IDs exist in old questions table (in batches)
  console.log('🔍 Checking old questions table (in batches)...');
  const v1QuestionIds = new Set<string>();

  for (let i = 0; i < uniqueQuestionIds.length; i += batchSize) {
    const batch = uniqueQuestionIds.slice(i, i + batchSize);
    const { data: v1Batch, error: v1Error } = await supabase
      .from('questions')
      .select('id')
      .in('id', batch);

    if (v1Error) {
      console.error(`❌ Error checking questions batch ${i / batchSize + 1}:`, v1Error);
      continue;
    }

    v1Batch?.forEach(q => v1QuestionIds.add(q.id));
  }

  console.log(`📦 Questions found in old questions table: ${v1QuestionIds.size}`);
  console.log('');

  // Find orphaned question IDs (not in either table)
  const orphanedIds = uniqueQuestionIds.filter(id =>
    !v2QuestionIds.has(id) && !v1QuestionIds.has(id)
  );

  // Find question IDs that are in v1 but not v2
  const inV1NotV2 = uniqueQuestionIds.filter(id =>
    v1QuestionIds.has(id) && !v2QuestionIds.has(id)
  );

  // Find question IDs that are already in v2
  const inV2 = uniqueQuestionIds.filter(id => v2QuestionIds.has(id));

  console.log('📊 BREAKDOWN:');
  console.log('─'.repeat(80));
  console.log(`   ✅ In questions_v2: ${inV2.length} question IDs`);
  console.log(`   ⚠️  In questions (v1) only: ${inV1NotV2.length} question IDs`);
  console.log(`   ❌ Orphaned (not in any table): ${orphanedIds.length} question IDs`);
  console.log('');

  if (orphanedIds.length > 0) {
    console.log('🗑️  ORPHANED QUESTION IDs (not in any table):');
    orphanedIds.slice(0, 10).forEach(id => console.log(`   - ${id}`));
    if (orphanedIds.length > 10) {
      console.log(`   ... and ${orphanedIds.length - 10} more`);
    }
    console.log('');

    // Count attempts for orphaned questions
    const orphanedAttempts = allAttempts.filter(a => orphanedIds.includes(a.question_id));
    console.log(`   Total attempts referencing orphaned questions: ${orphanedAttempts.length}`);
    console.log('');
  }

  if (inV1NotV2.length > 0) {
    console.log('📦 QUESTION IDs IN OLD TABLE ONLY (questions v1):');
    inV1NotV2.slice(0, 10).forEach(id => console.log(`   - ${id}`));
    if (inV1NotV2.length > 10) {
      console.log(`   ... and ${inV1NotV2.length - 10} more`);
    }
    console.log('');

    // Count attempts for v1-only questions
    const v1OnlyAttempts = allAttempts.filter(a => inV1NotV2.includes(a.question_id));
    console.log(`   Total attempts referencing v1-only questions: ${v1OnlyAttempts.length}`);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('');

  // Determine what needs to be done
  if (orphanedIds.length > 0 || inV1NotV2.length > 0) {
    console.log('⚠️  ACTION REQUIRED:');
    console.log('');
    console.log('There are question attempts referencing questions that don\'t exist in questions_v2.');
    console.log('');
    console.log('OPTIONS:');
    console.log('');
    console.log('1. DELETE orphaned attempts (recommended if old/test data)');
    console.log('   These are likely from old tests or development data.');
    console.log('');
    console.log('2. MIGRATE missing questions from questions (v1) to questions_v2');
    console.log('   Only if this data is important and needs to be preserved.');
    console.log('');
    console.log('Run the cleanup script to proceed:');
    console.log('   npx tsx scripts/cleanup-orphaned-attempts.ts');
  } else {
    console.log('✅ All question attempts reference valid questions in questions_v2!');
    console.log('   The foreign key constraint should work now.');
  }
}

checkOrphanedAttempts().catch(console.error);
