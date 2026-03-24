#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const testMode = process.argv[2] || 'practice_1';

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .in('section_name', ['General Ability - Verbal', 'Reading Reasoning'])
    .eq('test_mode', testMode)
    .order('question_order', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\n${'='.repeat(100)}`);
  console.log(`VIC SELECTIVE - ${testMode.toUpperCase()} AUDIT`);
  console.log(`${'='.repeat(100)}\n`);
  console.log(`Total Questions: ${questions?.length || 0}\n`);

  for (const q of questions || []) {
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`Q${q.question_order} | ${q.section_name} | ${q.sub_skill || 'N/A'}`);
    console.log(`${'─'.repeat(100)}`);

    // Fetch passage if exists
    if (q.passage_id) {
      const { data: passage } = await supabase
        .from('passages_v2')
        .select('*')
        .eq('id', q.passage_id)
        .single();

      if (passage) {
        console.log(`\n📖 PASSAGE:\n${passage.passage_text}\n`);
      }
    }

    console.log(`\n❓ ${q.question_text}\n`);
    console.log(`OPTIONS:`);
    q.answer_options.forEach((opt: string) => {
      const isCorrect = opt.startsWith(q.correct_answer + ')');
      console.log(`  ${opt}${isCorrect ? ' ✓✓✓' : ''}`);
    });

    console.log(`\n💭 SOLUTION:\n${q.solution}\n`);
    console.log(`🆔 ID: ${q.id}`);
  }

  console.log(`\n${'='.repeat(100)}`);
  console.log(`END OF ${testMode.toUpperCase()}`);
  console.log(`${'='.repeat(100)}\n`);
}

main();
