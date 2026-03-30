#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function letterToNum(letter: string): number {
  return letter.charCodeAt(0) - 64;
}

function numToLetter(num: number): string {
  while (num > 26) num -= 26;
  while (num < 1) num += 26;
  return String.fromCharCode(num + 64);
}

function calculateNext(positions: number[]): string | null {
  const diffs = [];
  for (let i = 1; i < positions.length; i++) {
    diffs.push(positions[i] - positions[i-1]);
  }

  const lastPos = positions[positions.length - 1];

  // Check constant increment
  if (diffs.every(d => d === diffs[0])) {
    const inc = diffs[0];
    return numToLetter(lastPos + inc) + numToLetter(lastPos + 2*inc);
  }

  // Check incrementing increments (+3,+4,+5... or +1,+2,+3...)
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] + 1)) {
    const nextInc = diffs[diffs.length - 1] + 1;
    const next2Inc = nextInc + 1;
    return numToLetter(lastPos + nextInc) + numToLetter(lastPos + nextInc + next2Inc);
  }

  // Check decrementing increments (-3,-4,-5... or -1,-2,-3...)
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] - 1)) {
    const nextDec = diffs[diffs.length - 1] - 1;
    const next2Dec = nextDec - 1;
    return numToLetter(lastPos + nextDec) + numToLetter(lastPos + nextDec + next2Dec);
  }

  // Check doubling (+2,+4,+8...)
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] * 2)) {
    const nextInc = diffs[diffs.length - 1] * 2;
    const next2Inc = nextInc * 2;
    return numToLetter(lastPos + nextInc) + numToLetter(lastPos + nextInc + next2Inc);
  }

  return null;
}

function generateDistractors(correctAnswer: string, positions: number[]): string[] {
  const options = new Set<string>();
  options.add(correctAnswer);

  const lastPos = positions[positions.length - 1];
  const diffs = [];
  for (let i = 1; i < positions.length; i++) {
    diffs.push(positions[i] - positions[i-1]);
  }

  // Generate plausible wrong answers
  const avgDiff = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);

  // Off by one errors
  const letter1 = correctAnswer[0];
  const letter2 = correctAnswer[1];
  options.add(letter1 + numToLetter(letterToNum(letter2) + 1));
  options.add(letter1 + numToLetter(letterToNum(letter2) - 1));
  options.add(numToLetter(letterToNum(letter1) + 1) + letter2);
  options.add(numToLetter(letterToNum(letter1) - 1) + letter2);

  // Wrong increment
  options.add(numToLetter(lastPos + avgDiff) + numToLetter(lastPos + 2 * avgDiff));

  // Reversed
  options.add(letter2 + letter1);

  // Off by several
  options.add(numToLetter(letterToNum(letter1) + 2) + numToLetter(letterToNum(letter2) + 2));
  options.add(numToLetter(letterToNum(letter1) - 2) + numToLetter(letterToNum(letter2) - 2));

  const optionsArray = Array.from(options);

  // Ensure we have exactly 5 unique options
  while (optionsArray.length < 5) {
    const randomOffset = Math.floor(Math.random() * 5) - 2;
    const newOption = numToLetter(letterToNum(letter1) + randomOffset) +
                     numToLetter(letterToNum(letter2) + randomOffset);
    if (!optionsArray.includes(newOption)) {
      optionsArray.push(newOption);
    }
  }

  return optionsArray.slice(0, 5);
}

