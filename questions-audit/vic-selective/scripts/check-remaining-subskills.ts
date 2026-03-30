import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const completedSubSkills = [
  'Letter Series & Patterns',
  'Code & Symbol Substitution',
  'Pattern Recognition in Paired Numbers', // Pattern Recognition
  'Algebraic Equations & Problem Solving',
  'Applied Word Problems',
  'Fractions, Decimals & Percentages',
  'Analogies - Word Relationships', // Both versions
  'Grammar & Sentence Structure', // Grammar, Punctuation & Sentence Structure
  'Number Series & Sequences', // Number Series
  'Vocabulary & Synonyms/Antonyms',
  'Ratios & Proportions',
  'Logical Deduction & Conditional Reasoning',
  'Number Operations & Properties'
];

async function checkRemaining() {
  const { data } = await supabase
    .from('questions_v2')
    .select('sub_skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)');

  const counts = data!.reduce((acc: Record<string, number>, row) => {
    acc[row.sub_skill] = (acc[row.sub_skill] || 0) + 1;
    return acc;
  }, {});

  const all = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));

  console.log('\n=== REMAINING SUB-SKILLS TO AUDIT ===\n');

  let remaining = all.filter(([skill]) =>
    !completedSubSkills.some(completed =>
      skill.toLowerCase().includes(completed.toLowerCase()) ||
      completed.toLowerCase().includes(skill.toLowerCase())
    )
  );

  remaining.sort((a, b) => a[1] - b[1]); // Sort by question count

  let totalRemaining = 0;
  remaining.forEach(([skill, count], i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${skill.padEnd(60)} ${count} questions`);
    totalRemaining += count;
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total remaining: ${remaining.length} sub-skills, ${totalRemaining} questions`);
  console.log(`Completed: ${completedSubSkills.length} sub-skills`);
  console.log(`Total: ${all.length} sub-skills, ${data!.length} questions\n`);
}

checkRemaining();
