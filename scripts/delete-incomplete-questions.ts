import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const incompleteQuestionIds = [
  "48c1a39a-b75f-4875-b38e-d6b4791ca33e",
  "6db49112-92ba-4ade-91cd-4aebf8c4a9f8",
  "ae321a4d-2b5e-4aaf-9ce6-c229723da83b",
  "f9feb86f-8a0a-4e53-8523-76a6f9c29b3c",
  "fcbfa39d-c352-4f3a-90be-fca5e51250bf",
  "c3f8c9ec-6ee5-4d98-8cd6-43d15f2463ef",
  "1c013a8f-ecbc-4b74-acab-0b05cdc8b6b0"
];

async function deleteIncompleteQuestions() {
  console.log('=== DELETING INCOMPLETE QUESTIONS ===\n');
  console.log(`Questions to delete: ${incompleteQuestionIds.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const id of incompleteQuestionIds) {
    // Fetch question details first
    const { data: question } = await supabase
      .from('questions_v2')
      .select('test_type, section_name, sub_skill, question_text')
      .eq('id', id)
      .single();

    if (question) {
      console.log(`Deleting: ${question.test_type} - ${question.section_name} - ${question.sub_skill}`);
      console.log(`  Question: ${question.question_text.substring(0, 80)}...`);
    }

    // Delete the question
    const { error } = await supabase
      .from('questions_v2')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`  ❌ Error deleting ${id}:`, error.message);
      errorCount++;
    } else {
      console.log(`  ✅ Deleted successfully\n`);
      successCount++;
    }
  }

  console.log('\n=== DELETION SUMMARY ===');
  console.log(`✅ Successfully deleted: ${successCount}`);
  console.log(`❌ Failed to delete: ${errorCount}`);
  console.log('\nThese questions can now be regenerated with the fixed generation engine.');
}

deleteIncompleteQuestions();
