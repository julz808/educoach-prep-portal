#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, test_mode, question_order, section_name, passage_id')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .in('section_name', ['General Ability - Verbal', 'Reading Reasoning'])
    .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .not('passage_id', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total questions with passage_id: ${questions?.length || 0}\n`);

  let undefinedCount = 0;

  for (const q of questions || []) {
    const { data: passage, error: pError } = await supabase
      .from('passages_v2')
      .select('passage_text')
      .eq('id', q.passage_id)
      .single();

    if (pError || !passage || passage.passage_text === null || passage.passage_text === 'undefined') {
      undefinedCount++;
      console.log(`❌ ${q.test_mode} Q${q.question_order} - ${q.section_name}`);
      console.log(`   ID: ${q.id}, Passage ID: ${q.passage_id}`);
      console.log(`   Issue: ${pError ? pError.message : 'Passage text is null/undefined'}\n`);
    }
  }

  console.log(`\nTotal questions with undefined/missing passages: ${undefinedCount}`);
}

main();
