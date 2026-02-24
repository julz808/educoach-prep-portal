/**
 * Stage 2 Validation: Independent Answer Verification
 * Only for objective questions - uses Claude API to verify answer is correct
 * Time: 3-5 seconds | Cost: ~$0.005 per question
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Question } from '../types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Determine if a question type needs independent verification
 * Skip subjective questions (reading inference, author intent)
 * Verify objective questions (vocabulary, logic, math)
 */
export function needsVerification(subSkill: string): boolean {
  const objectiveSubSkills = [
    'vocabulary',
    'synonym',
    'antonym',
    'math',
    'calculation',
    'logic',
    'analogy',
    'foreign',
    'language',
    'anagram',
    'sequencing',
    'deduction'
  ];

  const lowerSubSkill = subSkill.toLowerCase();
  return objectiveSubSkills.some(skill => lowerSubSkill.includes(skill));
}

/**
 * Verify that the stated correct answer is actually correct
 * Uses independent Claude API call with temperature 0 (deterministic)
 */
export async function verifyAnswerIsCorrect(question: Question): Promise<{
  isCorrect: boolean;
  reasoning: string;
}> {
  const prompt = `You are verifying the correctness of a test question answer.

QUESTION: ${question.question_text}

OPTIONS:
${question.answer_options.map((opt, idx) => `${String.fromCharCode(65 + idx)}: ${opt}`).join('\n')}

STATED CORRECT ANSWER: ${question.correct_answer}

YOUR TASK:
Independently determine if "${question.correct_answer}" is definitively the ONLY correct answer.

RESPOND IN THIS EXACT FORMAT:
VERDICT: [YES or NO]
REASONING: [One sentence explaining why]

If YES: Confirm it's the only correct answer
If NO: Explain what's wrong (multiple correct answers, wrong answer, ambiguous, etc.)`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      temperature: 0, // Deterministic
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse response
    const verdictMatch = text.match(/VERDICT:\s*(YES|NO)/i);
    const reasoningMatch = text.match(/REASONING:\s*(.+)/i);

    const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'NO';
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Could not parse verification response';

    return {
      isCorrect: verdict === 'YES',
      reasoning
    };
  } catch (error) {
    console.error('Answer verification error:', error);
    // On API error, conservatively reject the question
    return {
      isCorrect: false,
      reasoning: `API error during verification: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Verify answer with retries (in case of transient API errors)
 */
export async function verifyAnswerWithRetry(
  question: Question,
  maxRetries: number = 2
): Promise<{ isCorrect: boolean; reasoning: string }> {
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await verifyAnswerIsCorrect(question);

      // If we got a definitive answer (YES or NO), return it
      if (result.isCorrect || !result.reasoning.includes('API error')) {
        return result;
      }

      lastError = result.reasoning;
      console.log(`Verification attempt ${attempt} failed: ${result.reasoning}`);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Verification attempt ${attempt} error:`, error);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  return {
    isCorrect: false,
    reasoning: `Verification failed after ${maxRetries} attempts. Last error: ${lastError}`
  };
}
