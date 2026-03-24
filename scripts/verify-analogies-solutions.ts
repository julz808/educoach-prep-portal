#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function extractLetters(optionText: string): string {
  return optionText.replace(/^[A-E]\)\s*/, '').trim();
}

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Analogies - Word Relationships')
    .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .order('test_mode')
    .order('question_order');

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  console.log(`Verifying ${questions.length} Analogies questions for logical consistency...\n`);
  console.log('Checking for:');
  console.log('1. Solutions that contradict themselves');
  console.log('2. Solutions that justify the wrong option');
  console.log('3. Missing or incomplete explanations');
  console.log('4. Circular reasoning\n');
  console.log('='.repeat(80));

  const suspiciousQuestions = [];

  for (const q of questions as any) {
    const storedIndex = q.correct_answer.charCodeAt(0) - 65;
    let storedValue = '';
    if (storedIndex >= 0 && storedIndex < q.answer_options.length) {
      storedValue = extractLetters(q.answer_options[storedIndex]);
    }

    // Check for red flags in the solution
    const solution = q.solution.toLowerCase();
    const redFlags = [];

    // Flag 1: Solution is too short (likely incomplete)
    if (solution.length < 50) {
      redFlags.push('Solution too short/incomplete');
    }

    // Flag 2: Solution doesn't mention the correct answer
    const answerWord = storedValue.toLowerCase();
    if (!solution.includes(answerWord)) {
      redFlags.push(`Solution doesn't mention correct answer "${storedValue}"`);
    }

    // Flag 3: Solution mentions multiple different answer options favorably
    const optionWords = q.answer_options.map((opt: string) => extractLetters(opt).toLowerCase());
    const mentionedOptions = optionWords.filter((opt: string) =>
      solution.includes(opt) && opt.length > 3 // Ignore short words to avoid false positives
    );
    if (mentionedOptions.length > 3) {
      redFlags.push('Solution discusses too many options (confused logic)');
    }

    // Flag 4: Check if solution has contradictory statements
    if (solution.includes('however') && solution.includes('therefore') && solution.includes('but')) {
      redFlags.push('Possible contradictory reasoning');
    }

    // Flag 5: Solution is missing relationship explanation
    if (!solution.includes('relationship') && !solution.includes('similar') &&
        !solution.includes('analogy') && !solution.includes('same')) {
      redFlags.push('Missing relationship explanation');
    }

    if (redFlags.length > 0) {
      console.log(`⚠️  ${q.test_mode} Q${q.question_order}`);
      console.log(`   Question: ${q.question_text.substring(0, 80)}...`);
      console.log(`   Stored answer: ${q.correct_answer} (${storedValue})`);
      console.log(`   Red flags:`);
      redFlags.forEach(flag => console.log(`     - ${flag}`));
      console.log(`   ID: ${q.id}`);
      console.log('');

      suspiciousQuestions.push({
        id: q.id,
        test_mode: q.test_mode,
        question_order: q.question_order,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        correct_value: storedValue,
        red_flags: redFlags,
        solution: q.solution
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SOLUTION QUALITY SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions checked: ${questions.length}`);
  console.log(`Suspicious solutions found: ${suspiciousQuestions.length}`);
  console.log(`Clean solutions: ${questions.length - suspiciousQuestions.length}`);

  if (suspiciousQuestions.length > 0) {
    console.log('\n⚠️  RECOMMENDATION: Manually review all flagged questions');
    fs.writeFileSync(
      '/tmp/analogies_suspicious_solutions.json',
      JSON.stringify(suspiciousQuestions, null, 2)
    );
    console.log('Suspicious solutions saved to /tmp/analogies_suspicious_solutions.json');
  } else {
    console.log('\n✅ No obvious solution quality issues detected');
    console.log('Note: This does not guarantee semantic correctness');
  }
}

main();
