import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchAllFractions() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Fractions, Decimals & Percentages')
    .order('id');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`FRACTIONS, DECIMALS & PERCENTAGES - ALL ${data.length} Questions\n`);
  console.log('='.repeat(80));

  data.forEach((q: any, index: number) => {
    console.log(`Q${index + 1}: ${q.test_mode} Q${q.question_number}`);
    console.log('='.repeat(80));
    console.log(`Question: ${q.question_text}`);
    console.log(`Options: ${q.options.join(', ')}`);
    console.log(`Correct: ${q.correct_answer}`);
    console.log(`ID: ${q.id}`);
    console.log();
  });
}

fetchAllFractions();
