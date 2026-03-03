/**
 * Backfill question_order for existing questions in questions_v2 table
 *
 * This script assigns deterministic question_order values to all existing questions
 * using the same seeded randomization algorithm that will be used for new questions.
 *
 * IMPORTANT: Run this script ONCE to backfill existing data before deploying the
 * randomization feature to production.
 *
 * Usage:
 *   npx tsx scripts/backfill-question-order.ts
 */

import { createClient } from '@supabase/supabase-js';
import {
  generateQuestionOrderSeed,
  generateQuestionOrders,
  shouldRandomizeSection
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

interface QuestionRecord {
  id: string;
  test_type: string;
  test_mode: string;
  section_name: string;
  question_order: number | null;
  passage_id: string | null;
}

interface SectionGroup {
  test_type: string;
  test_mode: string;
  section_name: string;
  questions: QuestionRecord[];
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔀 BACKFILL QUESTION_ORDER - questions_v2');
  console.log('='.repeat(80));
  console.log('This script will assign deterministic question_order values to all existing questions');
  console.log('using seeded randomization for consistency across all users.\n');

  // Step 1: Fetch all questions from questions_v2 (with pagination for large datasets)
  console.log('📊 Step 1: Fetching all questions from questions_v2...');

  let allQuestions: QuestionRecord[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: pageQuestions, error: fetchError } = await supabase
      .from('questions_v2')
      .select('id, test_type, test_mode, section_name, question_order, passage_id')
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching questions:', fetchError);
      process.exit(1);
    }

    if (!pageQuestions || pageQuestions.length === 0) {
      hasMore = false;
    } else {
      allQuestions = allQuestions.concat(pageQuestions);
      page++;
      console.log(`   Fetched ${allQuestions.length} questions so far...`);

      if (pageQuestions.length < pageSize) {
        hasMore = false;
      }
    }
  }

  if (allQuestions.length === 0) {
    console.log('✅ No questions found in questions_v2 table');
    return;
  }

  console.log(`   Total questions fetched: ${allQuestions.length}\n`);

  // Step 2: Group questions by (test_type, test_mode, section_name)
  console.log('📂 Step 2: Grouping questions by section...');
  const sectionGroups = new Map<string, SectionGroup>();

  for (const question of allQuestions) {
    const key = `${question.test_type}|${question.test_mode}|${question.section_name}`;

    if (!sectionGroups.has(key)) {
      sectionGroups.set(key, {
        test_type: question.test_type,
        test_mode: question.test_mode,
        section_name: question.section_name,
        questions: []
      });
    }

    sectionGroups.get(key)!.questions.push(question);
  }

  console.log(`   Grouped into ${sectionGroups.size} sections\n`);

  // Step 3: Process each section
  console.log('🔄 Step 3: Assigning question_order values...\n');

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [key, group] of sectionGroups.entries()) {
    const { test_type, test_mode, section_name, questions } = group;

    console.log(`\n📝 Processing: ${test_type} > ${test_mode} > ${section_name}`);
    console.log(`   Questions: ${questions.length}`);

    // Determine if this section should be randomized
    const shouldRandomize = shouldRandomizeSection(section_name);

    if (shouldRandomize) {
      console.log(`   🔀 Randomization: YES (non-passage section)`);

      // Generate seed based on test configuration
      const seed = generateQuestionOrderSeed(test_type, test_mode, section_name);
      console.log(`   🌱 Seed: ${seed}`);

      // Generate shuffled order indices
      const orderIndices = generateQuestionOrders(questions.length, seed);

      // Assign question_order to each question
      const updates = [];
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const newOrder = orderIndices[i];

        updates.push({
          id: question.id,
          question_order: newOrder
        });
      }

      // Batch update in chunks of 100 to avoid timeout
      const chunkSize = 100;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);

        for (const update of chunk) {
          const { error: updateError } = await supabase
            .from('questions_v2')
            .update({ question_order: update.question_order })
            .eq('id', update.id);

          if (updateError) {
            console.error(`      ❌ Error updating ${update.id}:`, updateError.message);
            totalErrors++;
          } else {
            totalUpdated++;
          }
        }
      }

      console.log(`   ✅ Updated ${updates.length} questions with randomized order`);
      totalProcessed += updates.length;

    } else {
      console.log(`   📖 Randomization: NO (passage-based section)`);

      // For passage-based sections, assign sequential order based on current ordering
      // (which should already be grouped by passage)
      const updates = [];
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        updates.push({
          id: question.id,
          question_order: i
        });
      }

      // Batch update
      const chunkSize = 100;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);

        for (const update of chunk) {
          const { error: updateError } = await supabase
            .from('questions_v2')
            .update({ question_order: update.question_order })
            .eq('id', update.id);

          if (updateError) {
            console.error(`      ❌ Error updating ${update.id}:`, updateError.message);
            totalErrors++;
          } else {
            totalUpdated++;
          }
        }
      }

      console.log(`   ✅ Updated ${updates.length} questions with sequential order`);
      totalProcessed += updates.length;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('✅ BACKFILL COMPLETE');
  console.log('='.repeat(80));
  console.log(`📊 Summary:`);
  console.log(`   Total questions processed: ${totalProcessed}`);
  console.log(`   Successfully updated: ${totalUpdated}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Sections processed: ${sectionGroups.size}`);
  console.log('='.repeat(80) + '\n');

  if (totalErrors > 0) {
    console.error('⚠️  Some updates failed. Please review errors above.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
