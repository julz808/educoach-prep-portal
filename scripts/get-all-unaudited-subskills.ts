#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Already audited sub-skills
const audited = [
  'Letter Series & Patterns',
  'Code & Symbol Substitution',
  'Pattern Recognition in Paired Numbers',
  'Analogies',
  'Logical Deduction & Critical Thinking',
  'Grammar, Punctuation & Sentence Structure'
];

async function main() {
  const { data: questions } = await supabase
    .from('questions_v2')
    .select('sub_skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)');

  const subSkills: Record<string, number> = {};
  questions?.forEach(q => {
    if (!subSkills[q.sub_skill]) subSkills[q.sub_skill] = 0;
    subSkills[q.sub_skill]++;
  });

  console.log('ALL VIC SELECTIVE SUB-SKILLS:\n');
  console.log('='.repeat(80));

  const unaudited = [];

  Object.entries(subSkills).sort((a, b) => b[1] - a[1]).forEach(([skill, count]) => {
    const status = audited.includes(skill) ? '✅ AUDITED' : '❌ TBC';
    console.log(`${status.padEnd(12)} | ${count.toString().padStart(3)} questions | ${skill}`);

    if (!audited.includes(skill)) {
      unaudited.push({ skill, count });
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\nUNAUDITED SUB-SKILLS: ${unaudited.length}`);
  console.log(`Total unaudited questions: ${unaudited.reduce((sum, s) => sum + s.count, 0)}\n`);

  // Get 30 sample questions from each unaudited sub-skill
  for (const { skill, count } of unaudited) {
    const limit = Math.min(30, count);
    const { data: samples } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
      .eq('sub_skill', skill)
      .limit(limit);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`SUB-SKILL: ${skill} (${count} total, sampling ${limit})`);
    console.log('='.repeat(80));

    samples?.forEach((q, i) => {
      console.log(`\n${i+1}. ${q.test_mode} Q${q.question_order}`);
      console.log(`Question: ${q.question_text.substring(0, 200)}`);
      if (q.answer_options && q.answer_options.length > 0) {
        console.log(`Options: ${q.answer_options.slice(0, 3).join(', ')}...`);
      }
      console.log(`Correct: ${q.correct_answer}`);
      console.log(`ID: ${q.id}`);
    });
  }
}

main();
