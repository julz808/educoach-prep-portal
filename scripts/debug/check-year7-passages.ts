import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkPassages() {
  const { data, error } = await supabase
    .from('passages_v2')
    .select('id, title, passage_type, generation_metadata')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Reading');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📚 Year 7 NAPLAN Reading Passages:');
  console.log('━'.repeat(60));
  console.log(`Total passages: ${data.length}`);
  console.log('');

  const byType = data.reduce((acc, p) => {
    acc[p.passage_type] = (acc[p.passage_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('By type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('');
  console.log('Sample passages:');
  data.slice(0, 5).forEach(p => {
    console.log(`  - ${p.passage_type}: ${p.title.substring(0, 50)}...`);
  });

  console.log('');

  // Check existing questions
  const { data: questions, error: qError } = await supabase
    .from('questions_v2')
    .select('id, passage_id, sub_skill, test_mode')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Reading');

  if (qError) {
    console.error('Questions error:', qError);
    return;
  }

  console.log(`📝 Existing questions: ${questions.length}`);
  console.log('');

  const byMode = questions.reduce((acc, q) => {
    acc[q.test_mode] = (acc[q.test_mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('By mode:');
  Object.entries(byMode).forEach(([mode, count]) => {
    console.log(`  ${mode}: ${count}`);
  });

  console.log('');
  console.log('Questions with missing passage_id:', questions.filter(q => !q.passage_id).length);
}

checkPassages();
