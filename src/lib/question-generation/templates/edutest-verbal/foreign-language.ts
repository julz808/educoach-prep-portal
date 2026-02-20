/**
 * EduTest Verbal Reasoning - Foreign Language Decoding Template
 */

import type { QuestionTemplate } from '../../types';

export const foreignLanguageTemplate: QuestionTemplate = {
  type: 'foreign-language',
  needsVerification: true, // Has definitive correct answer

  examples: [
    {
      question_text: `BODO ET FUMY means CAN YOU COME TO MY HOUSE?
YAM EO FUMY BODO means YES I CAN COME TO THE HOUSE
SY EO FUMY means NO I CANNOT COME

Which word means HOUSE?`,
      answer_options: ['BODO', 'ET', 'FUMY', 'YAM', 'EO'],
      correct_answer: 'BODO',
      explanation: 'Process of elimination.'
    },
    {
      question_text: `YUMO ONO WICKA means HAPPY HOLIDAYS MUM
WICKA WUIM FREK ONO means MUM IS HAPPY TODAY
POK WUIM FREK ONO means DAD IS HAPPY TODAY

Which word means HOLIDAYS?`,
      answer_options: ['YUMO', 'ONO', 'WICKA', 'WUIM', 'FREK'],
      correct_answer: 'YUMO',
      explanation: 'Process of elimination.'
    }
  ],

  requirements: [
    'Exactly ONE correct answer through process of elimination',
    '2-3 sentences in made-up language with translations',
    'Target word must be deducible through systematic elimination',
    'Distractors are other words from the sentences',
    'Explanation: "Process of elimination."'
  ],

  prompt: `You are generating an EduTest Verbal Reasoning foreign language decoding question.

QUESTION FORMAT:
[Sentence 1 in made-up language] means [ENGLISH TRANSLATION 1]
[Sentence 2 in made-up language] means [ENGLISH TRANSLATION 2]
[Sentence 3 in made-up language] means [ENGLISH TRANSLATION 3]

Which word means [TARGET_ENGLISH_WORD]?

YOUR TASK:
1. Create a made-up language with consistent word mappings
2. Write {NUM_SENTENCES} sentences in the made-up language with English translations
3. Design sentences so that the target word can be found through process of elimination
4. Target word should appear in {APPEARANCES} of the sentences
5. Other words should overlap between sentences to enable elimination

MADE-UP LANGUAGE RULES:
- Use pronounceable nonsense words (BODO, FUMY, WICKA, etc.)
- Keep word order consistent or close to English
- Each made-up word maps to exactly ONE English word
- Make sentences internally consistent

CRITICAL RULES (if you violate these, the question will be REJECTED):
✓ The target word MUST be deducible through systematic elimination
✓ Create a consistent mapping (don't change what a word means between sentences)
✓ Answer options should be 5 words from the made-up sentences
✓ Explanation is always exactly: "Process of elimination."
✓ Keep sentences simple and clear
✓ {NUM_SENTENCES} sentences total

DIFFICULTY GUIDELINES:
{DIFFICULTY_GUIDANCE}

REAL EXAMPLES FROM EDUTEST TESTS:
{EXAMPLES}

DIVERSITY REQUIREMENTS:
{DIVERSITY_GUIDANCE}
Use different sentence topics each time (family, activities, emotions, objects, etc.)

OUTPUT FORMAT (valid JSON only):
{
  "question_text": "[Full question with all sentences and 'Which word means X?' question]",
  "answer_options": ["WORD1", "WORD2", "WORD3", "WORD4", "WORD5"],
  "correct_answer": "WORD2",
  "solution": "Process of elimination."
}

Generate the question now as valid JSON:`
};

export const foreignLanguageDifficultyGuidance = {
  1: `Year 7 (Easy):
- 2-3 sentences
- Target word appears in ALL sentences
- Simple, short sentences (4-6 words each)
- Obvious overlap between sentences
Example: BODO appears in all 3 sentences, easy to identify`,

  2: `Year 8 (Medium):
- 3 sentences
- Target word appears in 2 sentences
- Moderate sentence length (5-8 words)
- Requires systematic comparison
Sentence topics: family relationships, daily activities`,

  3: `Year 9 (Hard):
- 3-4 sentences
- Target word appears in only 1-2 sentences
- Longer sentences (6-10 words)
- Requires multi-step elimination (eliminate other words first)
- More complex sentence structures
Sentence topics: abstract concepts, complex scenarios`
};
