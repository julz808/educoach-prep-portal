#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('sub_skill, skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const verbalQuestions = questions.filter(q =>
    q.skill && (q.skill.includes('Verbal') || q.skill.includes('Reading'))
  );

  const subSkills: Record<string, number> = {};
  verbalQuestions.forEach(q => {
    if (!subSkills[q.sub_skill]) subSkills[q.sub_skill] = 0;
    subSkills[q.sub_skill]++;
  });

  console.log('All Verbal & Reading Reasoning Sub-Skills:\n');
  Object.entries(subSkills).sort((a, b) => b[1] - a[1]).forEach(([skill, count]) => {
    console.log(`${count.toString().padStart(3)} questions - ${skill}`);
  });
  console.log(`\n${verbalQuestions.length} total questions`);
}

main();
