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

function extractLetters(optionText: string): string {
  return optionText.replace(/^[A-E]\)\s*/, '').trim();
}

function calculateNext(positions: number[]): string | null {
  const diffs = [];
  for (let i = 1; i < positions.length; i++) {
    diffs.push(positions[i] - positions[i-1]);
  }

  const lastPos = positions[positions.length - 1];

  // Constant increment
  if (diffs.every(d => d === diffs[0])) {
    const inc = diffs[0];
    return numToLetter(lastPos + inc) + numToLetter(lastPos + 2*inc);
  }

  // Incrementing increments (+3,+4,+5... or +1,+2,+3...)
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] + 1)) {
    const nextInc = diffs[diffs.length - 1] + 1;
    const next2Inc = nextInc + 1;
    return numToLetter(lastPos + nextInc) + numToLetter(lastPos + nextInc + next2Inc);
  }

  // Decrementing increments (-3,-4,-5... or -1,-2,-3...)
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] - 1)) {
    const nextDec = diffs[diffs.length - 1] - 1;
    const next2Dec = nextDec - 1;
    return numToLetter(lastPos + nextDec) + numToLetter(lastPos + nextDec + next2Dec);
  }

  // Doubling (+2,+4,+8...)
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] * 2)) {
    const nextInc = diffs[diffs.length - 1] * 2;
    const next2Inc = nextInc * 2;
    return numToLetter(lastPos + nextInc) + numToLetter(lastPos + nextInc + next2Inc);
  }

  // Incrementing by 2 each time (+2, +4, +6, +8...)
  if (diffs.length >= 3 && diffs.every((d, i) => i === 0 || d === diffs[i-1] + 2)) {
    const nextInc = diffs[diffs.length - 1] + 2;
    const next2Inc = nextInc + 2;
    return numToLetter(lastPos + nextInc) + numToLetter(lastPos + nextInc + next2Inc);
  }

  // Alternating pattern (+3, -1, +3, -1...)
  if (diffs.length >= 4 &&
      diffs.filter((_, i) => i % 2 === 0).every(d => d === diffs[0]) &&
      diffs.filter((_, i) => i % 2 === 1).every(d => d === diffs[1])) {
    const inc1 = diffs[0];
    const inc2 = diffs[1];
    if (diffs.length % 2 === 0) {
      return numToLetter(lastPos + inc1) + numToLetter(lastPos + inc1 + inc2);
    } else {
      return numToLetter(lastPos + inc2) + numToLetter(lastPos + inc2 + inc1);
    }
  }

  return null;
}

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Letter Series & Patterns')
    .order('test_mode')
    .order('question_order');

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  const results = [];
  let totalErrors = 0;
  const byMode: any = {};

  console.log(`Auditing ALL ${questions.length} Letter Series questions...\n`);

  for (const q of questions) {
    const seriesMatch = q.question_text.match(/series\s+([\sA-Z]+)\s+are:/i);
    if (!seriesMatch) continue;

    const letters = seriesMatch[1].trim().split(/\s+/);
    const positions = letters.map(letterToNum);
    const calculated = calculateNext(positions);
    const storedAnswer = q.correct_answer;

    let storedValue = '';
    const storedIndex = storedAnswer.charCodeAt(0) - 65;
    if (storedIndex >= 0 && storedIndex < q.answer_options.length) {
      storedValue = extractLetters(q.answer_options[storedIndex]);
    }

    const isCorrect = calculated === storedValue || (calculated === null && storedValue.length > 0);

    if (!byMode[q.test_mode]) {
      byMode[q.test_mode] = { total: 0, correct: 0, errors: 0 };
    }
    byMode[q.test_mode].total++;

    if (!isCorrect) {
      totalErrors++;
      byMode[q.test_mode].errors++;
      console.log(`❌ ERROR #${totalErrors}: ${q.test_mode} Q${q.question_order}`);
      console.log(`   Series: ${letters.join(' ')}`);
      console.log(`   Stored: ${storedAnswer} (${storedValue})`);
      console.log(`   Calculated: ${calculated}`);
      console.log(`   ID: ${q.id}`);
      console.log('');
    } else {
      byMode[q.test_mode].correct++;
    }

    results.push({
      id: q.id,
      test_mode: q.test_mode,
      question_order: q.question_order,
      series: letters.join(' '),
      stored_answer: storedAnswer,
      stored_value: storedValue,
      calculated: calculated,
      is_correct: isCorrect
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('COMPLETE LETTER SERIES AUDIT - ALL TEST MODES');
  console.log('='.repeat(80));

  Object.keys(byMode).sort().forEach(mode => {
    const stats = byMode[mode];
    const pct = ((stats.correct / stats.total) * 100).toFixed(1);
    console.log(`${mode.padEnd(20)} ${stats.correct}/${stats.total} correct (${pct}%)`);
  });

  console.log('='.repeat(80));
  console.log(`TOTAL: ${results.length} questions`);
  console.log(`Correct: ${results.filter(r => r.is_correct).length}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Success rate: ${((1 - totalErrors / results.length) * 100).toFixed(1)}%`);

  fs.writeFileSync(
    '/tmp/all_letter_series_audit.json',
    JSON.stringify({ summary: { total: results.length, errors: totalErrors, by_mode: byMode }, results }, null, 2)
  );
  console.log('\nResults saved to /tmp/all_letter_series_audit.json');
}

main();
