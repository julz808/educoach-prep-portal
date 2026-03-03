import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkEmbeddedPassageDetails() {
  // Check questions that have "Read the following passage:" in their question_text
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning')
    .ilike('question_text', '%Read the following passage:%')
    .limit(5);

  console.log(`Found ${questions?.length} questions with embedded passages\n`);

  for (const q of questions || []) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Question ID: ${q.id}`);
    console.log(`Passage ID: ${q.passage_id}`);
    console.log(`Sub-skill: ${q.sub_skill_id}`);
    console.log(`\nQuestion text (length: ${q.question_text.length}):`);
    console.log(q.question_text);
    console.log('');
  }
}

checkEmbeddedPassageDetails().catch(console.error);
