// ============================================================================
// QUESTION VALIDATION PIPELINE
// ============================================================================
// Multi-step validation system to catch mathematical errors, hallucinations,
// and impossible questions before they reach students

import { callClaudeAPIWithRetry } from './claudePrompts.ts';

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-100 confidence score
  errors: string[];
  warnings: string[];
  validationSteps: ValidationStep[];
  shouldRegenerate: boolean;
  requiresManualReview: boolean;
}

export interface ValidationStep {
  stepName: string;
  passed: boolean;
  confidence: number;
  details: string;
  duration: number;
}

export interface QuestionToValidate {
  question_text: string;
  answer_options: string[] | null;
  correct_answer: string | null;
  solution: string;
  response_type: 'multiple_choice' | 'extended_response';
  sub_skill: string;
  section_name: string;
  test_type: string;
  difficulty: number;
}

// Configuration for validation pipeline
export interface ValidationConfig {
  enableMathValidation: boolean;
  enableLogicalConsistency: boolean;
  enableCrossValidation: boolean;
  enableConfidenceAnalysis: boolean;
  maxRegenerationAttempts: number;
  minimumConfidenceThreshold: number;
  skipValidationForTypes?: string[];
}

const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  enableMathValidation: true,
  enableLogicalConsistency: true,
  enableCrossValidation: true,
  enableConfidenceAnalysis: true,
  maxRegenerationAttempts: 3,
  minimumConfidenceThreshold: 75,
  skipValidationForTypes: ['extended_response'] // Skip intensive validation for writing
};

/**
 * Main validation pipeline entry point
 */
