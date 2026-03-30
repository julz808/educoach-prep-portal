#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data } = await supabase.from('questions_v2').select('*').eq('test_type', 'VIC Selective Entry (Year 9 Entry)').eq('sub_skill', 'Applied Word Problems').order('test_mode').order('question_order');
console.log(`Found ${data?.length} total Applied Word Problems\n`);
data?.forEach((q: any, i: number) => {
  console.log('='.repeat(80));
  console.log(`Q${i+1}: ${q.test_mode} Q${q.question_order}`);
  console.log('='.repeat(80));
  console.log(`Question: ${q.question_text}`);
  if (q.answer_options) console.log(`Options: ${q.answer_options.join(', ')}`);
  console.log(`Correct: ${q.correct_answer}`);
  console.log(`ID: ${q.id}`);
  console.log();
});
