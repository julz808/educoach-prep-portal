import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAnswerOptions() {
  console.log('🔍 Checking answer_options structure...\n');

  // Get a few questions with different types
  const { data: year5 } = await supabase
    .from('questions_v2')
    .select('id, test_type, question_text, answer_options, correct_answer')
    .eq('test_type', 'Year 5 NAPLAN')
    .eq('section_name', 'Language Conventions')
    .limit(3);

  const { data: year7 } = await supabase
    .from('questions_v2')
    .select('id, test_type, question_text, answer_options, correct_answer')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Language Conventions')
    .limit(3);

  console.log('Year 5 NAPLAN Examples:\n');
  year5?.forEach((q, idx) => {
    console.log(`Example ${idx + 1}:`);
    console.log(`Question text: ${q.question_text.substring(0, 150)}...`);
    console.log(`answer_options type: ${typeof q.answer_options}`);
    console.log(`answer_options value:`, q.answer_options);
    console.log(`correct_answer: ${q.correct_answer}\n`);
  });

  console.log('\nYear 7 NAPLAN Examples:\n');
  year7?.forEach((q, idx) => {
    console.log(`Example ${idx + 1}:`);
    console.log(`Question text: ${q.question_text.substring(0, 150)}...`);
    console.log(`answer_options type: ${typeof q.answer_options}`);
    console.log(`answer_options value:`, q.answer_options);
    console.log(`correct_answer: ${q.correct_answer}\n`);
  });
}

checkAnswerOptions();
