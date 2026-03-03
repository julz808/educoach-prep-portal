import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('passage_id, sub_skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning')
    .eq('test_mode', 'practice_1')
    .eq('sub_skill', 'Vocabulary in Context');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const standalone = data.filter(q => q.passage_id === null || q.passage_id === undefined);
  const passageBased = data.filter(q => q.passage_id !== null && q.passage_id !== undefined);

  console.log('Vocabulary in Context in practice_1:');
  console.log('  Standalone:', standalone.length);
  console.log('  Passage-based:', passageBased.length);
  console.log('  Total:', data.length);
}

check();
