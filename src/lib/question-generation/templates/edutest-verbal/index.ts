/**
 * EduTest Verbal Reasoning - Template Registry
 */

import type { QuestionTemplate } from '../../types';
import { synonymTemplate, synonymDifficultyGuidance } from './synonym';
import { antonymTemplate, antonymDifficultyGuidance } from './antonym';
import { analogyTemplate, analogyDifficultyGuidance } from './analogy';
import { foreignLanguageTemplate, foreignLanguageDifficultyGuidance } from './foreign-language';
import { logicalDeductionTemplate, logicalDeductionDifficultyGuidance } from './logical-deduction';

// Note: For initial testing, we're implementing 5 of the 8 question types
// TODO: Add remaining templates: odd-one-out, anagram, sequencing

export const edutestVerbalTemplates: Map<string, QuestionTemplate> = new Map([
  ['vocabulary-synonyms', synonymTemplate],
  ['vocabulary-antonyms', antonymTemplate],
  ['word-relationships-analogies', analogyTemplate],
  ['pattern-recognition-foreign-language', foreignLanguageTemplate],
  ['logical-reasoning-deduction', logicalDeductionTemplate]
]);

export const difficultyGuidanceMap: Map<string, Record<number, string>> = new Map([
  ['vocabulary-synonyms', synonymDifficultyGuidance],
  ['vocabulary-antonyms', antonymDifficultyGuidance],
  ['word-relationships-analogies', analogyDifficultyGuidance],
  ['pattern-recognition-foreign-language', foreignLanguageDifficultyGuidance],
  ['logical-reasoning-deduction', logicalDeductionDifficultyGuidance]
]);

/**
 * Get difficulty descriptor for prompts
 */
export function getDifficultyDescriptor(difficulty: number): string {
  const descriptors = {
    1: 'easy (Year 7 level)',
    2: 'medium (Year 8 level)',
    3: 'hard (Year 9 level)'
  };
  return descriptors[difficulty as keyof typeof descriptors] || 'medium';
}

/**
 * Get difficulty guidance for a specific sub-skill and difficulty level
 */
export function getDifficultyGuidance(subSkill: string, difficulty: number): string {
  const guidance = difficultyGuidanceMap.get(subSkill);
  if (!guidance) {
    return 'Use appropriate difficulty for the year level.';
  }
  return guidance[difficulty] || guidance[2]; // Default to medium if not found
}

/**
 * Format examples for prompt injection
 */
export function formatExamples(examples: QuestionTemplate['examples']): string {
  return examples.map((ex, idx) => {
    return `Example ${idx + 1}:
Question: "${ex.question_text}"
Options: ${ex.answer_options.join(', ')}
Correct Answer: ${ex.correct_answer}
Explanation: "${ex.explanation}"
`;
  }).join('\n');
}
