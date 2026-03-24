#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function extractAnswer(optionText: string): number {
  const match = optionText.match(/^[A-E]\)\s*(\d+)/);
  return match ? parseInt(match[1]) : NaN;
}

function parsePairs(questionText: string): Array<[number | null, number | null]> | null {
  const pairMatches = questionText.matchAll(/\((\d+|\?),\s*(\d+|\?)\)/g);
  const pairs: Array<[number | null, number | null]> = [];

  for (const match of pairMatches) {
    const first = match[1] === '?' ? null : parseInt(match[1]);
    const second = match[2] === '?' ? null : parseInt(match[2]);
    pairs.push([first, second]);
  }

  return pairs.length >= 3 ? pairs : null;
}

function detectRelationship(pairs: Array<[number | null, number | null]>): { type: string; value: number } | null {
  const knownPairs = pairs.filter(([a, b]) => a !== null && b !== null) as Array<[number, number]>;

  if (knownPairs.length < 2) return null;

  // Check a^2 = b
  if (knownPairs.every(([a, b]) => Math.abs(Math.pow(a, 2) - b) < 0.01)) {
    return { type: 'square_forward', value: 2 };
  }

  // Check b^2 = a
  if (knownPairs.every(([a, b]) => Math.abs(Math.pow(b, 2) - a) < 0.01)) {
    return { type: 'square_reverse', value: 2 };
  }

  // Check a^3 = b
  if (knownPairs.every(([a, b]) => Math.abs(Math.pow(a, 3) - b) < 0.01)) {
    return { type: 'cube_forward', value: 3 };
  }

  // Check b^3 = a
  if (knownPairs.every(([a, b]) => Math.abs(Math.pow(b, 3) - a) < 0.01)) {
    return { type: 'cube_reverse', value: 3 };
  }

  // Check a × (a+1) = b
  if (knownPairs.every(([a, b]) => Math.abs(a * (a + 1) - b) < 0.01)) {
    return { type: 'multiply_successor', value: 1 };
  }

  // Check a × (a-1) = b
  if (knownPairs.every(([a, b]) => Math.abs(a * (a - 1) - b) < 0.01)) {
    return { type: 'multiply_predecessor', value: 1 };
  }

  // Check b × (b+const) = a
  for (let c = 2; c <= 20; c++) {
    if (knownPairs.every(([a, b]) => Math.abs(b * (b + c) - a) < 0.01)) {
      return { type: 'b_times_b_plus_c', value: c };
    }
  }

  // Check multiplication
  const multipliers = knownPairs.map(([a, b]) => a / b);
  if (multipliers.every(m => Math.abs(m - multipliers[0]) < 0.01)) {
    return { type: 'multiply', value: multipliers[0] };
  }

  // Check division (reverse)
  const divisors = knownPairs.map(([a, b]) => b);
  const quotients = knownPairs.map(([a, b]) => a / b);
  if (quotients.every(q => Math.abs(q - quotients[0]) < 0.01)) {
    return { type: 'divide', value: quotients[0] };
  }

  // Check addition/subtraction
  const diffs = knownPairs.map(([a, b]) => a - b);
  if (diffs.every(d => d === diffs[0])) {
    return { type: 'subtract', value: diffs[0] };
  }

  // Check power relationship (b^x = a)
  for (let power = 2; power <= 5; power++) {
    if (knownPairs.every(([a, b]) => Math.abs(Math.pow(b, power) - a) < 0.01)) {
      return { type: 'power', value: power };
    }
  }

  // Check cube root (a = b^3)
  if (knownPairs.every(([a, b]) => Math.abs(Math.cbrt(a) - b) < 0.01)) {
    return { type: 'cube_root', value: 3 };
  }

  // Check square root relationships: sqrt(a) = b or a = b×sqrt(b)
  if (knownPairs.every(([a, b]) => Math.abs(Math.sqrt(a) - b) < 0.01)) {
    return { type: 'sqrt_forward', value: 0.5 };
  }

  // Check a + 1 = b (off-by-one in stored answer)
  if (knownPairs.every(([a, b]) => a + 1 === b)) {
    return { type: 'add_one', value: 1 };
  }

  return null;
}

