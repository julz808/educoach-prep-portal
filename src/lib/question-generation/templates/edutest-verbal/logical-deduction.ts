/**
 * EduTest Verbal Reasoning - Logical Deduction Template (Select TWO)
 */

import type { QuestionTemplate } from '../../types';

export const logicalDeductionTemplate: QuestionTemplate = {
  type: 'logical-deduction',
  needsVerification: true,

  examples: [
    {
      question_text: `Please select TWO options which together most strongly suggest: THE CAKE IS READY TO COME OUT OF THE OVEN

1: The cake takes 15 minutes to cook
2: The clock is 15 minutes fast; it says 12:15pm
3: The cake is golden brown
4: At 11:45am mum said cake ready in 15 minutes
5: The cake is hot`,
      answer_options: ['1 & 2', '1 & 4', '2 & 4', '3 & 5', '4 & 5'],
      correct_answer: '2 & 4',
      explanation: "If the clock is 15 minutes fast and says 12:15pm, the real time is 12:00pm. The cake was going to be ready at 12:00pm (11:45am + 15 minutes)."
    },
    {
      question_text: `Please select TWO options which together most strongly suggest: EBONY HAS A BROWN DOG

1: Jade, Ebony and Rhiannon each have a dog
2: Jade's dog is same colour as Ebony's dog
3: Ebony likes brown dogs best
4: Ebony's dog is not black or white
5: Jade and Rhiannon both have brown dogs`,
      answer_options: ['1 & 3', '2 & 3', '2 & 5', '3 & 4', '4 & 5'],
      correct_answer: '2 & 5',
      explanation: "If Jade's dog is the same colour as Ebony's dog (statement 2), and Jade has a brown dog (statement 5), then Ebony must have a brown dog."
    }
  ],

  requirements: [
    'Exactly ONE pair of statements proves the conclusion',
    'Other pairs are suggestive but not sufficient',
    'Trap: preferences ≠ facts (liking brown dogs ≠ owning brown dog)',
    'Explanation shows complete logical chain',
    '2-3 sentence explanation maximum'
  ],

  prompt: `You are generating an EduTest Verbal Reasoning logical deduction question.

QUESTION FORMAT:
"Please select TWO options which together most strongly suggest: [CONCLUSION]

1: [Statement 1]
2: [Statement 2]
3: [Statement 3]
4: [Statement 4]
5: [Statement 5]"

YOUR TASK:
1. Choose a {DIFFICULTY_DESCRIPTOR} conclusion to prove
2. Create exactly 5 statements, where TWO together prove the conclusion
3. Design the statements so:
   - The correct pair forms a complete logical chain
   - Other pairs are suggestive but insufficient
   - Include common traps (preferences vs facts, partial information)

LOGICAL CHAIN TYPES:
- Transitive: A=B, B=C → A=C
- Time calculation: Started at X, duration Y, time check Z
- Process of elimination: Not A, Not B, Not C → Must be D
- Conditional: If A then B, A is true → B is true

CRITICAL RULES (if you violate these, the question will be REJECTED):
✓ Only ONE pair of statements definitively proves the conclusion
✓ Other pairs should seem plausible but be insufficient
✓ Include trap statements (e.g., "likes X" doesn't mean "has X")
✓ Explanation must show the complete logical chain
✓ Use UK/Australian spelling
✓ Keep explanation to 2-3 sentences maximum
✓ Answer options format: "1 & 2", "1 & 3", etc.

DIFFICULTY GUIDELINES:
{DIFFICULTY_GUIDANCE}

REAL EXAMPLES FROM EDUTEST TESTS:
{EXAMPLES}

DIVERSITY REQUIREMENTS:
{DIVERSITY_GUIDANCE}
Use different scenarios: time puzzles, colour/property matching, location/ownership, preferences vs facts, etc.

OUTPUT FORMAT (valid JSON only):
{
  "question_text": "[Full question with conclusion and 5 statements]",
  "answer_options": ["1 & 2", "1 & 3", "2 & 3", "2 & 4", "3 & 5"],
  "correct_answer": "2 & 3",
  "solution": "[Complete logical explanation showing how the two statements combine to prove conclusion]"
}

Generate the question now as valid JSON:`
};

export const logicalDeductionDifficultyGuidance = {
  1: `Year 7 (Easy):
- 2-step logical chain (A + B → C)
- Simple scenarios (time, colours, ownership)
- Obvious correct pair
- Clear trap statements
Example: Time calculation with one trick (clock is fast)`,

  2: `Year 8 (Medium):
- 2-3 step logical chain
- Transitive relationships (A=B, B=C → A=C)
- More subtle trap statements
- Requires careful reading
Example: Matching properties through intermediate statements`,

  3: `Year 9 (Hard):
- 3-4 step logical chain
- Multiple plausible combinations (must identify STRONGEST)
- Abstract relationships
- Trap statements very similar to correct statements
Example: Complex property matching with multiple variables`
};
