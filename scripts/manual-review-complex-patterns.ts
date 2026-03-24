#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get unverified pattern IDs from audit results
const unverifiedIds = [
  '380089c1-96ea-4f6d-a067-e4553e564631', // (243, 27) (512, 64) (729, ?) (1000, 100)
  'a9d431dc-5f8e-4e9d-a51c-b4660bc615be', // (28, 4) (63, 9) (?, 6) (99, 11)
  '0f80c81b-953c-4e82-8db3-1ad43ea4e393', // (12, 66) (15, 105) (18, 153) (?, 190)
  '60be4f4f-5e3d-4c36-aa3d-db04b16180b6', // (11, 143) (9, 99) (13, ?) (7, 63)
  'eb8fca06-5af5-4a90-b768-dc0b26709df7', // (3, 27) (5, 125) (2, 8) (4, ?)
  '431f54e2-05eb-4d6b-b86d-2c27236dcb14', // (30, 900) (20, 400) (?, 2500) (40, 1600)
  '61c49ee0-ec30-40a1-864e-1458df2e0499', // (6, 30) (8, 56) (12, 132) (?, 72)
  '8c6afa2e-8e77-4aca-aa4c-8e47c0e7ad39', // (9, 729) (5, 125) (11, ?) (4, 64)
  'c64fcace-332a-4826-9228-b23b525bcd22', // (7, 49) (11, 121) (?, 225) (13, 169)
  'f5022d49-35cd-4e7f-b381-1495ffa2a26e', // (14, 210) (9, 90) (16, 272) (?, 156)
  '5844f953-3302-4388-8ca3-33370fa30096', // (2, 32) (3, 243) (4, ?) (5, 3125)
  'cd2afe87-d5a5-4fe5-b091-cb7d4a97bdb1', // (7, 52) (11, 124) (9, ?) (5, 28)
  '81a7d304-5e49-44d2-a137-b84673f802f7', // (7, 343) (4, 64) (9, 729) (6, ?)
  'adcdb737-d9ad-4fab-8c7c-b5f9a9318dfd', // (10, 100) (6, 36) (?, 225) (9, 81)
  '07611525-7dae-47d8-ba95-6a551638e648', // (14, 196) (9, 81) (?, 225) (11, 121)
  'ddbe5796-7cb1-4866-bd81-5751860ef4c9', // (4, 16) (6, 36) (9, 81) (?, 121)
  '2c59a62c-50a0-4f81-b0c4-ac3c1dc529fb', // (5, 130) (8, 520) (3, 30) (6, ?)
  'fac8876d-d141-4916-9f9d-b0ce874abac9', // (4, 65) (7, 344) (9, 730) (6, ?)
];

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

