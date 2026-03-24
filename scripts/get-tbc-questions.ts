#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Get Number Series questions
  const { data: numberSeries } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Number Series & Sequences')
    .limit(10);

  // Get Vocabulary questions
  const { data: vocab } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .like('sub_skill', '%Vocabulary%')
    .limit(10);

  // Get Word Completion questions
  const { data: wordComp } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .like('sub_skill', '%Word Completion%')
    .limit(10);

  // Get Odd One Out questions
  const { data: oddOne } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Odd One Out - Classification')
    .limit(10);

  console.log('NUMBER SERIES QUESTIONS (10):');
  console.log('='.repeat(80));
  numberSeries?.forEach((q, i) => {
    console.log(`\n${i+1}. ${q.test_mode} Q${q.question_order}`);
    console.log(`Question: ${q.question_text.substring(0, 150)}`);
    console.log(`Options: ${q.answer_options.slice(0, 3).join(', ')}`);
    console.log(`Correct: ${q.correct_answer}`);
    console.log(`ID: ${q.id}`);
  });

  console.log('\n\n' + '='.repeat(80));
  console.log('VOCABULARY QUESTIONS (10):');
  console.log('='.repeat(80));
  vocab?.forEach((q, i) => {
    console.log(`\n${i+1}. ${q.test_mode} Q${q.question_order}`);
    console.log(`Question: ${q.question_text.substring(0, 150)}`);
    console.log(`Options: ${q.answer_options.slice(0, 3).join(', ')}`);
    console.log(`Correct: ${q.correct_answer}`);
    console.log(`ID: ${q.id}`);
  });

  console.log('\n\n' + '='.repeat(80));
  console.log('WORD COMPLETION QUESTIONS (10):');
  console.log('='.repeat(80));
  wordComp?.forEach((q, i) => {
    console.log(`\n${i+1}. ${q.test_mode} Q${q.question_order}`);
    console.log(`Question: ${q.question_text.substring(0, 150)}`);
    console.log(`Options: ${q.answer_options.slice(0, 3).join(', ')}`);
    console.log(`Correct: ${q.correct_answer}`);
    console.log(`ID: ${q.id}`);
  });

  console.log('\n\n' + '='.repeat(80));
  console.log('ODD ONE OUT QUESTIONS (10):');
  console.log('='.repeat(80));
  oddOne?.forEach((q, i) => {
    console.log(`\n${i+1}. ${q.test_mode} Q${q.question_order}`);
    console.log(`Question: ${q.question_text.substring(0, 150)}`);
    console.log(`Options: ${q.answer_options.slice(0, 3).join(', ')}`);
    console.log(`Correct: ${q.correct_answer}`);
    console.log(`ID: ${q.id}`);
  });
}

main();
