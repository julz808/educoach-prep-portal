#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Pattern Recognition in Paired Numbers')
    .order('test_mode')
    .order('question_order')
    .limit(5);

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample Pattern Recognition questions:\n');
  for (const q of questions) {
    console.log('Test Mode:', q.test_mode, 'Q' + q.question_order);
    console.log('Question:', q.question_text.substring(0, 300));
    console.log('Options:', q.answer_options.slice(0, 3).join(', '));
    console.log('Correct:', q.correct_answer);
    console.log('ID:', q.id);
    console.log('');
  }
}

main();
