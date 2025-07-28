/**
 * HALLUCINATION VALIDATION MODULE
 * 
 * Validates generated questions for hallucination indicators and 
 * automatically regenerates if found
 */

interface ValidationResult {
  isValid: boolean;
  hallucinationIndicators: string[];
  issues: string[];
}

// Hallucination patterns to detect
const HALLUCINATION_PATTERNS = [
  /\blet me\b/gi,
  /\bwait,?\s*let me\b/gi,
  /\bactually,?\s*let me\b/gi,
  /\blet me recalculate\b/gi,
  /\blet me check\b/gi,
  /\blet me verify\b/gi,
  /\blet me calculate\b/gi,
  /\bhmm,?\s*let me\b/gi,
  /\boops,?\s*let me\b/gi,
  /\bsorry,?\s*let me\b/gi,
  /\bi need to\b/gi,
  /\bi should\b/gi,
  /\bi'll\b/gi,
  /\bmy mistake\b/gi,
  /\bmy apologies\b/gi,
  /\bon second thought\b/gi,
  /\bupon reflection\b/gi
];

/**
 * Validates a question solution for hallucination indicators
 */
export function validateQuestionForHallucinations(questionData: any): ValidationResult {
  const solution = questionData.solution || '';
  const foundIndicators: string[] = [];
  const issues: string[] = [];

  // Check for hallucination patterns
  HALLUCINATION_PATTERNS.forEach(pattern => {
    const matches = solution.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!foundIndicators.includes(match.toLowerCase())) {
          foundIndicators.push(match.toLowerCase());
        }
      });
    }
  });

  // Additional validation checks
  if (solution.includes('VALIDATION_FLAG')) {
    issues.push('Contains validation flag - indicates generation issues');
  }

  if (solution.includes('recalculate') || solution.includes('re-calculate')) {
    issues.push('Contains calculation revision language');
  }

  const isValid = foundIndicators.length === 0 && issues.length === 0;

  return {
    isValid,
    hallucinationIndicators: foundIndicators,
    issues
  };
}

/**
 * Validates and potentially regenerates a question if hallucinations are found
 */
export async function validateAndRegenerateIfNeeded(
  questionData: any,
  regenerationFunction: () => Promise<any>,
  maxRetries: number = 3
): Promise<{ questionData: any; wasRegenerated: boolean; attempts: number }> {
  let currentQuestionData = questionData;
  let attempts = 0;
  let wasRegenerated = false;

  while (attempts < maxRetries) {
    attempts++;
    
    const validation = validateQuestionForHallucinations(currentQuestionData);
    
    if (validation.isValid) {
      console.log(`✅ Question validation passed on attempt ${attempts}`);
      return { questionData: currentQuestionData, wasRegenerated, attempts };
    }

    console.log(`❌ Question validation failed on attempt ${attempts}:`);
    console.log(`   Hallucination indicators: ${validation.hallucinationIndicators.join(', ')}`);
    console.log(`   Issues: ${validation.issues.join(', ')}`);

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

  console.log(`⚠️ Question still contains hallucinations after ${maxRetries} attempts`);
  return { questionData: currentQuestionData, wasRegenerated, attempts };
}

/**
 * Batch validates multiple questions and reports statistics
 */
export function batchValidateQuestions(questions: any[]): {
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  hallucinationRate: number;
  detailedResults: Array<{ questionId: string; isValid: boolean; indicators: string[] }>;
} {
  const results = questions.map(q => {
    const validation = validateQuestionForHallucinations(q);
    return {
      questionId: q.id || 'unknown',
      isValid: validation.isValid,
      indicators: validation.hallucinationIndicators
    };
  });

  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.length - validCount;

  return {
    totalQuestions: questions.length,
    validQuestions: validCount,
    invalidQuestions: invalidCount,
    hallucinationRate: questions.length > 0 ? (invalidCount / questions.length) * 100 : 0,
    detailedResults: results
  };
}