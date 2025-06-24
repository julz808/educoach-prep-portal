// ============================================================================
// ENHANCED QUESTION GENERATION WITH VALIDATION PIPELINE
// ============================================================================
// Improved question generation that includes multi-step validation
// and auto-regeneration for failed validations

import { 
  TEST_STRUCTURES, 
  UNIFIED_SUB_SKILLS, 
  SECTION_TO_SUB_SKILLS,
  SUB_SKILL_VISUAL_MAPPING
} from '../../data/curriculumData.ts';
import { buildQuestionPrompt, callClaudeAPIWithRetry, parseClaudeResponse } from './claudePrompts.ts';
import { validateQuestionWithPipeline, logValidationResult, type ValidationConfig, type QuestionToValidate } from './validationPipeline.ts';

// Enhanced generation request with validation options
export interface EnhancedQuestionRequest {
  testType: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  responseType: 'multiple_choice' | 'extended_response';
  generateVisual: boolean;
  generationContext: GenerationContext;
  passageContent?: string;
  validationConfig?: ValidationConfig;
  maxRegenerationAttempts?: number;
}

interface GeneratedQuestion {
  id?: string;
  question_text: string;
  answer_options: string[] | null;
  correct_answer: string | null;
  solution: string;
  has_visual: boolean;
  visual_type: string | null;
  visual_data: any;
  visual_svg: string | null;
  test_type: string;
  section_name: string;
  sub_skill: string;
  difficulty: number;
  response_type: 'multiple_choice' | 'extended_response';
  passage_reference: boolean;
  australian_context: boolean;
  max_points: number;
  product_type?: string;
  question_order?: number;
  generation_metadata: {
    generation_timestamp: string;
    attempt_number?: number;
    prompt_length?: number;
    response_time_ms?: number;
    validation_passed?: boolean;
    validation_confidence?: number;
    regeneration_count?: number;
  };
  created_at?: string;
}

interface GenerationContext {
  sessionId?: string;
  testType?: string;
  usedTopics: Set<string>;
  usedNames: Set<string>;
  usedLocations: Set<string>;
  usedScenarios: Set<string>;
  passageBank?: any[];
  questionBank?: any[];
  generatedQuestions?: any[];
  questionsBySubSkill?: Record<string, any[]>;
  currentDifficulty?: number;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  visualsGenerated?: number;
  lastUpdate?: string;
}

export interface EnhancedGenerationResult {
  question: GeneratedQuestion;
  validationResult: any;
  regenerationCount: number;
  totalDuration: number;
  wasValidated: boolean;
}

/**
 * Enhanced question generation with validation pipeline
 */
