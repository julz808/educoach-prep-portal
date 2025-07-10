/**
 * CURRICULUM-BASED QUESTION GENERATION CONFIGURATION
 * 
 * This module provides test-specific configuration based on curriculumData.ts
 * Ensures proper passage-to-question ratios, difficulty assignments, and test requirements
 */

import { TEST_STRUCTURES } from '../../data/curriculumData';

export interface TestSectionConfig {
  sectionName: string;
  testType: string;
  requiresPassages: boolean;
  isReadingSection: boolean;
  isWritingSection: boolean;
  isMathSection: boolean;
  
  // For reading sections
  totalQuestions: number;
  totalPassages: number;
  questionsPerPassage: number;
  wordsPerPassage: number;
  
  // Test mode specific configurations
  practiceTestConfig: {
    passageCount: number;
    questionsPerPassage: number;
    passageDifficulties: PassageDifficultyDistribution;
  };
  
  diagnosticTestConfig: {
    passageCount: number;
    questionsPerPassage: number;
    passageDifficulties: PassageDifficultyDistribution;
  };
  
  drillTestConfig: {
    questionsPerSubSkill: number;
    questionsPerDifficulty: number;
    passageType: 'mini' | 'none';
  };
}

export interface PassageDifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface QuestionGenerationPlan {
  testType: string;
  sectionName: string;
  testMode: 'practice' | 'diagnostic' | 'drill';
  
  // Passage-level planning
  passagesNeeded: PassageGenerationPlan[];
  
  // Question-level planning
  questionsNeeded: QuestionGenerationPlan[];
}

export interface PassageGenerationPlan {
  passageId: string;
  difficulty: 1 | 2 | 3;
  wordCount: number;
  questionsFromThisPassage: number;
  subSkillsToTest: string[];
}

export interface QuestionGenerationPlan {
  passageId?: string;
  subSkill: string;
  difficulty: 1 | 2 | 3;
  questionType: 'multiple_choice' | 'extended_response';
}

/**
 * Get test section configuration based on curriculum data
 */
export function getTestSectionConfig(testType: string, sectionName: string): TestSectionConfig {
  const testStructure = TEST_STRUCTURES[testType];
  if (!testStructure) {
    throw new Error(`Test type not found in curriculum data: ${testType}`);
  }
  
  const sectionData = testStructure[sectionName];
  if (!sectionData) {
    throw new Error(`Section not found in curriculum data: ${sectionName} for ${testType}`);
  }
  
  const isReadingSection = isReadingComprehensionSection(sectionName);
  const isWritingSection = isWritingExpressionSection(sectionName);
  const isMathSection = isMathematicalSection(sectionName);
  
  const requiresPassages = sectionData.passages > 0;
  const totalQuestions = sectionData.questions;
  const totalPassages = sectionData.passages;
  const questionsPerPassage = totalPassages > 0 ? Math.ceil(totalQuestions / totalPassages) : 0;
  const wordsPerPassage = sectionData.words_per_passage;
  
  // Calculate difficulty distribution for passages
  const passageDifficulties = calculatePassageDifficultyDistribution(totalPassages);
  
  return {
    sectionName,
    testType,
    requiresPassages,
    isReadingSection,
    isWritingSection,
    isMathSection,
    totalQuestions,
    totalPassages,
    questionsPerPassage,
    wordsPerPassage,
    
    practiceTestConfig: {
      passageCount: totalPassages,
      questionsPerPassage,
      passageDifficulties
    },
    
    diagnosticTestConfig: {
      passageCount: totalPassages,
      questionsPerPassage,
      passageDifficulties
    },
    
    drillTestConfig: {
      questionsPerSubSkill: isWritingSection ? 6 : 30,
      questionsPerDifficulty: isWritingSection ? 2 : 10,
      passageType: isReadingSection ? 'mini' : 'none'
    }
  };
}

/**
 * Calculate passage difficulty distribution
 */
function calculatePassageDifficultyDistribution(totalPassages: number): PassageDifficultyDistribution {
  if (totalPassages === 0) {
    return { easy: 0, medium: 0, hard: 0 };
  }
  
  // Distribute passages evenly across difficulties
  const easyCount = Math.ceil(totalPassages / 3);
  const hardCount = Math.floor(totalPassages / 3);
  const mediumCount = totalPassages - easyCount - hardCount;
  
  return {
    easy: easyCount,
    medium: mediumCount,
    hard: hardCount
  };
}

