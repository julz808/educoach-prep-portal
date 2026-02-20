/**
 * EduTest Verbal Reasoning - Antonym Question Template
 */

import type { QuestionTemplate } from '../../types';

export const antonymTemplate: QuestionTemplate = {
  type: 'antonym',
  needsVerification: true,

  examples: [
    {
      question_text: 'Which of the following words is opposite in meaning to INSUFFICIENT?',
      answer_options: ['scarce', 'adequate', 'lacking', 'hopeless', 'subjective'],
      correct_answer: 'adequate',
      explanation: "'Insufficient' means not enough, therefore the opposite is 'adequate' which means enough or satisfactory."
    }
  ],

  requirements: [
    'Exactly ONE correct answer (clear antonym)',
    'Distractors include synonyms (to catch students who misread "opposite")',
    'Explanation format: "\'[Word]\' means [meaning], therefore the opposite is \'[antonym]\'."',
    'UK/Australian spelling',
    '1-2 sentence explanation maximum'
  ],

  prompt: `You are generating an EduTest Verbal Reasoning antonym question.

QUESTION FORMAT (use this EXACT format):
"Which of the following words is opposite in meaning to [TARGET_WORD]?"

YOUR TASK:
1. Choose a {DIFFICULTY_DESCRIPTOR} difficulty word appropriate for Year {YEAR_LEVEL}
2. Find ONE clear antonym as the correct answer
3. Create 4 wrong options:
   - Two synonyms of the target word (common trap - students who misread "opposite")
   - One unrelated word
   - One word from wrong category

CRITICAL RULES (if you violate these, the question will be REJECTED):
✓ ONLY ONE option can be correct - must be true opposite
✓ Include synonyms as distractors (tests careful reading of "opposite")
✓ Explanation format: "'[Word]' means [meaning], therefore the opposite is '[antonym]'."
✓ Use UK/Australian spelling
✓ Keep explanation to 1-2 sentences maximum
✓ Options must be in alphabetical order

DIFFICULTY GUIDELINES:
{DIFFICULTY_GUIDANCE}

REAL EXAMPLES FROM EDUTEST TESTS:
{EXAMPLES}

DIVERSITY REQUIREMENTS:
{DIVERSITY_GUIDANCE}

OUTPUT FORMAT (valid JSON only):
{
  "question_text": "Which of the following words is opposite in meaning to [WORD]?",
  "answer_options": ["option1", "option2", "option3", "option4", "option5"],
  "correct_answer": "option2",
  "solution": "'[Word]' means [meaning], therefore the opposite is '[antonym]'."
}

Generate the question now as valid JSON:`
};

export const antonymDifficultyGuidance = {
  1: `Year 7 (Easy): Use common word pairs with clear opposites
Examples: happy/sad, big/small, hot/cold, fast/slow
AVOID: words without clear opposites or nuanced meanings`,

  2: `Year 8 (Medium): Use more sophisticated vocabulary with clear opposites
Examples: increase/decrease, expand/contract, advance/retreat
Can use: less common words but opposites should still be clear`,

  3: `Year 9 (Hard): Use academic vocabulary, may include nuanced opposites
Examples: insufficient/adequate, abundant/scarce, strengthen/weaken
Can use: formal language, abstract concepts`
};