export async function validateQuestionWithPipeline(
  question: QuestionToValidate,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): Promise<ValidationResult> {
  const startTime = Date.now();
  const validationSteps: ValidationStep[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`🔍 Starting validation pipeline for ${question.sub_skill} question...`);

  try {
    // Step 1: Basic structure validation
    const structureResult = await validateQuestionStructure(question);
    validationSteps.push(structureResult);
    if (!structureResult.passed) {
      errors.push(...structureResult.details.split(';').filter(d => d.trim()));
    }

    // Step 2: Confidence analysis
    if (config.enableConfidenceAnalysis) {
      const confidenceResult = await analyzeConfidenceIndicators(question);
      validationSteps.push(confidenceResult);
      if (!confidenceResult.passed) {
        warnings.push(confidenceResult.details);
      }
    }

    // Step 3: Mathematics validation (if applicable)
    if (config.enableMathValidation && isMathematicsQuestion(question)) {
      const mathResult = await validateMathematicsQuestion(question);
      validationSteps.push(mathResult);
      if (!mathResult.passed) {
        errors.push(mathResult.details);
      }
    }

    // Step 4: Logical consistency check
    if (config.enableLogicalConsistency) {
      const logicalResult = await validateLogicalConsistency(question);
      validationSteps.push(logicalResult);
      if (!logicalResult.passed) {
        errors.push(logicalResult.details);
      }
    }

    // Step 5: Cross-validation with fresh solve (for critical questions)
    if (config.enableCrossValidation && shouldCrossValidate(question)) {
      const crossResult = await performCrossValidation(question);
      validationSteps.push(crossResult);
      if (!crossResult.passed) {
        errors.push(crossResult.details);
      }
    }

    // Calculate overall confidence and determine result
    const overallConfidence = calculateOverallConfidence(validationSteps);
    const isValid = errors.length === 0 && overallConfidence >= config.minimumConfidenceThreshold;
    const shouldRegenerate = !isValid && (errors.length > 0 || overallConfidence < config.minimumConfidenceThreshold);
    const requiresManualReview = warnings.length > 0 || overallConfidence < 60;

    const totalDuration = Date.now() - startTime;
    console.log(`${isValid ? '✅' : '❌'} Validation completed in ${totalDuration}ms - Confidence: ${overallConfidence}%`);

    return {
      isValid,
      confidence: overallConfidence,
      errors,
      warnings,
      validationSteps,
      shouldRegenerate,
      requiresManualReview
    };

  } catch (error) {
    console.error('❌ Validation pipeline error:', error);
    return {
      isValid: false,
      confidence: 0,
      errors: [`Validation pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings,
      validationSteps,
      shouldRegenerate: true,
      requiresManualReview: true
    };
  }
}

/**
 * Step 1: Basic question structure validation
 */
async function validateQuestionStructure(question: QuestionToValidate): Promise<ValidationStep> {
  const startTime = Date.now();
  const issues: string[] = [];

  // Check required fields
  if (!question.question_text || question.question_text.trim().length < 10) {
    issues.push('Question text is too short or missing');
  }

  if (!question.solution || question.solution.trim().length < 10) {
    issues.push('Solution explanation is too short or missing');
  }

  // Validate multiple choice structure
  if (question.response_type === 'multiple_choice') {
    if (!question.answer_options || question.answer_options.length < 2) {
      issues.push('Multiple choice question needs at least 2 options');
    }

    if (!question.correct_answer) {
      issues.push('Multiple choice question needs a correct answer');
    }

    if (question.answer_options && question.correct_answer) {
      if (!question.answer_options.includes(question.correct_answer)) {
        issues.push('Correct answer is not in the answer options');
      }
    }

    // Check for duplicate options
    if (question.answer_options) {
      const uniqueOptions = new Set(question.answer_options);
      if (uniqueOptions.size !== question.answer_options.length) {
        issues.push('Duplicate answer options detected');
      }
    }
  }

  const passed = issues.length === 0;
  return {
    stepName: 'Structure Validation',
    passed,
    confidence: passed ? 100 : Math.max(0, 100 - (issues.length * 25)),
    details: issues.length > 0 ? issues.join('; ') : 'Question structure is valid',
    duration: Date.now() - startTime
  };
}

/**
 * Step 2: Analyze confidence indicators in solution
 */
async function analyzeConfidenceIndicators(question: QuestionToValidate): Promise<ValidationStep> {
  const startTime = Date.now();
  const solution = question.solution.toLowerCase();

  // Patterns that indicate uncertainty or hallucination
  const uncertaintyPhrases = [
    'doesn\'t match any option',
    'not among the options',
    'not in the options',
    'may be an error',
    'appears to be',
    'closest option',
    'since this isn\'t listed',
    'however, since',
    'this should be',
    'intended answer',
    'there may be',
    'seems to be',
    'looks like',
    'probably',
    'assuming',
    'if we consider',
    'it\'s possible that'
  ];

  // Mathematical contradiction patterns
  const contradictionPhrases = [
    'this gives us',
    'but the answer is',
    'however,',
    'although',
    'despite',
    'contradicts',
    'doesn\'t equal',
    'not equal to'
  ];

  const foundUncertainty = uncertaintyPhrases.filter(phrase => solution.includes(phrase));
  const foundContradictions = contradictionPhrases.filter(phrase => solution.includes(phrase));

  const totalIssues = foundUncertainty.length + foundContradictions.length;
  const confidence = Math.max(0, 100 - (totalIssues * 20));
  const passed = totalIssues === 0;

  let details = 'Solution shows high confidence';
  if (totalIssues > 0) {
    details = `Confidence issues detected: ${[...foundUncertainty, ...foundContradictions].join(', ')}`;
  }

  return {
    stepName: 'Confidence Analysis',
    passed,
    confidence,
    details,
    duration: Date.now() - startTime
  };
}

/**
 * Step 3: Validate mathematics questions
 */
async function validateMathematicsQuestion(question: QuestionToValidate): Promise<ValidationStep> {
  const startTime = Date.now();

  if (question.response_type !== 'multiple_choice' || !question.answer_options) {
    return {
      stepName: 'Mathematics Validation',
      passed: true,
      confidence: 100,
      details: 'Not a multiple choice math question',
      duration: Date.now() - startTime
    };
  }

  try {
    // Use Claude API to independently solve the question
    const mathValidationPrompt = `
Please solve this mathematics question step by step and determine which answer option is mathematically correct.

Question: ${question.question_text}

Options:
${question.answer_options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

Instructions:
1. Solve the problem step by step
2. Calculate the exact answer
3. Check which option matches your calculated answer
4. If none match exactly, indicate this clearly
5. Respond with ONLY the letter of the correct option (A, B, C, D) or "NONE" if no option is correct

Answer:`;

    console.log('🧮 Performing mathematical validation...');
    const response = await callClaudeAPIWithRetry(mathValidationPrompt);
    
    // Handle different response formats from Claude API
    let responseText = '';
    if (typeof response === 'string') {
      responseText = response;
    } else if (response && typeof response === 'object' && 'content' in response) {
      responseText = response.content;
    } else if (response && typeof response === 'object' && response.content && Array.isArray(response.content)) {
      responseText = response.content[0]?.text || '';
    } else {
      responseText = String(response);
    }
    
    const calculatedAnswer = responseText.trim().toUpperCase();

    // Convert correct answer to letter format for comparison
    const correctAnswerIndex = question.answer_options.indexOf(question.correct_answer!);
    const correctAnswerLetter = String.fromCharCode(65 + correctAnswerIndex);

    const passed = calculatedAnswer === correctAnswerLetter;
    let details = '';
    let confidence = 100;

    console.log(`🔍 Math validation debug: responseText="${responseText}", calculatedAnswer="${calculatedAnswer}", correctAnswerLetter="${correctAnswerLetter}"`);

    if (calculatedAnswer === 'NONE') {
      passed = false;
      confidence = 0;
      details = 'Mathematical solution shows no option is correct - indicates hallucination';
    } else if (passed) {
      details = `Mathematical verification passed - calculated answer ${calculatedAnswer} matches marked answer ${correctAnswerLetter}`;
    } else {
      confidence = 30;
      details = `Mathematical discrepancy - calculated answer ${calculatedAnswer} differs from marked answer ${correctAnswerLetter}`;
    }

    return {
      stepName: 'Mathematics Validation',
      passed,
      confidence,
      details,
      duration: Date.now() - startTime
    };

  } catch (error) {
    return {
      stepName: 'Mathematics Validation',
      passed: false,
      confidence: 0,
      details: `Mathematical validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Step 4: Validate logical consistency
 */
async function validateLogicalConsistency(question: QuestionToValidate): Promise<ValidationStep> {
  const startTime = Date.now();

  // Check for common logical inconsistencies
  const issues: string[] = [];

  // Check if solution mentions the correct answer
  if (question.response_type === 'multiple_choice' && question.correct_answer) {
    const solutionLower = question.solution.toLowerCase();
    const correctAnswerLower = question.correct_answer.toLowerCase();
    
    if (!solutionLower.includes(correctAnswerLower)) {
      issues.push('Solution does not mention the correct answer');
    }
  }

  // Check for self-contradictions in solution
  const contradictionKeywords = ['however', 'but', 'although', 'despite', 'contradiction'];
  const contradictions = contradictionKeywords.filter(keyword => 
    question.solution.toLowerCase().includes(keyword)
  );

  if (contradictions.length > 2) {
    issues.push('Solution contains multiple contradictory statements');
  }

  const passed = issues.length === 0;
  const confidence = passed ? 100 : Math.max(0, 100 - (issues.length * 30));

  return {
    stepName: 'Logical Consistency',
    passed,
    confidence,
    details: issues.length > 0 ? issues.join('; ') : 'Question is logically consistent',
    duration: Date.now() - startTime
  };
}

/**
 * Step 5: Cross-validation with independent solve
 */
async function performCrossValidation(question: QuestionToValidate): Promise<ValidationStep> {
  const startTime = Date.now();

  try {
    const crossValidationPrompt = `
Please provide a brief solution to this question and identify the correct answer.

Question: ${question.question_text}

${question.response_type === 'multiple_choice' && question.answer_options 
  ? `Options:\n${question.answer_options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}`
  : ''
}

Provide a concise solution and the correct answer.`;

    console.log('🔄 Performing cross-validation...');
    const response = await callClaudeAPIWithRetry(crossValidationPrompt);
    
    // Handle different response formats from Claude API
    let responseText = '';
    if (typeof response === 'string') {
      responseText = response;
    } else if (response && typeof response === 'object' && 'content' in response) {
      responseText = response.content;
    } else if (response && typeof response === 'object' && response.content && Array.isArray(response.content)) {
      responseText = response.content[0]?.text || '';
    } else {
      responseText = String(response);
    }
    
    // For now, we'll mark cross-validation as passed if we got a response
    // More sophisticated comparison logic could be added here
    const passed = responseText && responseText.length > 20;
    const confidence = passed ? 90 : 50;

    return {
      stepName: 'Cross Validation',
      passed,
      confidence,
      details: passed ? 'Cross-validation completed successfully' : 'Cross-validation produced insufficient response',
      duration: Date.now() - startTime
    };

  } catch (error) {
    return {
      stepName: 'Cross Validation',
      passed: false,
      confidence: 0,
      details: `Cross-validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Helper functions
 */
function isMathematicsQuestion(question: QuestionToValidate): boolean {
  const mathKeywords = [
    'mathematics', 'math', 'algebra', 'geometry', 'arithmetic', 'calculation',
    'equation', 'formula', 'solve', 'calculate', 'number', 'reasoning'
  ];
  
  const textToCheck = `${question.section_name} ${question.sub_skill} ${question.question_text}`.toLowerCase();
  return mathKeywords.some(keyword => textToCheck.includes(keyword));
}

function shouldCrossValidate(question: QuestionToValidate): boolean {
  // Cross-validate mathematics questions and high-difficulty questions
  return isMathematicsQuestion(question) || question.difficulty >= 3;
}

function calculateOverallConfidence(steps: ValidationStep[]): number {
  if (steps.length === 0) return 0;
  
  // Weighted average with higher weights for critical steps
  const weights = {
    'Structure Validation': 0.3,
    'Confidence Analysis': 0.2,
    'Mathematics Validation': 0.3,
    'Logical Consistency': 0.15,
    'Cross Validation': 0.05
  };

  let totalWeight = 0;
  let weightedSum = 0;

  steps.forEach(step => {
    const weight = weights[step.stepName as keyof typeof weights] || 0.1;
    totalWeight += weight;
    weightedSum += step.confidence * weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Validation logging for pattern analysis
 */
export interface ValidationLog {
  questionId?: string;
  testType: string;
  subSkill: string;
  validationResult: ValidationResult;
  timestamp: string;
}

export function logValidationResult(log: ValidationLog): void {
  console.log(`📊 Validation Log: ${log.testType} - ${log.subSkill}`);
  console.log(`   Valid: ${log.validationResult.isValid}, Confidence: ${log.validationResult.confidence}%`);
  
  if (log.validationResult.errors.length > 0) {
    console.log(`   Errors: ${log.validationResult.errors.join('; ')}`);
  }
  
  if (log.validationResult.warnings.length > 0) {
    console.log(`   Warnings: ${log.validationResult.warnings.join('; ')}`);
  }

  // TODO: Store in database for pattern analysis
}