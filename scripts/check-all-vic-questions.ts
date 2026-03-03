import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllVicQuestions() {
  console.log('Checking all VIC questions...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, test_type, section_name, sub_skill, passage_id, question_text')
    .or('test_type.ilike.%vic%,test_type.ilike.%selective%')
    .order('test_type, section_name')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} VIC questions (showing first 10)`);

  for (const q of questions || []) {
    console.log(`\nID: ${q.id}`);
    console.log(`Test Type: ${q.test_type}`);
    console.log(`Section: ${q.section_name}`);
    console.log(`Sub-skill: ${q.sub_skill}`);
    console.log(`Has passage: ${!!q.passage_id}`);
    console.log(`Question text length: ${q.question_text.length}`);
    if (q.question_text.length > 200) {
      console.log(`Preview: ${q.question_text.substring(0, 200)}...`);
    } else {
      console.log(`Text: ${q.question_text}`);
    }
  }
}

checkAllVicQuestions();
