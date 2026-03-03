import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkVicReading() {
  console.log('Checking VIC Selective Entry Reading Reasoning questions...\n');

  const testType = 'VIC Selective Entry (Year 9 Entry) - Reading Reasoning';

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, sub_skill')
    .eq('test_type', testType)
    .order('id')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} questions`);

  for (const q of questions || []) {
    console.log(`\n=== Question ID: ${q.id} ===`);
    console.log(`Sub-skill: ${q.sub_skill}`);
    console.log(`Has passage: ${!!q.passage_id}`);
    console.log(`Passage ID: ${q.passage_id || 'N/A'}`);
    console.log(`Question text length: ${q.question_text.length}`);
    console.log(`\nQuestion text:`);
    console.log(q.question_text.substring(0, 500));
    if (q.question_text.length > 500) {
      console.log(`\n... (truncated, total ${q.question_text.length} chars)`);
    }
  }

  // Get total count
  const { count } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('test_type', testType);

  console.log(`\n\nTotal questions for this test type: ${count}`);
}

checkVicReading();
