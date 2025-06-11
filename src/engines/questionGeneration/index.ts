// ============================================================================
// QUESTION GENERATION ENGINE - MAIN ENTRY POINT
// ============================================================================
// Unified API for all question and passage generation functionality
// This is the single source of truth for all generation operations

import type { BatchGenerationRequest, BatchGenerationResult } from './types.ts';

// Core generation functions
export { 
  generatePracticeTest,
  getAuthoritativeTestStructure,
  validateTestStructure,
  getAvailableTestTypes,
  getTestTypeInfo
} from './batchGeneration.ts';

// Also import for direct use
import { generatePracticeTest, getAvailableTestTypes } from './batchGeneration.ts';

// Passage generation
export {
  generatePassage,
  generatePassages,
  getPassageRequirements,
  estimatePassageGenerationTime,
  createPassagePreview,
  getPassageComplexity
} from './passageGeneration.ts';

// Question generation 
export {
  generateQuestion
} from './questionGeneration.ts';

// Storage operations
export {
  storePassage,
  storeQuestion,
  storePassages,
  storeQuestions,
  validateDatabaseConnection,
  getStorageStats,
  clearTestData
} from './supabaseStorage.ts';

// Claude API and prompts
export {
  buildQuestionPrompt,
  buildPassagePrompt,
  callClaudeAPI,
  callClaudeAPIWithRetry,
  parseClaudeResponse,
  getClaudeUsageStats,
  validateClaudeConfig,
  estimateTokenCount
} from './claudePrompts.ts';

// Re-export specific types needed by external scripts
export type {
  BatchGenerationRequest,
  BatchGenerationResult,
  SectionGenerationConfig,
  TestStructureInfo
} from './types.ts';

/**
 * Main engine API for generating complete practice tests
 * This is the primary function that scripts should call
 */
export async function generateCompleteTest(
  testType: string,
  testMode: string,
  difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
): Promise<BatchGenerationResult> {
  const request: BatchGenerationRequest = {
    testType,
    testMode,
    difficulty
  };
  
  return await generatePracticeTest(request);
}

/**
 * Get engine status and capabilities
 */
export async function getEngineInfo() {
  return {
    version: '1.0.0',
    capabilities: [
      'Practice test generation',
      'Passage generation with question linking',
      'Multiple test types support',
      'Automatic storage to Supabase',
      'Difficulty calibration',
      'Visual question support',
      'Writing section support'
    ],
    supportedTestTypes: getAvailableTestTypes(),
    supportedDifficulties: ['Easy', 'Medium', 'Hard'],
    supportedModes: ['practice_1', 'practice_2', 'practice_3', 'drill', 'diagnostic']
  };
} 