import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getFullQuestions() {
  const { data } = await supabase
    .from('questions_v2')
    .select('*')
    .in('id', ['46a1f383-e9b8-4117-8c03-80a36a99163f', 'd9bfc32b-5fef-460c-8efa-2faec1f23b84']);

  fs.writeFileSync('/tmp/error_questions.json', JSON.stringify(data, null, 2));
  console.log('Saved to /tmp/error_questions.json');

  data?.forEach((q, i) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Question ${i + 1}: ${q.question_text?.substring(0, 60)}...`);
    console.log(`Options:`, q.options);
    console.log(`Stored Answer: ${q.correct_answer}`);
  });
}

getFullQuestions();
