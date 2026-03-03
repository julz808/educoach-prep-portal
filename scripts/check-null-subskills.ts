import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data } = await supabase
    .from('questions_v2')
    .select('id, sub_skill, passage_id, question_text')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning')
    .is('sub_skill', null)
    .limit(10);

  console.log(`Questions with sub_skill = null: ${data?.length}`);
  data?.forEach(q => {
    console.log(`\n  ID: ${q.id}`);
    console.log(`  Sub-skill: ${q.sub_skill}`);
    console.log(`  Passage ID: ${q.passage_id}`);
    console.log(`  Question preview: ${q.question_text.substring(0, 80)}...`);
  });
}

check();
