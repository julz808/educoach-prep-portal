/**
 * CURRICULUM-BASED PASSAGE SHARING SYSTEM
 * 
 * This module handles passage sharing according to curriculum requirements:
 * - Reading sections: Multiple questions per passage (based on curriculumData.ts ratios)
 * - Drill tests: 1:1 question to passage ratio (mini-passages)
 * - Difficulty assignment: Passage-level for reading sections, question-level for others
 */

import { supabase } from '../../integrations/supabase/client';
import { getTestSectionConfig, generateQuestionPlan } from './curriculumBasedConfiguration';

export interface PassageAssignment {
  passageId: string | null;
  shouldGeneratePassage: boolean;
  passageDifficulty: 1 | 2 | 3;
  wordCount: number;
  questionsFromThisPassage: number;
  isSharedPassage: boolean;
}

export interface QuestionContext {
  testType: string;
  sectionName: string;
  testMode: 'practice' | 'diagnostic' | 'drill';
  subSkill: string;
  difficulty: 1 | 2 | 3;
  questionIndex: number;
}

/**
 * Get passage assignment for a question based on curriculum requirements
 */
export async function getPassageAssignmentForQuestion(
  context: QuestionContext
): Promise<PassageAssignment> {
  const config = getTestSectionConfig(context.testType, context.sectionName);
  
  // Non-reading sections don't need passages
  if (!config.requiresPassages) {
    return {
      passageId: null,
      shouldGeneratePassage: false,
      passageDifficulty: context.difficulty,
      wordCount: 0,
      questionsFromThisPassage: 0,
      isSharedPassage: false
    };
  }
  
  // For reading sections, handle based on test mode
  if (context.testMode === 'drill') {
    return await handleDrillPassageAssignment(context, config);
  } else {
    return await handlePracticeOrDiagnosticPassageAssignment(context, config);
  }
}

/**
 * Handle passage assignment for drill tests (1:1 ratio)
 */
async function handleDrillPassageAssignment(
  context: QuestionContext,
  config: any
): Promise<PassageAssignment> {
  // For drills, each question gets its own mini-passage
  // Don't generate fake IDs - let the passage creation process handle UUID generation
  
  return {
    passageId: null, // Will be assigned when passage is actually created
    shouldGeneratePassage: true,
    passageDifficulty: context.difficulty,
    wordCount: 120, // Fixed for mini-passages
    questionsFromThisPassage: 1,
    isSharedPassage: false
  };
}

/**
 * Handle passage assignment for practice/diagnostic tests (multiple questions per passage)
 */
async function handlePracticeOrDiagnosticPassageAssignment(
  context: QuestionContext,
  config: any
): Promise<PassageAssignment> {
  // Check if we already have passages for this test mode and difficulty
  const existingPassages = await getExistingPassagesForTest(
    context.testType,
    context.sectionName,
    context.testMode,
    context.difficulty
  );
  
  // Calculate how many questions should be assigned to each passage
  const questionsPerPassage = config.questionsPerPassage;
  
  // Find a passage that needs more questions
  for (const passage of existingPassages) {
    const questionsFromThisPassage = await getQuestionCountForPassage(passage.id);
    
    if (questionsFromThisPassage < questionsPerPassage) {
      return {
        passageId: passage.id,
        shouldGeneratePassage: false,
        passageDifficulty: context.difficulty,
        wordCount: passage.word_count,
        questionsFromThisPassage: questionsFromThisPassage + 1,
        isSharedPassage: true
      };
    }
  }
  
  // If no existing passage can accommodate more questions, create a new one
  // Don't generate fake IDs - let the passage creation process handle UUID generation
  
  return {
    passageId: null, // Will be assigned when passage is actually created
    shouldGeneratePassage: true,
    passageDifficulty: context.difficulty,
    wordCount: config.wordsPerPassage,
    questionsFromThisPassage: 1,
    isSharedPassage: true
  };
}

/**
 * Get existing passages for a specific test configuration
 */
async function getExistingPassagesForTest(
  testType: string,
  sectionName: string,
  testMode: string,
  difficulty: number
): Promise<any[]> {
  const { data: passages, error } = await supabase
    .from('passages')
    .select('id, word_count, difficulty')
    .eq('test_type', testType)
    .eq('section_name', sectionName)
    .eq('difficulty', difficulty)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching existing passages:', error);
    return [];
  }
  
  return passages || [];
}

/**
 * Get count of questions for a specific passage
 */
