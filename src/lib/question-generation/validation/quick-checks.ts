/**
 * Stage 1 Validation: Quick Checks (Instant)
 * Catches 80% of errors with zero API cost
 */

import type { Question, ValidationResult } from '../types';

/**
 * Top 10 hallucination patterns that matter most
 * Based on analysis of actual LLM hallucinations
 */
const HALLUCINATION_PATTERNS = [
  'let me recalculate',
  'wait, i think',
  'actually',
  'my mistake',
  'oops',
  'i apologize',
  'let me correct',
  'upon reflection',
  'i was wrong',
  'to clarify'
];

/**
 * Perform instant validation checks on generated question
 * Time: <0.1 seconds | Cost: $0
 */
export function quickValidation(question: Question): ValidationResult {
  const errors: string[] = [];

  // 1. Has all required fields?
  if (!question.question_text || question.question_text.trim() === '') {
    errors.push('Missing question_text');
  }

  if (!question.answer_options || question.answer_options.length === 0) {
    errors.push('Missing answer_options');
  }

  if (!question.correct_answer || question.correct_answer.trim() === '') {
    errors.push('Missing correct_answer');
  }

  if (!question.solution || question.solution.trim() === '') {
    errors.push('Missing solution (explanation)');
  }

  // 2. Correct number of options (5 for EduTest Verbal)
  if (question.answer_options && question.answer_options.length !== 5) {
    errors.push(`Wrong number of options: expected 5, got ${question.answer_options.length}`);
  }

  // 3. Correct answer matches one of the options?
  if (question.answer_options && question.correct_answer) {
    // For logical deduction questions, correct_answer might be "2 & 4" format
    const isLogicalDeduction = question.correct_answer.includes('&');

    if (!isLogicalDeduction && !question.answer_options.includes(question.correct_answer)) {
      errors.push(`Correct answer "${question.correct_answer}" not found in options: ${question.answer_options.join(', ')}`);
    } else if (isLogicalDeduction && !question.answer_options.includes(question.correct_answer)) {
      errors.push(`Correct answer pair "${question.correct_answer}" not found in options`);
    }
  }

  // 4. No duplicate options?
  if (question.answer_options) {
    const uniqueOptions = new Set(question.answer_options);
    if (uniqueOptions.size !== question.answer_options.length) {
      errors.push('Duplicate options detected');
    }
  }

  // 5. No empty options?
  if (question.answer_options) {
    const emptyOptions = question.answer_options.filter(opt => !opt || opt.trim() === '');
    if (emptyOptions.length > 0) {
      errors.push(`Found ${emptyOptions.length} empty options`);
    }
  }

  // 6. Hallucination detection (top 10 patterns)
  const combinedText = (
    question.question_text + ' ' +
    question.solution + ' ' +
    question.answer_options.join(' ')
  ).toLowerCase();

  for (const pattern of HALLUCINATION_PATTERNS) {
    if (combinedText.includes(pattern)) {
      errors.push(`Hallucination detected: contains phrase "${pattern}"`);
    }
  }

  // 7. Explanation too long? (should be 1-2 sentences, max ~200 chars)
  if (question.solution && question.solution.length > 300) {
    errors.push(`Explanation too long (${question.solution.length} chars). Should be 1-2 sentences max.`);
  }

  // 8. Question text seems incomplete?
  if (question.question_text && question.question_text.length < 10) {
    errors.push('Question text suspiciously short (< 10 characters)');
  }

  // 9. Options seem too similar (all same length, all start with same letter)?
  if (question.answer_options && question.answer_options.length === 5) {
    const allSameLength = question.answer_options.every(
      opt => opt.length === question.answer_options[0].length
    );
    if (allSameLength && question.answer_options[0].length > 0) {
      // This is OK for some question types (e.g., made-up words), so just warn
      // Not adding to errors for now
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if question contains obvious formatting issues
 */
export function checkFormatting(question: Question): ValidationResult {
  const errors: string[] = [];

  // Check for common formatting issues
  if (question.question_text.includes('```')) {
    errors.push('Question contains code block markers (```)');
  }

  if (question.question_text.includes('[') && question.question_text.includes(']')) {
    // Check if placeholders weren't replaced
    const placeholderPattern = /\{[A-Z_]+\}/;
    if (placeholderPattern.test(question.question_text)) {
      errors.push('Question contains unreplaced placeholders like {PLACEHOLDER}');
    }
  }

  // Check for American spelling in common words (should be UK/Australian)
  const americanSpellings = [
    { american: 'color', british: 'colour' },
    { american: 'center', british: 'centre' },
    { american: 'honor', british: 'honour' },
    { american: 'favorite', british: 'favourite' }
  ];

  const allText = (question.question_text + ' ' + question.solution).toLowerCase();
  for (const { american, british } of americanSpellings) {
    // Match whole words only
    const regex = new RegExp(`\\b${american}\\b`, 'i');
    if (regex.test(allText)) {
      errors.push(`American spelling detected: "${american}" (should be "${british}")`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Combined quick validation (runs all instant checks)
 */
export function runAllQuickChecks(question: Question): ValidationResult {
  const structuralCheck = quickValidation(question);
  const formattingCheck = checkFormatting(question);

  const allErrors = [...structuralCheck.errors, ...formattingCheck.errors];

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}
