#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getVocabularyQuestions() {
  const { data: questions } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Vocabulary & Synonyms/Antonyms')
    .order('test_mode')
    .order('question_order')
    .limit(30);

  if (!questions) {
    console.log('No questions found');
    return;
  }

  console.log(`Found ${questions.length} Vocabulary questions\n`);

  questions.forEach((q, i) => {
    console.log('='.repeat(80));
    console.log(`Q${i+1}: ${q.test_mode} Q${q.question_order}`);
    console.log('='.repeat(80));
    console.log(`Question: ${q.question_text}`);
    if (q.answer_options && q.answer_options.length > 0) {
      console.log(`Options: ${q.answer_options.join(', ')}`);
    }
    console.log(`Correct: ${q.correct_answer}`);
    console.log(`ID: ${q.id}`);
    console.log();
  });
}

getVocabularyQuestions();
