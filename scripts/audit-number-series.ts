#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function extractAnswer(optionText: string): string {
  return optionText.replace(/^[A-E]\)\s*/, '').trim();
}

function parseNumberSeries(questionText: string): { numbers: number[]; missingIndex: number } | null {
  // Extract all numbers and question marks
  const parts = questionText.split(/\s+/).filter(s => s.trim());

  const numbers: number[] = [];
  let missingIndex = -1;
  let currentIndex = 0;

  for (const part of parts) {
    const cleaned = part.replace(/[,\.\:]/g, '');
    if (cleaned === '?') {
      missingIndex = currentIndex;
      numbers.push(NaN); // placeholder
      currentIndex++;
    } else {
      const num = parseInt(cleaned);
      if (!isNaN(num) && num >= 0) {
        numbers.push(num);
        currentIndex++;
      }
    }
  }

  if (numbers.length >= 4 && missingIndex >= 0) {
    return { numbers, missingIndex };
  }

  return null;
}

function calculateNextNumber(numbers: number[]): number | null {
  if (numbers.length < 3) return null;

  const diffs = [];
  for (let i = 1; i < numbers.length; i++) {
    diffs.push(numbers[i] - numbers[i-1]);
  }

  const lastNum = numbers[numbers.length - 1];

  // Constant difference
  if (diffs.every(d => d === diffs[0])) {
    return lastNum + diffs[0];
  }

  // Incrementing differences
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] + 1)) {
    return lastNum + diffs[diffs.length - 1] + 1;
  }

  // Decrementing differences
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] - 1)) {
    return lastNum + diffs[diffs.length - 1] - 1;
  }

  // Doubling
  if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] * 2)) {
    return lastNum + diffs[diffs.length - 1] * 2;
  }

  // Incrementing by constant amount (e.g., +2, +4, +6, +8)
  if (diffs.length >= 3) {
    const secondDiffs = [];
    for (let i = 1; i < diffs.length; i++) {
      secondDiffs.push(diffs[i] - diffs[i-1]);
    }
    if (secondDiffs.every(d => d === secondDiffs[0])) {
      return lastNum + diffs[diffs.length - 1] + secondDiffs[0];
    }
  }

  // Multiplying pattern
  if (numbers.length >= 3) {
    const ratios = [];
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i-1] !== 0) {
        ratios.push(numbers[i] / numbers[i-1]);
      }
    }
    if (ratios.length >= 2 && ratios.every(r => Math.abs(r - ratios[0]) < 0.01)) {
      return Math.round(lastNum * ratios[0]);
    }
  }

  return null;
}

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Number Series & Sequences')
    .order('test_mode')
    .order('question_order');

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  console.log(`Auditing ${questions.length} Number Series questions...\n`);

  const results = [];
  let totalErrors = 0;
  let cannotParse = 0;

  for (const q of questions) {
    const numbers = parseNumberSeries(q.question_text);

    if (!numbers) {
      cannotParse++;
      console.log(`⚠️  CANNOT PARSE: ${q.test_mode} Q${q.question_order}`);
      console.log(`   Question: ${q.question_text.substring(0, 100)}...`);
      console.log(`   ID: ${q.id}`);
      console.log('');

      results.push({
        id: q.id,
        test_mode: q.test_mode,
        question_order: q.question_order,
        parsed: false,
        is_correct: null
      });
      continue;
    }

    const calculated = calculateNextNumber(numbers);
    const storedAnswer = q.correct_answer;

    let storedValue = '';
    const storedIndex = storedAnswer.charCodeAt(0) - 65;
    if (storedIndex >= 0 && storedIndex < q.answer_options.length) {
      storedValue = extractAnswer(q.answer_options[storedIndex]);
    }

    const storedNum = parseInt(storedValue);
    const isCorrect = calculated === storedNum;

    if (!isCorrect) {
      totalErrors++;
      console.log(`❌ ERROR #${totalErrors}: ${q.test_mode} Q${q.question_order}`);
      console.log(`   Series: ${numbers.join(', ')}`);
      console.log(`   Stored: ${storedAnswer} (${storedValue})`);
      console.log(`   Calculated: ${calculated}`);
      console.log(`   ID: ${q.id}`);
      console.log('');
    } else {
      console.log(`✅ ${q.test_mode} Q${q.question_order}: ${numbers.join(', ')} → ${calculated}`);
    }

    results.push({
      id: q.id,
      test_mode: q.test_mode,
      question_order: q.question_order,
      series: numbers.join(', '),
      stored_answer: storedAnswer,
      stored_value: storedValue,
      calculated: calculated,
      is_correct: isCorrect,
      parsed: true
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('NUMBER SERIES SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions: ${results.length}`);
  console.log(`Successfully parsed: ${results.filter(r => r.parsed).length}`);
  console.log(`Could not parse: ${cannotParse}`);
  console.log(`Correct: ${results.filter(r => r.is_correct).length}`);
  console.log(`Errors: ${totalErrors}`);
  if (results.filter(r => r.parsed).length > 0) {
    console.log(`Error rate: ${((totalErrors / results.filter(r => r.parsed).length) * 100).toFixed(1)}%`);
  }

  fs.writeFileSync(
    '/tmp/number_series_audit.json',
    JSON.stringify({ summary: { total: results.length, errors: totalErrors, cannot_parse: cannotParse }, results }, null, 2)
  );
  console.log('\nResults saved to /tmp/number_series_audit.json');
}

main();
