#!/usr/bin/env tsx

// Systematic verification of all letter series questions

interface LetterSeriesCheck {
  id: string;
  test_mode: string;
  q_num: number;
  series: string;
  stored_answer: string;
  calculated_answer: string;
  pattern_desc: string;
  is_correct: boolean;
  issue?: string;
}

const results: LetterSeriesCheck[] = [];

function letterToNum(letter: string): number {
  return letter.charCodeAt(0) - 64; // A=1, B=2, etc.
}

function numToLetter(num: number): string {
  while (num > 26) num -= 26;
  while (num < 1) num += 26;
  return String.fromCharCode(num + 64);
}

function verify(id: string, test_mode: string, q_num: number, series: string, stored: string, pattern: string) {
  const letters = series.split(' ').map(s => s.trim()).filter(s => s.length > 0);
  const positions = letters.map(letterToNum);
  const diffs = [];

  for (let i = 1; i < positions.length; i++) {
    diffs.push(positions[i] - positions[i-1]);
  }

  console.log(`\n${test_mode.toUpperCase()} Q${q_num}: ${series}`);
  console.log(`Positions: ${positions.join(', ')}`);
  console.log(`Differences: ${diffs.join(', ')}`);
  console.log(`Pattern: ${pattern}`);

  let calculated = '';
  let is_correct = true;
  let issue = '';

  // Determine next two letters based on pattern
  const lastPos = positions[positions.length - 1];

  // Check if constant increment
  if (diffs.every(d => d === diffs[0])) {
    const inc = diffs[0];
    const next1 = numToLetter(lastPos + inc);
    const next2 = numToLetter(lastPos + 2*inc);
    calculated = next1 + next2;
    console.log(`Constant increment ${inc}: Next = ${calculated}`);
  }
  // Check if incrementing increments (+3, +4, +5...)
  else if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] + 1)) {
    const nextInc = diffs[diffs.length - 1] + 1;
    const next1 = numToLetter(lastPos + nextInc);
    const next2 = numToLetter(lastPos + nextInc + nextInc + 1);
    calculated = next1 + next2;
    console.log(`Incrementing increments: Next = ${calculated}`);
  }
  // Check if doubling increments (+2, +4, +8...)
  else if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] * 2)) {
    const nextInc = diffs[diffs.length - 1] * 2;
    const next1 = numToLetter(lastPos + nextInc);
    const next2 = numToLetter(lastPos + nextInc + nextInc * 2);
    calculated = next1 + next2;
    console.log(`Doubling increments: Next = ${calculated}`);
  }
  // Check if decrementing increments (-3, -4, -5...)
  else if (diffs.length >= 2 && diffs.every((d, i) => i === 0 || d === diffs[i-1] - 1)) {
    const nextDec = diffs[diffs.length - 1] - 1;
    const next1 = numToLetter(lastPos + nextDec);
    const next2 = numToLetter(lastPos + nextDec + nextDec - 1);
    calculated = next1 + next2;
    console.log(`Decrementing increments: Next = ${calculated}`);
  }
  else {
    calculated = '???';
    console.log(`Unknown pattern!`);
  }

  if (calculated !== stored) {
    is_correct = false;
    issue = `Stored: ${stored}, Calculated: ${calculated}`;
    console.log(`❌ ERROR: ${issue}`);
  } else {
    console.log(`✅ CORRECT: ${stored}`);
  }

  results.push({
    id,
    test_mode,
    q_num,
    series,
    stored_answer: stored,
    calculated_answer: calculated,
    pattern_desc: pattern,
    is_correct,
    issue
  });
}

// PT1
verify('e139d69a-2534-4f14-a9f7-d6e4328b19e0', 'practice_1', 10, 'F I L O', 'RU', '+3 constant');
verify('cbc46cb1-9a72-4c37-9e99-ed1921ae5a35', 'practice_1', 16, 'D G K P', 'VB', '+3,+4,+5');
verify('8948bac4-0d50-4bf0-aa52-979b1b47b6f9', 'practice_1', 17, 'C F J O', 'UZ', '+3,+4,+5');
verify('49d11b3c-7c8e-4304-8eea-e4bc1aed9fc6', 'practice_1', 18, 'F H K O T', 'ZC', '+2,+3,+4,+5');
verify('364c4f9c-4949-423e-8dcc-e4801cbad917', 'practice_1', 20, 'B D F H', 'JL', '+2 constant');
verify('fb5a406b-c570-4002-bf45-8e90b59aa5f1', 'practice_1', 21, 'K N R W', 'AC', '+3,+4,+5');
verify('6f4dbe51-6d5b-48b4-a66d-f3a00b2b0031', 'practice_1', 45, 'E H L Q', 'WB', '+3,+4,+5');
verify('fb29d71c-520c-4dfd-8137-82bade363947', 'practice_1', 52, 'Z W S N', 'HC', '-3,-4,-5');
verify('46db469a-a5ee-47f5-8995-8a06732653d0', 'practice_1', 59, 'A C E G', 'IK', '+2 constant');

// PT2
verify('4c6e4798-bc2f-4e34-8453-e77742b783ea', 'practice_2', 3, 'M P S V', 'YB', '+3 constant');
verify('77ff5650-3395-4ee0-946d-887097f8533b', 'practice_2', 5, 'B D H N V', 'ZE', '+2,+4,+6,+8');
verify('a5ad2430-b4d4-4fba-b6e9-56ff9c6ad803', 'practice_2', 6, 'Z Y W T', 'PN', '-1,-2,-3');
verify('56fb9e17-6e16-4511-a11d-e7bac5b58be2', 'practice_2', 8, 'B C E H L', 'QV', '+1,+2,+3,+4');
verify('2f5d3374-a233-401e-b414-ae76f26dd05d', 'practice_2', 24, 'P M J G', 'DA', '-3 constant');
verify('f6420496-659c-4f0b-96e6-ef8a283ae432', 'practice_2', 26, 'N Q T W', 'ZC', '+3 constant');
verify('47874786-eaf5-4cb1-aec6-c1d89fd63810', 'practice_2', 28, 'Y V R M', 'HA', '-3,-4,-5');
verify('23180c3b-615a-42cc-88f2-64dcbb5c4c67', 'practice_2', 39, 'G I L P U', 'ZE', '+2,+3,+4,+5');
verify('59ff12af-7050-454d-866a-be2f14fbdc8a', 'practice_2', 40, 'G J M P', 'SV', '+3 constant');

console.log('\n\n' + '='.repeat(100));
console.log('SUMMARY');
console.log('='.repeat(100));

const errors = results.filter(r => !r.is_correct);
console.log(`\nTotal checked: ${results.length}`);
console.log(`Errors found: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(e => {
    console.log(`  ${e.test_mode} Q${e.q_num}: ${e.series} → ${e.issue}`);
  });
}