/**
 * Generate a complete question generation plan for a test section
 */
export function generateQuestionPlan(
  testType: string,
  sectionName: string,
  testMode: 'practice_1' | 'practice_2' | 'practice_3' | 'practice_4' | 'practice_5' | 'diagnostic' | 'drill',
  subSkills: string[]
): QuestionGenerationPlan {
  const config = getTestSectionConfig(testType, sectionName);
  
  if (testMode === 'drill') {
    return generateDrillPlan(config, subSkills);
  } else {
    // Handle all practice tests and diagnostic the same way
    return generatePracticeOrDiagnosticPlan(config, testMode, subSkills);
  }
}

/**
 * Generate drill test plan (1:1 question to passage ratio)
 */
function generateDrillPlan(config: TestSectionConfig, subSkills: string[]): QuestionGenerationPlan {
  const passagesNeeded: PassageGenerationPlan[] = [];
  const questionsNeeded: QuestionGenerationPlan[] = [];
  
  subSkills.forEach(subSkill => {
    for (let difficulty = 1; difficulty <= 3; difficulty++) {
      const questionsForThisDifficulty = config.drillTestConfig.questionsPerDifficulty;
      
      for (let i = 0; i < questionsForThisDifficulty; i++) {
        const passageId = `${config.testType}_${config.sectionName}_drill_${subSkill}_${difficulty}_${i + 1}`;
        
        if (config.requiresPassages) {
          passagesNeeded.push({
            passageId,
            difficulty: difficulty as 1 | 2 | 3,
            wordCount: 120, // Fixed for drill mini-passages
            questionsFromThisPassage: 1,
            subSkillsToTest: [subSkill]
          });
        }
        
        questionsNeeded.push({
          passageId: config.requiresPassages ? passageId : undefined,
          subSkill,
          difficulty: difficulty as 1 | 2 | 3,
          questionType: config.isWritingSection ? 'extended_response' : 'multiple_choice'
        });
      }
    }
  });
  
  return {
    testType: config.testType,
    sectionName: config.sectionName,
    testMode: 'drill',
    passagesNeeded,
    questionsNeeded
  };
}

/**
 * Generate practice or diagnostic test plan (multiple questions per passage)
 */
function generatePracticeOrDiagnosticPlan(
  config: TestSectionConfig,
  testMode: 'practice_1' | 'practice_2' | 'practice_3' | 'practice_4' | 'practice_5' | 'diagnostic',
  subSkills: string[]
): QuestionGenerationPlan {
  const passagesNeeded: PassageGenerationPlan[] = [];
  const questionsNeeded: QuestionGenerationPlan[] = [];
  
  if (config.requiresPassages) {
    const testConfig = testMode === 'practice' ? config.practiceTestConfig : config.diagnosticTestConfig;
    
    // Generate passages with even difficulty distribution
    let passageIndex = 0;
    
    // Easy passages
    for (let i = 0; i < testConfig.passageDifficulties.easy; i++) {
      const passageId = `${config.testType}_${config.sectionName}_${testMode}_passage_${passageIndex + 1}`;
      passagesNeeded.push({
        passageId,
        difficulty: 1,
        wordCount: config.wordsPerPassage,
        questionsFromThisPassage: testConfig.questionsPerPassage,
        subSkillsToTest: subSkills
      });
      passageIndex++;
    }
    
    // Medium passages
    for (let i = 0; i < testConfig.passageDifficulties.medium; i++) {
      const passageId = `${config.testType}_${config.sectionName}_${testMode}_passage_${passageIndex + 1}`;
      passagesNeeded.push({
        passageId,
        difficulty: 2,
        wordCount: config.wordsPerPassage,
        questionsFromThisPassage: testConfig.questionsPerPassage,
        subSkillsToTest: subSkills
      });
      passageIndex++;
    }
    
    // Hard passages
    for (let i = 0; i < testConfig.passageDifficulties.hard; i++) {
      const passageId = `${config.testType}_${config.sectionName}_${testMode}_passage_${passageIndex + 1}`;
      passagesNeeded.push({
        passageId,
        difficulty: 3,
        wordCount: config.wordsPerPassage,
        questionsFromThisPassage: testConfig.questionsPerPassage,
        subSkillsToTest: subSkills
      });
      passageIndex++;
    }
    
    // Generate questions for each passage
    passagesNeeded.forEach(passage => {
      const questionsPerSubSkill = Math.ceil(passage.questionsFromThisPassage / subSkills.length);
      
      subSkills.forEach(subSkill => {
        for (let i = 0; i < questionsPerSubSkill; i++) {
          questionsNeeded.push({
            passageId: passage.passageId,
            subSkill,
            difficulty: passage.difficulty,
            questionType: config.isWritingSection ? 'extended_response' : 'multiple_choice'
          });
        }
      });
    });
  } else {
    // Non-reading sections (no passages needed)
    const questionsPerSubSkill = Math.ceil(config.totalQuestions / subSkills.length);
    const questionsPerDifficulty = Math.ceil(questionsPerSubSkill / 3);
    
    subSkills.forEach(subSkill => {
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        for (let i = 0; i < questionsPerDifficulty; i++) {
          questionsNeeded.push({
            subSkill,
            difficulty: difficulty as 1 | 2 | 3,
            questionType: config.isWritingSection ? 'extended_response' : 'multiple_choice'
          });
        }
      }
    });
  }
  
  return {
    testType: config.testType,
    sectionName: config.sectionName,
    testMode,
    passagesNeeded,
    questionsNeeded
  };
}

