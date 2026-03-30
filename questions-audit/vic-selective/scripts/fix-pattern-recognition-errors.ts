#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const errors = [
  {
    id: '6d1ba889-fc3f-44b6-9129-3e98db8af83a',
    test_mode: 'drill',
    question_order: 45,
    issue: 'Inconsistent pattern - 3 pairs use a×(a-1), answer uses a×(a+1)',
    pairs: '(23, 506) (19, 342) (31, ?) (27, 702)',
    correct_answer: 930, // 31 × 30
    stored_answer: 992  // 31 × 32
  },
  {
    id: 'e5dbfaec-47b9-48dd-b45c-a456d2230c30',
    test_mode: 'practice_3',
    question_order: 34,
    issue: 'Inconsistent pattern - 3 pairs use b×(b+2), answer uses b²',
    pairs: '(24, 4) (35, 5) (?, 8) (63, 7)',
    correct_answer: 80, // 8 × (8+2)
    stored_answer: 64  // 8 × 8
  }
];

function generateDistractors(correct: number): number[] {
  const options = new Set<number>();
  options.add(correct);

  // Generate plausible distractors
  options.add(correct + 1);
  options.add(correct - 1);
  options.add(correct + 10);
  options.add(correct - 10);
  options.add(Math.round(correct * 1.1));
  options.add(Math.round(correct * 0.9));
  options.add(Math.round(correct * 1.2));

  const optionsArray = Array.from(options);
  return optionsArray.slice(0, 5);
}

async function fixQuestion(error: typeof errors[0]) {
  console.log(`\nFixing ${error.test_mode} Q${error.question_order}...`);
  console.log(`Issue: ${error.issue}`);
  console.log(`Pairs: ${error.pairs}`);
  console.log(`Changing answer from ${error.stored_answer} to ${error.correct_answer}`);

  const options = generateDistractors(error.correct_answer);

  // Shuffle options
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const correctIndex = shuffled.indexOf(error.correct_answer);
  const correctLetter = String.fromCharCode(65 + correctIndex);
  const formattedOptions = shuffled.map((opt, idx) =>
    `${String.fromCharCode(65 + idx)}) ${opt}`
  );

  // Generate solution based on the error
  let solution = '';
  if (error.id === '6d1ba889-fc3f-44b6-9129-3e98db8af83a') {
    solution = `• Look at the relationship between the numbers in each pair
• In the first pair: 23 × 22 = 506
• In the second pair: 19 × 18 = 342
• In the fourth pair: 27 × 26 = 702
• The pattern is: first number × (first number - 1) = second number
• For the missing pair: 31 × 30 = 930
• Therefore, the answer is ${error.correct_answer}`;
  } else if (error.id === 'e5dbfaec-47b9-48dd-b45c-a456d2230c30') {
    solution = `• Look at the relationship between the numbers in each pair
• In the first pair: 4 × (4 + 2) = 4 × 6 = 24
• In the second pair: 5 × (5 + 2) = 5 × 7 = 35
• In the fourth pair: 7 × (7 + 2) = 7 × 9 = 63
• The pattern is: second number × (second number + 2) = first number
• For the missing pair: 8 × (8 + 2) = 8 × 10 = 80
• Therefore, the answer is ${error.correct_answer}`;
  }

  const { error: updateError } = await supabase
    .from('questions_v2')
    .update({
      answer_options: formattedOptions,
      correct_answer: correctLetter,
      solution: solution,
      updated_at: new Date().toISOString()
    })
    .eq('id', error.id);

  if (updateError) {
    console.log(`   ❌ ERROR updating: ${updateError.message}`);
    return false;
  }

  console.log(`   ✅ FIXED: Answer changed to ${correctLetter} (${error.correct_answer})`);
  console.log(`   Options: ${formattedOptions.join(', ')}`);
  return true;
}

async function main() {
  console.log('Fixing Pattern Recognition errors...\n');
  console.log(`Total errors to fix: ${errors.length}\n`);

  let fixed = 0;
  for (const error of errors) {
    const success = await fixQuestion(error);
    if (success) fixed++;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Fixes applied: ${fixed} / ${errors.length}`);
  console.log(`${'='.repeat(80)}`);
}

main();
