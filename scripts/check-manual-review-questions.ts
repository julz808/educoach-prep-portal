import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const questionIds = [
  "fbc08706-a564-4061-881b-69a978b9f392",
  "cb96197c-da94-401c-872f-9ca2bd726e38",
  "b27cd301-9193-4a6e-8ce2-bf77d470f93d",
  "4609fb04-0a0b-45b9-83e9-56ee62f790b4",
  "ce80f1a6-98c9-42f3-bdc1-d084cf8b34e8",
];

async function checkQuestions() {
  for (const id of questionIds) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching ${id}:`, error);
      continue;
    }

    console.log('\n====================');
    console.log(`ID: ${id}`);
    console.log(`Question Text:\n${data.question_text}`);
    console.log(`\nAnswer Options: ${JSON.stringify(data.answer_options)}`);
    console.log(`Correct Answer: ${data.correct_answer}`);
  }
}

checkQuestions();