function calculateMissing(pairs: Array<[number | null, number | null]>, relationship: { type: string; value: number }): number | null {
  const missingPair = pairs.find(([a, b]) => a === null || b === null);
  if (!missingPair) return null;

  const [a, b] = missingPair;

  if (relationship.type === 'square_forward') {
    // a^2 = b
    if (a === null && b !== null) return Math.round(Math.sqrt(b));
    if (b === null && a !== null) return Math.round(Math.pow(a, 2));
  }

  if (relationship.type === 'square_reverse') {
    // b^2 = a
    if (a === null && b !== null) return Math.round(Math.pow(b, 2));
    if (b === null && a !== null) return Math.round(Math.sqrt(a));
  }

  if (relationship.type === 'cube_forward') {
    // a^3 = b
    if (a === null && b !== null) return Math.round(Math.cbrt(b));
    if (b === null && a !== null) return Math.round(Math.pow(a, 3));
  }

  if (relationship.type === 'cube_reverse') {
    // b^3 = a
    if (a === null && b !== null) return Math.round(Math.pow(b, 3));
    if (b === null && a !== null) return Math.round(Math.cbrt(a));
  }

  if (relationship.type === 'multiply_successor') {
    // a × (a+1) = b
    if (b === null && a !== null) return Math.round(a * (a + 1));
    if (a === null && b !== null) {
      // Solve: x(x+1) = b → x^2 + x - b = 0
      const discriminant = 1 + 4 * b;
      return Math.round((-1 + Math.sqrt(discriminant)) / 2);
    }
  }

  if (relationship.type === 'multiply_predecessor') {
    // a × (a-1) = b
    if (b === null && a !== null) return Math.round(a * (a - 1));
    if (a === null && b !== null) {
      // Solve: x(x-1) = b → x^2 - x - b = 0
      const discriminant = 1 + 4 * b;
      return Math.round((1 + Math.sqrt(discriminant)) / 2);
    }
  }

  if (relationship.type === 'b_times_b_plus_c') {
    // b × (b+c) = a
    const c = relationship.value;
    if (a === null && b !== null) return Math.round(b * (b + c));
    if (b === null && a !== null) {
      // Solve: x(x+c) = a → x^2 + cx - a = 0
      const discriminant = c * c + 4 * a;
      return Math.round((-c + Math.sqrt(discriminant)) / 2);
    }
  }

  if (relationship.type === 'multiply') {
    if (a === null && b !== null) return Math.round(b * relationship.value);
    if (b === null && a !== null) return Math.round(a / relationship.value);
  }

  if (relationship.type === 'divide') {
    if (a === null && b !== null) return Math.round(b * relationship.value);
    if (b === null && a !== null) return Math.round(a / relationship.value);
  }

  if (relationship.type === 'subtract') {
    if (a === null && b !== null) return b + relationship.value;
    if (b === null && a !== null) return a - relationship.value;
  }

  if (relationship.type === 'power') {
    if (a === null && b !== null) return Math.round(Math.pow(b, relationship.value));
    if (b === null && a !== null) return Math.round(Math.pow(a, 1 / relationship.value));
  }

  if (relationship.type === 'cube_root') {
    if (a === null && b !== null) return Math.round(Math.pow(b, 3));
    if (b === null && a !== null) return Math.round(Math.cbrt(a));
  }

  if (relationship.type === 'sqrt_forward') {
    // sqrt(a) = b
    if (a === null && b !== null) return Math.round(Math.pow(b, 2));
    if (b === null && a !== null) return Math.round(Math.sqrt(a));
  }

  if (relationship.type === 'add_one') {
    if (a === null && b !== null) return b - 1;
    if (b === null && a !== null) return a + 1;
  }

  return null;
}

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Pattern Recognition in Paired Numbers')
    .order('test_mode')
    .order('question_order');

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  console.log(`Auditing ${questions.length} Pattern Recognition questions...\n`);

  const results = [];
  let totalErrors = 0;
  let cannotParse = 0;

  for (const q of questions) {
    const pairs = parsePairs(q.question_text);

    if (!pairs) {
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

    const relationship = detectRelationship(pairs);
    if (!relationship) {
      cannotParse++;
      console.log(`⚠️  CANNOT DETECT PATTERN: ${q.test_mode} Q${q.question_order}`);
      console.log(`   Pairs: ${pairs.map(([a, b]) => `(${a ?? '?'}, ${b ?? '?'})`).join(' ')}`);
      console.log(`   ID: ${q.id}`);
      console.log('');

      results.push({
        id: q.id,
        test_mode: q.test_mode,
        question_order: q.question_order,
        pairs: pairs.map(([a, b]) => `(${a ?? '?'}, ${b ?? '?'})`).join(' '),
        parsed: true,
        pattern_detected: false,
        is_correct: null
      });
      continue;
    }

    const calculated = calculateMissing(pairs, relationship);
    const storedAnswer = q.correct_answer;

    let storedValue = NaN;
    const storedIndex = storedAnswer.charCodeAt(0) - 65;
    if (storedIndex >= 0 && storedIndex < q.answer_options.length) {
      storedValue = extractAnswer(q.answer_options[storedIndex]);
    }

    const isCorrect = calculated === storedValue;

    if (!isCorrect) {
      totalErrors++;
      console.log(`❌ ERROR #${totalErrors}: ${q.test_mode} Q${q.question_order}`);
      console.log(`   Pairs: ${pairs.map(([a, b]) => `(${a ?? '?'}, ${b ?? '?'})`).join(' ')}`);
      console.log(`   Relationship: ${relationship.type} (${relationship.value})`);
      console.log(`   Stored: ${storedAnswer} (${storedValue})`);
      console.log(`   Calculated: ${calculated}`);
      console.log(`   ID: ${q.id}`);
      console.log('');
    } else {
      console.log(`✅ ${q.test_mode} Q${q.question_order}: ${relationship.type} → ${calculated}`);
    }

    results.push({
      id: q.id,
      test_mode: q.test_mode,
      question_order: q.question_order,
      pairs: pairs.map(([a, b]) => `(${a ?? '?'}, ${b ?? '?'})`).join(' '),
      relationship: relationship.type,
      relationship_value: relationship.value,
      stored_answer: storedAnswer,
      stored_value: storedValue,
      calculated: calculated,
      is_correct: isCorrect,
      parsed: true,
      pattern_detected: true
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('PATTERN RECOGNITION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions: ${results.length}`);
  console.log(`Successfully parsed: ${results.filter(r => r.parsed && r.pattern_detected).length}`);
  console.log(`Could not parse/detect: ${cannotParse}`);
  console.log(`Correct: ${results.filter(r => r.is_correct).length}`);
  console.log(`Errors: ${totalErrors}`);
  if (results.filter(r => r.parsed && r.pattern_detected).length > 0) {
    console.log(`Error rate: ${((totalErrors / results.filter(r => r.parsed && r.pattern_detected).length) * 100).toFixed(1)}%`);
  }

  fs.writeFileSync(
    '/tmp/pattern_recognition_audit.json',
    JSON.stringify({ summary: { total: results.length, errors: totalErrors, cannot_parse: cannotParse }, results }, null, 2)
  );
  console.log('\nResults saved to /tmp/pattern_recognition_audit.json');
}

main();
