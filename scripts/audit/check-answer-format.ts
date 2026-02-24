import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnswerFormat() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', '4cdaf4c0-120a-44d8-8e41-7d87e3a980e7')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Question:', data.question_text);
  console.log('\nAnswer Options:');
  data.answer_options?.forEach((opt: string, i: number) => {
    console.log(`  ${i + 1}. "${opt}"`);
  });
  console.log('\nCorrect Answer:');
  console.log(`  "${data.correct_answer}"`);
  console.log('\nMatch check:');
  console.log('  Direct match:', data.answer_options?.includes(data.correct_answer));
  console.log('  Includes check:', data.answer_options?.some((opt: string) => opt.includes(data.correct_answer)));
  console.log('  Starts with check:', data.answer_options?.some((opt: string) => opt.startsWith(data.correct_answer + ')')));
}

checkAnswerFormat();
