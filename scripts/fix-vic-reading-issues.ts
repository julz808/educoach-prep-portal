import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixVicReadingIssues() {
  console.log('🔧 Fixing VIC Selective Entry Reading Reasoning issues...\n');

  // Load the audit report to know which questions to fix/delete
  const report = JSON.parse(fs.readFileSync('vic-reading-issues-report.json', 'utf-8'));

  console.log('═══════════════════════════════════════════════════════════');
  console.log('ISSUE 2: DELETING DUPLICATE QUESTIONS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const questionIdsToDelete: string[] = [];

  for (const group of report.issue2_duplicates.groups) {
    console.log(`\n📝 Group: "${group.normalizedText.substring(0, 60)}..."`);
    console.log(`   Total copies: ${group.count}`);
    console.log(`   Keeping: ${group.keepFirst}`);
    console.log(`   Deleting: ${group.deleteIds.join(', ')}`);

    questionIdsToDelete.push(...group.deleteIds);
  }

  console.log(`\n\n📊 Total questions to delete: ${questionIdsToDelete.length}`);

  if (questionIdsToDelete.length > 0) {
    console.log('\n🗑️  Deleting duplicate questions...');

    const { error: deleteError, count } = await supabase
      .from('questions_v2')
      .delete()
      .in('id', questionIdsToDelete);

    if (deleteError) {
      console.error('❌ Error deleting questions:', deleteError);
    } else {
      console.log(`✅ Successfully deleted ${questionIdsToDelete.length} duplicate questions`);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('ISSUE 1: FIXING QUESTIONS WITH EMBEDDED PASSAGES');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Find all questions with "Read the following passage:" or "Read this passage:"
  // These questions have the passage embedded in question_text instead of stored separately
  const { data: embeddedPassageQuestions, error: fetchError } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning')
    .or('question_text.ilike.%Read the following passage:%,question_text.ilike.%Read this passage:%');

  if (fetchError) {
    console.error('❌ Error fetching embedded passage questions:', fetchError);
    return;
  }

  console.log(`\n📊 Found ${embeddedPassageQuestions?.length || 0} questions with embedded passages\n`);

  // These questions are incorrectly formatted:
  // 1. They have passage_id = null (should have a passage)
  // 2. They have sub_skill = null (should have a sub-skill)
  // 3. The passage is embedded in question_text
  //
  // The best fix is to DELETE these malformed questions entirely
  // They will be regenerated correctly by the generation engine

  if (embeddedPassageQuestions && embeddedPassageQuestions.length > 0) {
    console.log('⚠️  These questions are malformed (no passage_id, no sub_skill, passage embedded in question_text)');
    console.log('🗑️  Best approach: DELETE them and regenerate correctly\n');

    const embeddedPassageIds = embeddedPassageQuestions.map(q => q.id);

    console.log(`Deleting ${embeddedPassageIds.length} malformed questions...`);

    const { error: deleteEmbeddedError } = await supabase
      .from('questions_v2')
      .delete()
      .in('id', embeddedPassageIds);

    if (deleteEmbeddedError) {
      console.error('❌ Error deleting embedded passage questions:', deleteEmbeddedError);
    } else {
      console.log(`✅ Successfully deleted ${embeddedPassageIds.length} malformed questions with embedded passages`);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Duplicate questions deleted: ${questionIdsToDelete.length}`);
  console.log(`Malformed questions deleted: ${embeddedPassageQuestions?.length || 0}`);
  console.log(`Total questions removed: ${questionIdsToDelete.length + (embeddedPassageQuestions?.length || 0)}`);
  console.log('\n✅ All fixes complete!');
  console.log('\n💡 Next step: Regenerate questions for affected sub-skills to reach target counts');
}

fixVicReadingIssues().catch(console.error);
