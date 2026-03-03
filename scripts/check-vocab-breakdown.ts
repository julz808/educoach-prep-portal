import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const { data, error } = await supabase
  .from('questions_v2')
  .select('sub_skill, passage_id')
  .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
  .eq('section_name', 'Reading Reasoning')
  .eq('test_mode', 'practice_2')
  .eq('sub_skill', 'Vocabulary in Context');

if (error) {
  console.error('Error:', error);
} else {
  const standalone = data.filter(q => q.passage_id === null).length;
  const passageBased = data.filter(q => q.passage_id !== null).length;
  console.log(`Vocabulary in Context for practice_2:`);
  console.log(`  Standalone (passage_id IS NULL): ${standalone}`);
  console.log(`  Passage-based (passage_id NOT NULL): ${passageBased}`);
  console.log(`  Total: ${data.length}`);
  console.log('');
  console.log('Expected from config:');
  console.log('  Standalone: 5');
  console.log('  Passage-based (from 3 micro passages × 2 q each): 6');
  console.log('  Total expected: 11');
}