/**
 * Check if a section requires reading comprehension passages
 */
function isReadingComprehensionSection(sectionName: string): boolean {
  const readingSectionNames = [
    'reading',
    'reading comprehension',
    'reading reasoning',
    'humanities'
  ];
  
  return readingSectionNames.some(name => 
    sectionName.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Check if a section is a writing section
 */
function isWritingExpressionSection(sectionName: string): boolean {
  const writingSectionNames = [
    'writing',
    'written expression',
    'written response'
  ];
  
  return writingSectionNames.some(name => 
    sectionName.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Check if a section is mathematical
 */
function isMathematicalSection(sectionName: string): boolean {
  const mathSectionNames = [
    'mathematics',
    'mathematical reasoning',
    'numeracy',
    'numerical reasoning',
    'quantitative',
    'general ability - quantitative'
  ];
  
  return mathSectionNames.some(name => 
    sectionName.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Get all test types from curriculum data
 */
export function getAllTestTypes(): string[] {
  return Object.keys(TEST_STRUCTURES);
}

/**
 * Get all sections for a test type
 */
export function getTestSections(testType: string): string[] {
  const testStructure = TEST_STRUCTURES[testType];
  if (!testStructure) {
    throw new Error(`Test type not found: ${testType}`);
  }
  
  return Object.keys(testStructure);
}

/**
 * Validate that a test configuration matches curriculum requirements
 */
export function validateTestConfiguration(testType: string, sectionName: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  try {
    const config = getTestSectionConfig(testType, sectionName);
    
    // Validate passage-to-question ratios
    if (config.requiresPassages && config.questionsPerPassage <= 0) {
      errors.push(`Invalid questions per passage ratio: ${config.questionsPerPassage}`);
    }
    
    // Validate difficulty distribution
    const totalPassages = config.practiceTestConfig.passageDifficulties.easy + 
                         config.practiceTestConfig.passageDifficulties.medium + 
                         config.practiceTestConfig.passageDifficulties.hard;
    
    if (config.requiresPassages && totalPassages !== config.totalPassages) {
      errors.push(`Difficulty distribution doesn't match total passages: ${totalPassages} vs ${config.totalPassages}`);
    }
    
  } catch (error) {
    errors.push(`Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get summary of all test configurations
 */
export function getTestConfigurationSummary(): Record<string, Record<string, any>> {
  const summary: Record<string, Record<string, any>> = {};
  
  getAllTestTypes().forEach(testType => {
    summary[testType] = {};
    
    getTestSections(testType).forEach(sectionName => {
      try {
        const config = getTestSectionConfig(testType, sectionName);
        summary[testType][sectionName] = {
          requiresPassages: config.requiresPassages,
          totalQuestions: config.totalQuestions,
          totalPassages: config.totalPassages,
          questionsPerPassage: config.questionsPerPassage,
          wordsPerPassage: config.wordsPerPassage,
          isReadingSection: config.isReadingSection,
          isWritingSection: config.isWritingSection,
          isMathSection: config.isMathSection
        };
      } catch (error) {
        summary[testType][sectionName] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  });
  
  return summary;
}