async function main() {
  console.log('MANUAL REVIEW OF COMPLEX PATTERN RECOGNITION QUESTIONS');
  console.log('='.repeat(80));
  console.log(`Reviewing ${unverifiedIds.length} questions\n`);

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .in('id', unverifiedIds);

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const pairs = parsePairs(q.question_text);

    if (!pairs) {
      console.log(`Question ${i+1}: Could not parse pairs`);
      continue;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`QUESTION ${i+1} of ${questions.length}`);
    console.log(`${q.test_mode} Q${q.question_order}`);
    console.log(`='.repeat(80)}`);
    console.log(`Pairs: ${pairs.map(([a, b]) => `(${a ?? '?'}, ${b ?? '?'})`).join(' ')}`);

    const storedIndex = q.correct_answer.charCodeAt(0) - 65;
    const storedValue = storedIndex >= 0 && storedIndex < q.answer_options.length
      ? extractAnswer(q.answer_options[storedIndex])
      : NaN;

    console.log(`Stored Answer: ${q.correct_answer} = ${storedValue}`);
    console.log(`Options: ${q.answer_options.join(', ')}`);

    // Manual pattern analysis
    const known = pairs.filter(([a, b]) => a !== null && b !== null) as Array<[number, number]>;
    const missingPair = pairs.find(([a, b]) => a === null || b === null);

    console.log(`\nAnalyzing pattern:`);
    known.forEach(([a, b]) => {
      const patterns = [];
      if (Math.sqrt(a) === b) patterns.push(`sqrt(${a}) = ${b}`);
      if (Math.sqrt(b) === a) patterns.push(`sqrt(${b}) = ${a}`);
      if (Math.cbrt(a) === b) patterns.push(`cbrt(${a}) = ${b}`);
      if (Math.cbrt(b) === a) patterns.push(`cbrt(${b}) = ${a}`);
      if (a === b * b) patterns.push(`${b}² = ${a}`);
      if (b === a * a) patterns.push(`${a}² = ${b}`);
      if (a === b * b * b) patterns.push(`${b}³ = ${a}`);
      if (b === a * a * a) patterns.push(`${a}³ = ${b}`);
      if (a % b === 0) patterns.push(`${a} ÷ ${b} = ${a/b}`);
      if (b % a === 0) patterns.push(`${b} ÷ ${a} = ${b/a}`);
      if (a === b * (b + 1)) patterns.push(`${b} × ${b+1} = ${a}`);
      if (a === b * (b - 1)) patterns.push(`${b} × ${b-1} = ${a}`);

      console.log(`  (${a}, ${b}): ${patterns.length > 0 ? patterns.join(', ') : 'complex pattern'}`);
    });

    console.log(`\nMY CALCULATION:`);
    let calculated = null;
    let pattern = '';

    // Try to detect pattern and calculate
    // Check if all follow a² = b
    if (known.every(([a, b]) => a === b * b)) {
      pattern = 'a = b²';
      if (missingPair) {
        const [a, b] = missingPair;
        if (a === null && b !== null) calculated = b * b;
        if (b === null && a !== null) calculated = Math.sqrt(a);
      }
    }
    // Check if all follow a³ = b
    else if (known.every(([a, b]) => a === b * b * b)) {
      pattern = 'a = b³';
      if (missingPair) {
        const [a, b] = missingPair;
        if (a === null && b !== null) calculated = b * b * b;
        if (b === null && a !== null) calculated = Math.cbrt(a);
      }
    }
    // Check triangular: a = b(b-1)/2
    else if (known.every(([a, b]) => Math.abs(a - (b * (b - 1) / 2)) < 0.1)) {
      pattern = 'a = b × (b-1) / 2';
      if (missingPair) {
        const [a, b] = missingPair;
        if (a === null && b !== null) calculated = b * (b - 1) / 2;
        if (b === null && a !== null) {
          // Solve: x(x-1)/2 = a -> x² - x - 2a = 0
          const disc = 1 + 8 * a;
          calculated = Math.round((1 + Math.sqrt(disc)) / 2);
        }
      }
    }
    // Check a = b × (b+c) for various c
    else {
      for (let c = 1; c <= 20; c++) {
        if (known.every(([a, b]) => Math.abs(a - b * (b + c)) < 0.1)) {
          pattern = `a = b × (b+${c})`;
          if (missingPair) {
            const [a, b] = missingPair;
            if (a === null && b !== null) calculated = b * (b + c);
            if (b === null && a !== null) {
              const disc = c * c + 4 * a;
              calculated = Math.round((-c + Math.sqrt(disc)) / 2);
            }
          }
          break;
        }
      }
    }

    if (calculated !== null) {
      console.log(`Pattern: ${pattern}`);
      console.log(`Calculated: ${calculated}`);

      if (calculated !== storedValue) {
        errorCount++;
        console.log(`\n❌ ERROR FOUND!`);
        console.log(`   Expected: ${calculated}`);
        console.log(`   Stored: ${storedValue}`);
        console.log(`   ID: ${q.id}`);
        errors.push({
          id: q.id,
          test_mode: q.test_mode,
          question_order: q.question_order,
          pairs: pairs.map(([a, b]) => `(${a ?? '?'}, ${b ?? '?'})`).join(' '),
          pattern: pattern,
          calculated: calculated,
          stored: storedValue
        });
      } else {
        console.log(`✅ CORRECT`);
      }
    } else {
      console.log(`⚠️  Could not detect pattern - needs manual verification`);
      console.log(`   Stored answer: ${storedValue}`);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`MANUAL REVIEW SUMMARY`);
  console.log(`='.repeat(80)}`);
  console.log(`Questions Reviewed: ${questions.length}`);
  console.log(`Errors Found: ${errorCount}`);
  console.log(`Error Rate: ${((errorCount / questions.length) * 100).toFixed(1)}%`);

  if (errorCount > 0) {
    console.log(`\n❌ ERRORS DETECTED - Full review needed`);
    console.log(`\nError details:`);
    errors.forEach((e, i) => {
      console.log(`\n${i+1}. ${e.test_mode} Q${e.question_order}`);
      console.log(`   Pairs: ${e.pairs}`);
      console.log(`   Pattern: ${e.pattern}`);
      console.log(`   Calculated: ${e.calculated}, Stored: ${e.stored}`);
      console.log(`   ID: ${e.id}`);
    });
  } else {
    console.log(`\n✅ NO ERRORS FOUND - Can skip remaining complex patterns`);
  }
}

main();
