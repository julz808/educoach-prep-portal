/**
 * EduTest Verbal Reasoning - Analogy Question Template
 */

import type { QuestionTemplate } from '../../types';

export const analogyTemplate: QuestionTemplate = {
  type: 'analogy',
  needsVerification: true,

  examples: [
    {
      question_text: 'BLACK is to WHITE as DAY is to:',
      answer_options: ['night', 'sun', 'light', 'morning', 'time'],
      correct_answer: 'night',
      explanation: 'Black and white are opposites, just as day and night are opposites.'
    },
    {
      question_text: 'HOSPITAL is to DOCTOR as GARAGE is to:',
      answer_options: ['car', 'mechanic', 'tools', 'repair', 'building'],
      correct_answer: 'mechanic',
      explanation: 'A doctor works in a hospital, just as a mechanic works in a garage.'
    },
    {
      question_text: 'ACTIVIST is to RIOT as PIRATE is to:',
      answer_options: ['ocean', 'sail', 'mutiny', 'terrorise', 'ship'],
      correct_answer: 'mutiny',
      explanation: 'An activist can riot in order to gain control of a situation; a pirate can mutiny in order to gain control of a ship.'
    }
  ],

  requirements: [
    'Exactly ONE correct answer with same relationship type',
    'Relationship must be clear and parallel',
    'Distractors: words associated with C but wrong relationship',
    'May include "None of these" if applicable',
    'Explanation shows parallel structure clearly'
  ],

  prompt: `You are generating an EduTest Verbal Reasoning analogy question.

QUESTION FORMAT (use this EXACT format):
"[A] is to [B] as [C] is to:"

RELATIONSHIP TYPES (choose one):
1. OPPOSITES: BLACK/WHITE → DAY/NIGHT
2. LOCATION/PROFESSION: HOSPITAL/DOCTOR → GARAGE/MECHANIC
3. AGENT/ACTION: ACTIVIST/RIOT → PIRATE/MUTINY
4. PART/WHOLE: WHEEL/CAR → PAGE/BOOK
5. CATEGORY/MEMBER: FRUIT/APPLE → VEHICLE/CAR

YOUR TASK:
1. Choose a {DIFFICULTY_DESCRIPTOR} difficulty relationship
2. Create A:B pair with clear relationship
3. Create C word that can have same relationship
4. Find the answer that completes C:? with same relationship
5. Create 4 wrong options:
   - Words associated with C but wrong relationship
   - Words that seem plausible but don't match the relationship type

CRITICAL RULES (if you violate these, the question will be REJECTED):
✓ The relationship between A and B must be IDENTICAL to relationship between C and answer
✓ Only ONE option can complete the analogy correctly
✓ Explanation must show parallel structure: "A [relationship] B, just as C [relationship] answer"
✓ Use UK/Australian spelling
✓ Keep explanation to 1-2 sentences maximum
✓ Options must be in alphabetical order (or "None of these" last)

DIFFICULTY GUIDELINES:
{DIFFICULTY_GUIDANCE}

REAL EXAMPLES FROM EDUTEST TESTS:
{EXAMPLES}

DIVERSITY REQUIREMENTS:
{DIVERSITY_GUIDANCE}

OUTPUT FORMAT (valid JSON only):
{
  "question_text": "[A] is to [B] as [C] is to:",
  "answer_options": ["option1", "option2", "option3", "option4", "option5"],
  "correct_answer": "option2",
  "solution": "[A] [relationship description] [B], just as [C] [same relationship] [answer]."
}

Generate the question now as valid JSON:`
};

export const analogyDifficultyGuidance = {
  1: `Year 7 (Easy): Use obvious, concrete relationships
- Simple opposites (hot/cold, big/small)
- Clear location/profession (school/teacher, farm/farmer)
- Everyday part/whole (hand/body, wheel/car)
AVOID: abstract relationships, require cultural knowledge`,

  2: `Year 8 (Medium): Use functional relationships requiring understanding
- Opposite relationships with less common words
- Location/profession requiring understanding of roles
- Function/purpose relationships (pen/write, scissors/cut)
Can use: moderately abstract concepts`,

  3: `Year 9 (Hard): Use abstract relationships requiring deeper reasoning
- Agent/action with purpose (activist/riot, pirate/mutiny)
- Cause/effect relationships
- Abstract category/member
Can use: require understanding of motivations, purposes, complex relationships`
};
