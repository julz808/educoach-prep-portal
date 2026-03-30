#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function letterToNum(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 64;
}

function numToLetter(num: number): string {
  while (num > 26) num -= 26;
  while (num < 1) num += 26;
  return String.fromCharCode(num + 64);
}

function extractLetters(optionText: string): string {
  return optionText.replace(/^[A-E]\)\s*/, '').trim();
}

function detectPattern(original: string, coded: string): number | null {
  if (original.length !== coded.length) return null;

  const shifts = [];
  for (let i = 0; i < original.length; i++) {
    const origNum = letterToNum(original[i]);
    const codedNum = letterToNum(coded[i]);
    let shift = codedNum - origNum;

    // Handle wrap-around
    if (shift > 13) shift -= 26;
    if (shift < -13) shift += 26;

    shifts.push(shift);
  }

  // Check if all shifts are the same (simple substitution cipher)
  if (shifts.every(s => s === shifts[0])) {
    return shifts[0];
  }

  return null;
}

function applyShift(word: string, shift: number): string {
  return word.split('').map(letter => {
    const num = letterToNum(letter);
    return numToLetter(num + shift);
  }).join('');
}

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Code & Symbol Substitution')
    .order('test_mode')
    .order('question_order');

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  console.log(`Auditing ${questions.length} Code & Symbol Substitution questions...\n`);

  const results = [];
  let totalErrors = 0;

  for (const q of questions) {
    // Parse the question to extract the pattern
    // Format: "If WORD1 is written as CODE1, how would WORD2 be written?"
    const match = q.question_text.match(/If\s+(\w+)\s+is\s+written\s+as\s+(\w+),\s+how\s+would\s+(\w+)\s+be\s+written/i);

    if (!match) {
      console.log(`⚠️  Cannot parse: ${q.test_mode} Q${q.question_order}`);
      console.log(`   Question: ${q.question_text.substring(0, 100)}...`);
      console.log('');
      continue;
    }

    const [_, original, coded, target] = match;

    // Detect the shift pattern
    const shift = detectPattern(original, coded);

    if (shift === null) {
      console.log(`⚠️  Complex pattern: ${q.test_mode} Q${q.question_order}`);
      console.log(`   ${original} → ${coded} (cannot detect simple shift)`);
      console.log('');
      continue;
    }

    // Apply the pattern to the target word
    const calculated = applyShift(target, shift);

    // Get stored answer
    const storedIndex = q.correct_answer.charCodeAt(0) - 65;
    let storedValue = '';
    if (storedIndex >= 0 && storedIndex < q.answer_options.length) {
      storedValue = extractLetters(q.answer_options[storedIndex]);
    }

    const isCorrect = calculated === storedValue;

    if (!isCorrect) {
      totalErrors++;
      console.log(`❌ ERROR #${totalErrors}: ${q.test_mode} Q${q.question_order}`);
      console.log(`   Pattern: ${original} → ${coded} (shift ${shift > 0 ? '+' : ''}${shift})`);
      console.log(`   Target: ${target}`);
      console.log(`   Stored: ${q.correct_answer} (${storedValue})`);
      console.log(`   Calculated: ${calculated}`);
      console.log(`   ID: ${q.id}`);
      console.log('');
    } else {
      console.log(`✅ ${q.test_mode} Q${q.question_order}: ${target} → ${calculated} (shift ${shift > 0 ? '+' : ''}${shift})`);
    }

    results.push({
      id: q.id,
      test_mode: q.test_mode,
      question_order: q.question_order,
      original,
      coded,
      target,
      shift,
      stored_answer: q.correct_answer,
      stored_value: storedValue,
      calculated,
      is_correct: isCorrect
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('CODE & SYMBOL SUBSTITUTION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions: ${results.length}`);
  console.log(`Correct: ${results.filter(r => r.is_correct).length}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Error rate: ${((totalErrors / results.length) * 100).toFixed(1)}%`);

  fs.writeFileSync(
    '/tmp/code_questions_audit.json',
    JSON.stringify({ summary: { total: results.length, errors: totalErrors }, results }, null, 2)
  );
  console.log('\nResults saved to /tmp/code_questions_audit.json');
}

main();
