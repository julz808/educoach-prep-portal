/**
 * EduTest Verbal Reasoning - Synonym Question Template
 * Based on analysis of 60 actual EduTest questions
 */

import type { QuestionTemplate } from '../../types';

export const synonymTemplate: QuestionTemplate = {
  type: 'synonym',
  needsVerification: true, // Vocabulary is objective

  examples: [
    {
      question_text: 'Which of the following words is similar to REPAIR?',
      answer_options: ['broken', 'mend', 'detach', 'remove', 'smash'],
      correct_answer: 'mend',
      explanation: "Both 'repair' and 'mend' mean to fix something that is broken."
    },
    {
      question_text: 'Which of the following words is similar to CHANGE?',
      answer_options: ['keep', 'alter', 'remain', 'stay', 'new'],
      correct_answer: 'alter',
      explanation: "Both 'change' and 'alter' mean to make something different."
    },
    {
      question_text: 'Which of the following words is similar to DOCUMENT?',
      answer_options: ['book', 'record', 'literature', 'words', 'documentary'],
      correct_answer: 'record',
      explanation: "Both 'document' and 'record' mean a written account of information."
    }
  ],

  requirements: [
    'Exactly ONE correct answer (clear synonym)',
    'All distractors definitively wrong',
    'Explanation format: "Both \'[word1]\' and \'[word2]\' mean [definition]."',
    'UK/Australian spelling (colour, centre, etc.)',
    '1-2 sentence explanation maximum'
  ],

  prompt: `You are generating an EduTest Verbal Reasoning synonym question.

QUESTION FORMAT (use this EXACT format):
"Which of the following words is similar to [TARGET_WORD]?"

YOUR TASK:
1. Choose a {DIFFICULTY_DESCRIPTOR} difficulty word appropriate for Year {YEAR_LEVEL}
2. Find ONE clear synonym as the correct answer
3. Create 4 wrong options:
   - One antonym (opposite meaning)
   - One related word (same semantic field, but NOT a synonym)
   - Two unrelated words

CRITICAL RULES (if you violate these, the question will be REJECTED):
✓ ONLY ONE option can be correct - no ambiguity whatsoever
✓ Each wrong option must be DEFINITELY wrong (not a partial synonym)
✓ Explanation must follow format: "Both '[word1]' and '[word2]' mean [definition]."
✓ Use UK/Australian spelling (colour not color, centre not center)
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
  "question_text": "Which of the following words is similar to [WORD]?",
  "answer_options": ["option1", "option2", "option3", "option4", "option5"],
  "correct_answer": "option2",
  "solution": "Both '[word]' and '[synonym]' mean [definition]."
}

Generate the question now as valid JSON:`
};

// Difficulty-specific vocabulary guidance
export const synonymDifficultyGuidance = {
  1: `Year 7 (Easy): Use common, everyday vocabulary
Examples: repair/mend, happy/joyful, big/large, fast/quick, help/assist
AVOID: sophisticated, abstract, or academic vocabulary`,

  2: `Year 8 (Medium): Use more sophisticated but still accessible vocabulary
Examples: change/alter, begin/commence, finish/complete, important/significant
AVOID: very rare or highly academic vocabulary`,

  3: `Year 9 (Hard): Use academic, formal, nuanced vocabulary
Examples: document/record, establish/found, reveal/disclose, advocate/champion
Can use: abstract concepts, formal/academic language`
};