export async function generateQuestionWithValidation(
  request: EnhancedQuestionRequest
): Promise<EnhancedGenerationResult> {
  const startTime = Date.now();
  const maxAttempts = request.maxRegenerationAttempts || 3;
  let regenerationCount = 0;
  let lastValidationResult: any = null;

  console.log(`🚀 Starting enhanced generation for ${request.subSkill} (max attempts: ${maxAttempts})`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n📝 Generation attempt ${attempt}/${maxAttempts}`);
    
    try {
      // Generate the question using existing logic
      const question = await generateBasicQuestion(request, attempt);
      
      // Convert to validation format
      const questionToValidate: QuestionToValidate = {
        question_text: question.question_text,
        answer_options: question.answer_options,
        correct_answer: question.correct_answer,
        solution: question.solution,
        response_type: question.response_type,
        sub_skill: question.sub_skill,
        section_name: question.section_name,
        test_type: question.test_type,
        difficulty: question.difficulty
      };

      // Run validation pipeline
      console.log(`🔍 Running validation pipeline...`);
      const validationResult = await validateQuestionWithPipeline(
        questionToValidate, 
        request.validationConfig
      );

      // Log validation result for analysis
      logValidationResult({
        testType: request.testType,
        subSkill: request.subSkill,
        validationResult,
        timestamp: new Date().toISOString()
      });

      // Update generation metadata with validation info
      question.generation_metadata = {
        ...question.generation_metadata,
        validation_passed: validationResult.isValid,
        validation_confidence: validationResult.confidence,
        regeneration_count: regenerationCount
      };

      lastValidationResult = validationResult;

      // Check if validation passed
      if (validationResult.isValid) {
        const totalDuration = Date.now() - startTime;
        console.log(`✅ Question generation successful after ${attempt} attempts (${totalDuration}ms)`);
        console.log(`   Confidence: ${validationResult.confidence}%`);
        
        return {
          question,
          validationResult,
          regenerationCount,
          totalDuration,
          wasValidated: true
        };
      }

      // Validation failed - check if we should regenerate
      if (validationResult.shouldRegenerate && attempt < maxAttempts) {
        regenerationCount++;
        console.log(`⚠️  Validation failed (confidence: ${validationResult.confidence}%) - regenerating...`);
        console.log(`   Errors: ${validationResult.errors.join('; ')}`);
        
        // Add failed question info to context to avoid repeating mistakes
        updateContextWithFailure(request.generationContext, validationResult);
        
        continue; // Try again
      }

      // Validation failed but we've reached max attempts or shouldn't regenerate
      if (validationResult.requiresManualReview) {
        console.log(`🔴 Question requires manual review after ${attempt} attempts`);
        console.log(`   Final confidence: ${validationResult.confidence}%`);
        console.log(`   Issues: ${[...validationResult.errors, ...validationResult.warnings].join('; ')}`);
        
        // Return the question but mark it for manual review
        const totalDuration = Date.now() - startTime;
        return {
          question,
          validationResult,
          regenerationCount,
          totalDuration,
          wasValidated: true
        };
      }

    } catch (error) {
      console.error(`❌ Generation attempt ${attempt} failed:`, error);
      
      if (attempt === maxAttempts) {
        // Final attempt failed - return error result
        const totalDuration = Date.now() - startTime;
        throw new Error(`Question generation failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Question generation failed - unexpected code path');
}

/**
 * Generate basic question using existing logic (extracted from original function)
 */
async function generateBasicQuestion(
  request: EnhancedQuestionRequest, 
  attempt: number
): Promise<GeneratedQuestion> {
  // Build the prompt
  const prompt = buildQuestionPrompt({
    testType: request.testType,
    sectionName: request.sectionName,
    subSkill: request.subSkill,
    difficulty: request.difficulty,
    responseType: request.responseType,
    generateVisual: request.generateVisual,
    generationContext: request.generationContext,
    passageContent: request.passageContent
  });
  
  // Call Claude API
  const response = await callClaudeAPIWithRetry(prompt);
  
  // Parse response
  const parsedQuestion = parseClaudeResponse(response);
  
  // Calculate max_points
  const maxPoints = calculateMaxPoints(request.testType, request.subSkill, request.responseType);
  
  // Create question object
  const question: GeneratedQuestion = {
    question_text: parsedQuestion.question_text || '',
    answer_options: parsedQuestion.answer_options || null,
    correct_answer: parsedQuestion.correct_answer || null,
    solution: parsedQuestion.solution || '',
    has_visual: parsedQuestion.has_visual || false,
    visual_type: parsedQuestion.visual_type || null,
    visual_data: parsedQuestion.visual_data || null,
    visual_svg: parsedQuestion.visual_svg || null,
    test_type: request.testType,
    section_name: request.sectionName,
    sub_skill: request.subSkill,
    difficulty: request.difficulty,
    response_type: request.responseType,
    passage_reference: request.passageContent ? true : false,
    australian_context: false,
    max_points: maxPoints,
    product_type: request.testType,
    generation_metadata: {
      generation_timestamp: new Date().toISOString(),
      attempt_number: attempt,
      prompt_length: prompt.length,
      response_time_ms: 0
    }
  };
  
  return question;
}

/**
 * Helper function to calculate max_points (copied from questionGeneration.ts)
 */
function calculateMaxPoints(testType: string, subSkill: string, responseType: 'multiple_choice' | 'extended_response'): number {
  // Writing questions have higher point values based on product type
  if (responseType === 'extended_response' || 
      subSkill.toLowerCase().includes('writing') ||
      subSkill.toLowerCase().includes('narrative') ||
      subSkill.toLowerCase().includes('persuasive') ||
      subSkill.toLowerCase().includes('expository') ||
      subSkill.toLowerCase().includes('imaginative') ||
      subSkill.toLowerCase().includes('creative') ||
      subSkill.toLowerCase().includes('descriptive')) {
    
    // NSW Selective Entry (50 points per writing task)
    if (testType === 'NSW Selective Entry (Year 7 Entry)') {
      return 50;
    }
    
    // VIC Selective Entry (30 points per writing task)
    if (testType === 'VIC Selective Entry (Year 9 Entry)') {
      return 30;
    }
    
    // Year 5 & 7 NAPLAN (48 points per writing task)
    if (testType === 'Year 5 NAPLAN' || testType === 'Year 7 NAPLAN') {
      return 48;
    }
    
    // EduTest Scholarship (15 points per writing task)
    if (testType === 'EduTest Scholarship (Year 7 Entry)') {
      return 15;
    }
    
    // ACER Scholarship (20 points per writing task)
    if (testType === 'ACER Scholarship (Year 7 Entry)') {
      return 20;
    }
  }
  
  // Default for multiple choice and other questions
  return 1;
}

/**
 * Update generation context with information about validation failures
 * to help avoid repeating the same mistakes
 */
function updateContextWithFailure(context: GenerationContext, validationResult: any): void {
  // Add patterns from failed questions to avoid in future generations
  if (validationResult.errors.some((error: string) => error.includes('mathematical'))) {
    // Track mathematical failures
    if (!context.questionsBySubSkill) {
      context.questionsBySubSkill = {};
    }
    // Could add specific failure patterns here
  }
  
  // Update last update timestamp
  context.lastUpdate = new Date().toISOString();
}

/**
 * Factory function to create validation config for different question types
 */
export function createValidationConfig(questionType: 'mathematics' | 'writing' | 'reading' | 'standard'): ValidationConfig {
  const baseConfig = {
    enableMathValidation: false,
    enableLogicalConsistency: true,
    enableCrossValidation: false,
    enableConfidenceAnalysis: true,
    maxRegenerationAttempts: 3,
    minimumConfidenceThreshold: 75
  };

  switch (questionType) {
    case 'mathematics':
      return {
        ...baseConfig,
        enableMathValidation: true,
        enableCrossValidation: true,
        minimumConfidenceThreshold: 85,
        maxRegenerationAttempts: 3
      };
    
    case 'writing':
      return {
        ...baseConfig,
        enableMathValidation: false,
        enableCrossValidation: false,
        minimumConfidenceThreshold: 70,
        maxRegenerationAttempts: 2
      };
    
    case 'reading':
      return {
        ...baseConfig,
        enableCrossValidation: true,
        minimumConfidenceThreshold: 80,
        maxRegenerationAttempts: 2
      };
    
    default:
      return baseConfig;
  }
}

/**
 * Batch generation with validation for multiple questions
 */
export async function generateQuestionsWithValidation(
  requests: EnhancedQuestionRequest[]
): Promise<EnhancedGenerationResult[]> {
  const results: EnhancedGenerationResult[] = [];
  
  console.log(`🔄 Starting batch generation with validation for ${requests.length} questions`);
  
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    console.log(`\n📋 Question ${i + 1}/${requests.length}: ${request.subSkill}`);
    
    try {
      const result = await generateQuestionWithValidation(request);
      results.push(result);
      
      // Brief pause between generations to avoid rate limiting
      if (i < requests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate question ${i + 1}:`, error);
      // Continue with next question rather than failing entire batch
    }
  }
  
  // Summary
  const successful = results.filter(r => r.validationResult.isValid).length;
  const needsReview = results.filter(r => r.validationResult.requiresManualReview).length;
  
  console.log(`\n📊 Batch Generation Summary:`);
  console.log(`   Total: ${results.length}/${requests.length} questions generated`);
  console.log(`   Successful: ${successful} questions`);
  console.log(`   Needs Review: ${needsReview} questions`);
  console.log(`   Average Confidence: ${Math.round(results.reduce((sum, r) => sum + r.validationResult.confidence, 0) / results.length)}%`);
  
  return results;
}