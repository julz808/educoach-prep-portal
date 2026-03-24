#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const subSkills = [
    'Letter Series & Patterns',
    'Analogies - Word Relationships',
    'Logical Deduction & Conditional Reasoning'
  ];

  console.log('Extracting high-risk questions...\n');

  for (const skill of subSkills) {
    const { data: questions, error } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
      .in('section_name', ['General Ability - Verbal', 'Reading Reasoning'])
      .eq('sub_skill', skill)
      .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
      .order('test_mode', { ascending: true })
      .order('question_order', { ascending: true });

    if (error) {
      console.error(`Error fetching ${skill}:`, error);
      continue;
    }

    console.log(`\n${'='.repeat(100)}`);
    console.log(`${skill.toUpperCase()}`);
    console.log(`Total Questions: ${questions?.length || 0}`);
    console.log(`${'='.repeat(100)}\n`);

    for (const q of questions || []) {
      console.log(`\n${'─'.repeat(100)}`);
      console.log(`${q.test_mode.toUpperCase()} Q${q.question_order} | ${q.section_name}`);
      console.log(`ID: ${q.id}`);
      console.log(`${'─'.repeat(100)}`);

      console.log(`\n❓ QUESTION:\n${q.question_text}\n`);

      console.log(`OPTIONS:`);
      q.answer_options.forEach((opt: string) => {
        const isCorrect = opt.startsWith(q.correct_answer + ')');
        console.log(`  ${opt}${isCorrect ? ' ✓✓✓ STORED' : ''}`);
      });

      console.log(`\n💭 SOLUTION:\n${q.solution}\n`);
    }
  }
}

main();
