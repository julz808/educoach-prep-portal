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
    .like('sub_skill', '%Grammar%')
    .order('test_mode')
    .order('question_order');

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  console.log(`Auditing ${questions.length} Grammar questions for quality issues...\n`);
  console.log('Checking for:');
  console.log('1. Solutions that contradict themselves');
  console.log('2. Solutions that do not match the stored answer');
  console.log('3. Missing or incomplete explanations');
  console.log('4. Circular reasoning\n');
  console.log('='.repeat(80));

  const suspiciousQuestions = [];

  for (const q of questions as any[]) {
    const storedIndex = q.correct_answer.charCodeAt(0) - 65;
    let storedValue = '';
    if (storedIndex >= 0 && storedIndex < q.answer_options.length) {
      storedValue = extractLetters(q.answer_options[storedIndex]);
    }

    const solution = q.solution;
    const solutionLower = solution.toLowerCase();
    const redFlags = [];

    // Flag 1: Solution is too short
    if (solution.length < 50) {
      redFlags.push('Solution too short/incomplete');
    }

    // Flag 2: Solution doesn't mention the correct answer option letter
    if (!solutionLower.includes(`option ${q.correct_answer.toLowerCase()}`) &&
        !solutionLower.includes(`answer is ${q.correct_answer.toLowerCase()}`)) {
      redFlags.push(`Solution may not clearly identify answer ${q.correct_answer}`);
    }

    // Flag 3: Check if solution has contradictory statements
    const hasContradiction = (solutionLower.includes('however') || solutionLower.includes('but')) &&
                              solutionLower.includes('incorrect') &&
                              solutionLower.includes('correct');

    if (hasContradiction && solution.split('•').length < 3) {
      redFlags.push('Possible contradictory reasoning');
    }

    // Flag 4: Solution is missing grammar explanation
    if (!solutionLower.includes('subject') &&
        !solutionLower.includes('verb') &&
        !solutionLower.includes('modifier') &&
        !solutionLower.includes('pronoun') &&
        !solutionLower.includes('agreement') &&
        !solutionLower.includes('tense')) {
      redFlags.push('Missing grammar explanation');
    }

    // Flag 5: Circular reasoning (just repeats the question)
    const questionWords = q.question_text.toLowerCase().split(' ').filter((w: string) => w.length > 4);
    const solutionWords = solutionLower.split(' ');
    const overlap = questionWords.filter((w: string) => solutionWords.includes(w)).length;
    if (overlap > questionWords.length * 0.7) {
      redFlags.push('Possible circular reasoning (too much overlap with question)');
    }

    if (redFlags.length > 0) {
      console.log(`⚠️  ${q.test_mode} Q${q.question_order}`);
      console.log(`   Question: ${q.question_text.substring(0, 80)}...`);
      console.log(`   Stored answer: ${q.correct_answer}`);
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
        red_flags: redFlags,
        solution: q.solution
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('GRAMMAR QUALITY SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions checked: ${questions.length}`);
  console.log(`Suspicious solutions found: ${suspiciousQuestions.length}`);
  console.log(`Clean solutions: ${questions.length - suspiciousQuestions.length}`);

  if (suspiciousQuestions.length > 0) {
    console.log('\n⚠️  RECOMMENDATION: Manually review flagged questions');
    console.log('Note: These are quality issues, not necessarily wrong answers');
    fs.writeFileSync(
      '/tmp/grammar_suspicious_solutions.json',
      JSON.stringify(suspiciousQuestions, null, 2)
    );
    console.log('Suspicious solutions saved to /tmp/grammar_suspicious_solutions.json');
  } else {
    console.log('\n✅ No obvious solution quality issues detected');
  }
}

main();