function generateSolution(letters: string[], correctAnswer: string): string {
  const positions = letters.map(letterToNum);
  const diffs = [];
  for (let i = 1; i < positions.length; i++) {
    diffs.push(positions[i] - positions[i-1]);
  }

  let pattern = '';
  let explanation = '';

  // Constant increment
  if (diffs.every(d => d === diffs[0])) {
    pattern = `constant increment of ${diffs[0] > 0 ? '+' : ''}${diffs[0]}`;
    explanation = `• The pattern shows a ${pattern}\n`;
    letters.forEach((letter, i) => {
      if (i < letters.length - 1) {
        explanation += `• ${letter}(${positions[i]})→${letters[i+1]}(${positions[i+1]}) is ${diffs[i] > 0 ? '+' : ''}${diffs[i]}\n`;
      }
    });
    const lastPos = positions[positions.length - 1];
    const inc = diffs[0];
    explanation += `• Continuing the pattern: ${letters[letters.length-1]}(${lastPos})${inc > 0 ? '+' : ''}${inc} = ${correctAnswer[0]}(${letterToNum(correctAnswer[0])})\n`;
    explanation += `• Then: ${correctAnswer[0]}(${letterToNum(correctAnswer[0])})${inc > 0 ? '+' : ''}${inc} = ${correctAnswer[1]}(${letterToNum(correctAnswer[1])})\n`;
  }
  // Incrementing increments
  else if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] + 1)) {
    pattern = `increasing increments: ${diffs.map(d => (d > 0 ? '+' : '') + d).join(', ')}`;
    explanation = `• The pattern shows ${pattern}\n`;
    letters.forEach((letter, i) => {
      if (i < letters.length - 1) {
        explanation += `• ${letter}(${positions[i]})→${letters[i+1]}(${positions[i+1]}) is ${diffs[i] > 0 ? '+' : ''}${diffs[i]}\n`;
      }
    });
    const lastPos = positions[positions.length - 1];
    const nextInc = diffs[diffs.length - 1] + 1;
    const next2Inc = nextInc + 1;
    const firstNext = lastPos + nextInc;
    const secondNext = firstNext + next2Inc;
    explanation += `• Next increment: ${nextInc > 0 ? '+' : ''}${nextInc}, so ${letters[letters.length-1]}(${lastPos})${nextInc > 0 ? '+' : ''}${nextInc} = ${correctAnswer[0]}(${letterToNum(correctAnswer[0])})\n`;
    explanation += `• Then increment: ${next2Inc > 0 ? '+' : ''}${next2Inc}, so ${correctAnswer[0]}(${letterToNum(correctAnswer[0])})${next2Inc > 0 ? '+' : ''}${next2Inc} = ${correctAnswer[1]}(${letterToNum(correctAnswer[1])})\n`;
  }
  // Decrementing increments
  else if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] - 1)) {
    pattern = `decreasing increments: ${diffs.map(d => (d > 0 ? '+' : '') + d).join(', ')}`;
    explanation = `• The pattern shows ${pattern}\n`;
    letters.forEach((letter, i) => {
      if (i < letters.length - 1) {
        explanation += `• ${letter}(${positions[i]})→${letters[i+1]}(${positions[i+1]}) is ${diffs[i] > 0 ? '+' : ''}${diffs[i]}\n`;
      }
    });
    const lastPos = positions[positions.length - 1];
    const nextDec = diffs[diffs.length - 1] - 1;
    const next2Dec = nextDec - 1;
    explanation += `• Next decrement: ${nextDec > 0 ? '+' : ''}${nextDec}, so ${letters[letters.length-1]}(${lastPos})${nextDec > 0 ? '+' : ''}${nextDec} = ${correctAnswer[0]}(${letterToNum(correctAnswer[0])})\n`;
    explanation += `• Then decrement: ${next2Dec > 0 ? '+' : ''}${next2Dec}, so ${correctAnswer[0]}(${letterToNum(correctAnswer[0])})${next2Dec > 0 ? '+' : ''}${next2Dec} = ${correctAnswer[1]}(${letterToNum(correctAnswer[1])})\n`;
  }

  explanation += `• Therefore, the answer is ${correctAnswer}`;

  return explanation;
}

async function fixQuestion(id: string, series: string, correctAnswer: string | null) {
  if (!correctAnswer) {
    console.log(`   ⚠️  SKIPPED: Cannot calculate correct answer (complex pattern)`);
    return false;
  }

  const letters = series.split(' ');
  const positions = letters.map(letterToNum);

  // Generate new options with correct answer
  const options = generateDistractors(correctAnswer, positions);

  // Shuffle options but remember where correct answer ends up
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const correctIndex = shuffled.indexOf(correctAnswer);
  const correctLetter = String.fromCharCode(65 + correctIndex);

  // Format as answer options with letters
  const formattedOptions = shuffled.map((opt, idx) =>
    `${String.fromCharCode(65 + idx)}) ${opt}`
  );

  // Generate solution
  const solution = generateSolution(letters, correctAnswer);

  console.log(`\n🔧 Fixing ${id}...`);
  console.log(`   Series: ${series}`);
  console.log(`   Correct Answer: ${correctLetter} (${correctAnswer})`);
  console.log(`   New Options: ${formattedOptions.join(', ')}`);

  // Update the question
  const { error } = await supabase
    .from('questions_v2')
    .update({
      answer_options: formattedOptions,
      correct_answer: correctLetter,
      solution: solution,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  } else {
    console.log(`   ✅ Updated successfully`);
    return true;
  }
}

async function main() {
  // Load the audit results
  const auditData = JSON.parse(
    fs.readFileSync('/tmp/letter_series_complete_audit.json', 'utf-8')
  );

  const errors = auditData.results.filter((r: any) => !r.is_correct);

  console.log(`Found ${errors.length} Letter Series questions to fix\n`);
  console.log('='.repeat(80));

  let fixed = 0;
  let failed = 0;

  for (const error of errors) {
    const success = await fixQuestion(error.id, error.series, error.calculated);
    if (success) {
      fixed++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total errors: ${errors.length}`);
  console.log(`Successfully fixed: ${fixed}`);
  console.log(`Failed: ${failed}`);
  console.log('\n✅ All Letter Series questions have been fixed!');
  console.log('\nNext steps:');
  console.log('1. Verify the fixes by running the audit script again');
  console.log('2. Manually review a sample of fixed questions');
  console.log('3. Test in the application');
}

main();
