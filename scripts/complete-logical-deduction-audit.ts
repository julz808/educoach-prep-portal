#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function extractLetters(optionText: string): string {
  return optionText.replace(/^[A-E]\)\s*/, '').trim();
}

interface LogicalDeductionQuestion {
  id: string;
  test_mode: string;
  question_order: number;
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  solution: string;
}

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Logical Deduction & Conditional Reasoning')
    .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .order('test_mode')
    .order('question_order');

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  console.log(`Auditing ${questions.length} Logical Deduction questions...\n`);
  console.log('Checking for:');
  console.log('1. Contradictory logic in solutions');
  console.log('2. Solutions that do not match the stored answer');
  console.log('3. Invalid logical reasoning');
  console.log('4. Missing justification\n');
  console.log('='.repeat(80));

  const suspiciousQuestions = [];
  const errorQuestions = [];

  for (const q of questions as LogicalDeductionQuestion[]) {
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

    // Flag 2: Solution doesn't conclude with "therefore"
    if (!solutionLower.includes('therefore')) {
      redFlags.push('Missing logical conclusion (no "therefore")');
    }

    // Flag 3: Check if solution explicitly states an answer
    const hasExplicitAnswer = solutionLower.includes('the answer is') ||
                               solutionLower.includes('the correct answer') ||
                               solutionLower.includes('therefore,');

    if (!hasExplicitAnswer) {
      redFlags.push('No explicit answer statement');
    }

    // Flag 4: Check if solution mentions the stored answer value
    // Extract key words from the stored value
    const answerWords = storedValue.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const mentionsAnswer = answerWords.some(word => solutionLower.includes(word));

    if (!mentionsAnswer && storedValue.length > 3) {
      redFlags.push(`Solution may not support answer "${storedValue}"`);
    }

    // Flag 5: Check for contradictory statements
    const hasContradiction = (solutionLower.includes('however') || solutionLower.includes('but')) &&
                              solutionLower.includes('cannot') &&
                              solutionLower.includes('therefore');

    if (hasContradiction) {
      redFlags.push('Possible contradictory reasoning');
    }

    // Flag 6: Check if solution discusses elimination
    const discussesElimination = solutionLower.includes('eliminate') ||
                                  solutionLower.includes('rule out') ||
                                  solutionLower.includes('cannot be');

    // Flag 7: Check if ALL premises are mentioned
    const hasPremises = solutionLower.includes('if') || solutionLower.includes('given') ||
                        solutionLower.includes('premise') || solutionLower.includes('statement');

    if (!hasPremises) {
      redFlags.push('Missing premise analysis');
    }

    // Flag 8: Solution mentions wrong option letter
    const wrongOptionPattern = new RegExp(`option [A-E](?!${q.correct_answer})`, 'i');
    const concludesWrongOption = wrongOptionPattern.test(solution) &&
                                  solution.toLowerCase().includes('correct');

    if (concludesWrongOption) {
      redFlags.push('CRITICAL: Solution may conclude with wrong option letter');
      errorQuestions.push({
        id: q.id,
        test_mode: q.test_mode,
        question_order: q.question_order,
        question_text: q.question_text,
        stored_answer: q.correct_answer,
        stored_value: storedValue,
        red_flags: redFlags,
        solution: q.solution,
        severity: 'HIGH'
      });
    }

    if (redFlags.length > 0) {
      console.log(`${concludesWrongOption ? '❌' : '⚠️'}  ${q.test_mode} Q${q.question_order}`);
      console.log(`   Question: ${q.question_text.substring(0, 100)}...`);
      console.log(`   Stored answer: ${q.correct_answer} (${storedValue})`);
      console.log(`   Red flags:`);
      redFlags.forEach(flag => console.log(`     - ${flag}`));
      console.log(`   ID: ${q.id}`);
      console.log('');

      if (!concludesWrongOption) {
        suspiciousQuestions.push({
          id: q.id,
          test_mode: q.test_mode,
          question_order: q.question_order,
          question_text: q.question_text,
          stored_answer: q.correct_answer,
          stored_value: storedValue,
          options: q.answer_options,
          red_flags: redFlags,
          solution: q.solution,
          severity: 'MEDIUM'
        });
      }
    } else {
      console.log(`✅ ${q.test_mode} Q${q.question_order}: ${q.correct_answer} (${storedValue.substring(0, 30)}...)`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('LOGICAL DEDUCTION AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions: ${questions.length}`);
  console.log(`Clean solutions: ${questions.length - suspiciousQuestions.length - errorQuestions.length}`);
  console.log(`Suspicious (medium risk): ${suspiciousQuestions.length}`);
  console.log(`Errors (high risk): ${errorQuestions.length}`);

  const allIssues = [...errorQuestions, ...suspiciousQuestions];

  if (allIssues.length > 0) {
    console.log('\n⚠️  RECOMMENDATION: Manual review required for flagged questions');
    fs.writeFileSync(
      '/tmp/logical_deduction_issues.json',
      JSON.stringify({
        summary: {
          total: questions.length,
          errors: errorQuestions.length,
          suspicious: suspiciousQuestions.length,
          clean: questions.length - allIssues.length
        },
        high_priority_errors: errorQuestions,
        suspicious_questions: suspiciousQuestions
      }, null, 2)
    );
    console.log('Issues saved to /tmp/logical_deduction_issues.json');
  } else {
    console.log('\n✅ No obvious issues detected in Logical Deduction questions');
  }

  // Save complete results
  fs.writeFileSync(
    '/tmp/logical_deduction_complete_audit.json',
    JSON.stringify({
      summary: {
        total: questions.length,
        errors: errorQuestions.length,
        suspicious: suspiciousQuestions.length
      },
      all_issues: allIssues
    }, null, 2)
  );
}

main();