async function getQuestionCountForPassage(passageId: string): Promise<number> {
  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('passage_id', passageId);
  
  if (error) {
    console.error('Error counting questions for passage:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Get count of passages for a specific test configuration
 */
async function getPassageCountForTest(
  testType: string,
  sectionName: string,
  testMode: string,
  difficulty: number
): Promise<number> {
  const { count, error } = await supabase
    .from('passages')
    .select('*', { count: 'exact', head: true })
    .eq('test_type', testType)
    .eq('section_name', sectionName)
    .eq('difficulty', difficulty);
  
  if (error) {
    console.error('Error counting passages for test:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Validate passage-to-question ratios for a test section
 */
export async function validatePassageQuestionRatios(
  testType: string,
  sectionName: string,
  testMode: string
): Promise<{
  isValid: boolean;
  errors: string[];
  actualRatios: Record<string, number>;
  expectedRatios: Record<string, number>;
}> {
  const config = getTestSectionConfig(testType, sectionName);
  const errors: string[] = [];
  const actualRatios: Record<string, number> = {};
  const expectedRatios: Record<string, number> = {};
  
  if (!config.requiresPassages) {
    return {
      isValid: true,
      errors: [],
      actualRatios: {},
      expectedRatios: {}
    };
  }
  
  // Get all passages for this test section
  const { data: passages, error: passageError } = await supabase
    .from('passages')
    .select('id, difficulty')
    .eq('test_type', testType)
    .eq('section_name', sectionName);
  
  if (passageError) {
    errors.push(`Error fetching passages: ${passageError.message}`);
    return {
      isValid: false,
      errors,
      actualRatios: {},
      expectedRatios: {}
    };
  }
  
  // Calculate actual ratios
  for (const passage of passages || []) {
    const questionCount = await getQuestionCountForPassage(passage.id);
    actualRatios[passage.id] = questionCount;
  }
  
  // Calculate expected ratios based on test mode
  if (testMode === 'drill') {
    expectedRatios['drill_mini_passages'] = 1; // 1:1 ratio for drills
    
    // Validate drill ratios
    for (const [passageId, questionCount] of Object.entries(actualRatios)) {
      if (questionCount !== 1) {
        errors.push(`Drill passage ${passageId} has ${questionCount} questions, expected 1`);
      }
    }
  } else {
    expectedRatios['practice_diagnostic_passages'] = config.questionsPerPassage;
    
    // Validate practice/diagnostic ratios
    for (const [passageId, questionCount] of Object.entries(actualRatios)) {
      if (questionCount > config.questionsPerPassage) {
        errors.push(`Passage ${passageId} has ${questionCount} questions, expected max ${config.questionsPerPassage}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    actualRatios,
    expectedRatios
  };
}

/**
 * Get comprehensive passage sharing report for a test type
 */
export async function getPassageSharingReport(
  testType: string,
  sectionName: string
): Promise<{
  testType: string;
  sectionName: string;
  config: any;
  passageStats: {
    totalPassages: number;
    passagesByDifficulty: Record<string, number>;
    passagesByTestMode: Record<string, number>;
  };
  questionStats: {
    totalQuestions: number;
    questionsByDifficulty: Record<string, number>;
    questionsByTestMode: Record<string, number>;
    questionsWithPassages: number;
    questionsWithoutPassages: number;
  };
  ratioValidation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}> {
  const config = getTestSectionConfig(testType, sectionName);
  
  // Get passage statistics
  const { data: passages } = await supabase
    .from('passages')
    .select('id, difficulty')
    .eq('test_type', testType)
    .eq('section_name', sectionName);
  
  // Get question statistics
  const { data: questions } = await supabase
    .from('questions')
    .select('id, difficulty, test_mode, passage_id')
    .eq('test_type', testType)
    .eq('section_name', sectionName);
  
  const passageStats = {
    totalPassages: passages?.length || 0,
    passagesByDifficulty: {},
    passagesByTestMode: {}
  };
  
  const questionStats = {
    totalQuestions: questions?.length || 0,
    questionsByDifficulty: {},
    questionsByTestMode: {},
    questionsWithPassages: 0,
    questionsWithoutPassages: 0
  };
  
  // Process passage statistics
  (passages || []).forEach(passage => {
    const difficulty = `difficulty_${passage.difficulty}`;
    passageStats.passagesByDifficulty[difficulty] = (passageStats.passagesByDifficulty[difficulty] || 0) + 1;
  });
  
  // Process question statistics
  (questions || []).forEach(question => {
    const difficulty = `difficulty_${question.difficulty}`;
    questionStats.questionsByDifficulty[difficulty] = (questionStats.questionsByDifficulty[difficulty] || 0) + 1;
    
    const testMode = question.test_mode;
    questionStats.questionsByTestMode[testMode] = (questionStats.questionsByTestMode[testMode] || 0) + 1;
    
    if (question.passage_id) {
      questionStats.questionsWithPassages++;
    } else {
      questionStats.questionsWithoutPassages++;
    }
  });
  
  // Validate ratios
  const ratioValidation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };
  
  if (config.requiresPassages && questionStats.questionsWithoutPassages > 0) {
    ratioValidation.errors.push(`${questionStats.questionsWithoutPassages} questions are missing passages`);
    ratioValidation.isValid = false;
  }
  
  if (!config.requiresPassages && questionStats.questionsWithPassages > 0) {
    ratioValidation.warnings.push(`${questionStats.questionsWithPassages} questions have unnecessary passages`);
  }
  
  return {
    testType,
    sectionName,
    config,
    passageStats,
    questionStats,
    ratioValidation
  };
}