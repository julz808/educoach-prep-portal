import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRemainingLongQuestions() {
  console.log('Checking remaining long questions...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, test_type, section_name, question_text, passage_id')
    .not('passage_id', 'is', null)
    .order('question_text');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const longQuestions = (questions || []).filter(q => q.question_text.length > 500);

  console.log(`Found ${longQuestions.length} questions with >500 characters\n`);

  for (const q of longQuestions.slice(0, 5)) {
    console.log(`\n=== ${q.test_type} - ${q.section_name} ===`);
    console.log(`ID: ${q.id}`);
    console.log(`Length: ${q.question_text.length} chars`);
    const preview = q.question_text.substring(0, 400);
    console.log(`\nPreview:\n${preview}...\n`);
  }
}

checkRemainingLongQuestions();
