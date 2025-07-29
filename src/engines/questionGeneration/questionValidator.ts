/**
 * COMPREHENSIVE QUESTION VALIDATION SYSTEM
 * 
 * Two-stage validation:
 * 1. Hallucination detection - if "let me" found, regenerate
 * 2. Answer verification - independent solving to confirm correct answer
 */

import { callClaudeAPIWithRetry } from './claudePrompts';

export interface ValidationResult {
  isValid: boolean;
  hasHallucinations: boolean;
  answerIsCorrect: boolean;
  hallucinationIndicators: string[];
  answerValidationDetails: {
    originalAnswer: string;
    independentAnswer: string;
    matches: boolean;
    explanation: string;
  } | null;
  shouldRegenerate: boolean;
}

/**
 * Stage 1: Check for hallucination indicators in solution
 */
function checkForHallucinations(solution: string): { hasHallucinations: boolean; indicators: string[] } {
  const hallucinationPatterns = [
    /\blet me\b/gi,
    /\bwait,?\s*let me\b/gi,
    /\bactually,?\s*let me\b/gi,
    /\blet me recalculate\b/gi,
    /\blet me check\b/gi,
    /\blet me verify\b/gi,
    /\blet me calculate\b/gi
  ];

  const foundIndicators: string[] = [];

  hallucinationPatterns.forEach(pattern => {
    const matches = solution.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!foundIndicators.includes(match.toLowerCase())) {
          foundIndicators.push(match.toLowerCase());
        }
      });
    }
  });

  return {
    hasHallucinations: foundIndicators.length > 0,
    indicators: foundIndicators
  };
}

/**
 * Stage 2: Independent answer verification using Claude API
 */
async function verifyAnswerIndependently(questionData: any): Promise<{
  matches: boolean;
  originalAnswer: string;
  independentAnswer: string;
  explanation: string;
}> {
  const { question_text, answer_options, correct_answer } = questionData;

  // Build verification prompt
  const verificationPrompt = `You are solving this question independently to verify the correct answer.

QUESTION: ${question_text}

OPTIONS:
${answer_options.map((option: string, index: number) => `${String.fromCharCode(65 + index)}) ${option.replace(/^[A-D]\)\s*/, '')}`).join('\n')}

INSTRUCTIONS:
1. Solve this question step-by-step
2. Show your working clearly
3. Determine which option (A, B, C, or D) is correct
4. Be certain of your answer

CRITICAL: Do not reference any provided solution. Solve this completely independently.

OUTPUT FORMAT - Return ONLY this JSON:
{
  "correct_answer": "A", 
  "working": "Step-by-step solution showing how you arrived at the answer",
  "confidence": "high/medium/low"
}`;

  try {
    const response = await callClaudeAPIWithRetry(verificationPrompt);
    
    if (!response.content || response.content.length === 0) {
      throw new Error('Empty response from Claude API');
    }

    const textContent = response.content[0]?.text;
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in verification response');
    }

    const verificationResult = JSON.parse(jsonMatch[0]);
    const independentAnswer = verificationResult.correct_answer?.trim().toUpperCase();
    const originalAnswer = correct_answer?.trim().toUpperCase();

    return {
      matches: independentAnswer === originalAnswer,
      originalAnswer: originalAnswer || 'UNKNOWN',
      independentAnswer: independentAnswer || 'UNKNOWN',
      explanation: verificationResult.working || 'No explanation provided'
    };

  } catch (error) {
    console.error('Error in independent answer verification:', error);
    return {
      matches: false, // Assume false if verification fails
      originalAnswer: correct_answer || 'UNKNOWN',
      independentAnswer: 'VERIFICATION_FAILED',
      explanation: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Complete validation of a generated question
 */
export async function validateQuestion(questionData: any): Promise<ValidationResult> {
  console.log(`🔍 Validating question...`);

  // Stage 1: Check for hallucinations
  const hallucinationCheck = checkForHallucinations(questionData.solution || '');
  
  if (hallucinationCheck.hasHallucinations) {
    console.log(`❌ Hallucinations detected: ${hallucinationCheck.indicators.join(', ')}`);
    return {
      isValid: false,
      hasHallucinations: true,
      answerIsCorrect: false,
      hallucinationIndicators: hallucinationCheck.indicators,
      answerValidationDetails: null,
      shouldRegenerate: true
    };
  }

  console.log(`✅ No hallucinations detected`);

  // Stage 2: Independent answer verification (only for multiple choice)
  let answerValidation = null;
  let answerIsCorrect = true; // Default true for non-multiple choice

  if (questionData.answer_options && Array.isArray(questionData.answer_options)) {
    console.log(`🧮 Verifying answer independently...`);
    
    answerValidation = await verifyAnswerIndependently(questionData);
    answerIsCorrect = answerValidation.matches;
    
    if (answerIsCorrect) {
      console.log(`✅ Answer verification passed: ${answerValidation.originalAnswer}`);
    } else {
      console.log(`❌ Answer verification failed: Expected ${answerValidation.originalAnswer}, got ${answerValidation.independentAnswer}`);
    }
  }

  const isValid = !hallucinationCheck.hasHallucinations && answerIsCorrect;

  return {
    isValid,
    hasHallucinations: false,
    answerIsCorrect,
    hallucinationIndicators: [],
    answerValidationDetails: answerValidation,
    shouldRegenerate: !isValid
  };
}

/**
 * Validate and regenerate question if needed
 */
export async function validateAndRegenerateIfNeeded(
  questionData: any,
  regenerationFunction: () => Promise<any>,
  maxRetries: number = 5
): Promise<{
  questionData: any;
  wasRegenerated: boolean;
  attempts: number;
  finalValidation: ValidationResult;
}> {
  let currentQuestionData = questionData;
  let attempts = 0;
  let wasRegenerated = false;
  let finalValidation: ValidationResult;

  while (attempts < maxRetries) {
    attempts++;
    console.log(`🔍 Validation attempt ${attempts}/${maxRetries}`);
    
    finalValidation = await validateQuestion(currentQuestionData);
    
    if (finalValidation.isValid) {
      console.log(`✅ Question validation passed on attempt ${attempts}`);
      break;
    }

    console.log(`❌ Question validation failed on attempt ${attempts}:`);
    if (finalValidation.hasHallucinations) {
      console.log(`   Hallucinations: ${finalValidation.hallucinationIndicators.join(', ')}`);
    }
    if (!finalValidation.answerIsCorrect && finalValidation.answerValidationDetails) {
      console.log(`   Wrong answer: Expected ${finalValidation.answerValidationDetails.originalAnswer}, got ${finalValidation.answerValidationDetails.independentAnswer}`);
    }

    if (attempts < maxRetries) {
      console.log(`🔄 Regenerating question (attempt ${attempts + 1}/${maxRetries})...`);
      try {
        currentQuestionData = await regenerationFunction();
        wasRegenerated = true;
        
        // Add delay between regeneration attempts
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Regeneration attempt ${attempts} failed:`, error);
        break;
      }
    }
  }

  if (!finalValidation.isValid && attempts >= maxRetries) {
    console.log(`❌ Question validation failed after ${maxRetries} attempts - REJECTING QUESTION`);
    console.log(`   Errors: ${finalValidation.hasHallucinations ? 'Hallucinations detected' : 'Answer verification failed'}`);
    console.log(`   This question will NOT be saved to database`);
    
    // Throw error to prevent invalid question from being saved
    throw new Error(`Question validation failed after ${maxRetries} attempts. ${finalValidation.hasHallucinations ? 'Contains hallucinations like "Let me"' : 'Answer verification failed'}. Question rejected to maintain quality standards.`);
  }

  return {
    questionData: currentQuestionData,
    wasRegenerated,
    attempts,
    finalValidation
  };
}