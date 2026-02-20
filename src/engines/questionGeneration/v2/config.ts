/**
 * V2 Question Generation Engine - Configuration
 * Central configuration for the v2 engine
 */

import type { ClaudeConfig } from './types';

// ============================================================================
// CLAUDE API CONFIGURATION
// ============================================================================

export const CLAUDE_CONFIG: ClaudeConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
  model: 'claude-sonnet-4-5-20250929', // Sonnet 4.5
  maxTokens: 2000,
  temperature: 0.8, // Creative but not too random
  maxRetries: 3
};

// ============================================================================
// GENERATION CONFIGURATION
// ============================================================================

export const GENERATION_CONFIG = {
  // How many examples to include in prompt
  maxExamplesInPrompt: 2,

  // Retry configuration
  maxGenerationAttempts: 3,
  retryDelayMs: 1000,

  // Validation thresholds
  minQualityScore: 70, // Minimum acceptable quality score
  minConfidenceScore: 85, // Minimum confidence for answer verification

  // Cost tracking (Sonnet 4.5 pricing: ~$3/1M input, ~$15/1M output)
  costPerInputToken: 3 / 1_000_000,
  costPerOutputToken: 15 / 1_000_000,
  // Haiku 4 validation (correctness + duplicate) costs ~$0.0002 per question — added flat in generator

  // Visual generation
  enableVisuals: true,
  visualTimeout: 60000, // 60 seconds timeout for visual generation (Opus 4.5 can take 20-40s)

  // Passage generation
  passageGenerationEnabled: true,
  questionsPerPassage: 5, // Average questions per passage

  // Logging
  verboseLogging: true,
  logPrompts: false // Set to true for debugging
};


// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

export const DATABASE_CONFIG = {
  // Table names
  questionsTable: 'questions_v2',
  passagesTable: 'passages_v2',
  subSkillsTable: 'sub_skills_v2',

  // Batch size for bulk operations
  batchInsertSize: 50,

  // Storage options
  storeGenerationMetadata: true,
  storeValidationMetadata: true,
  trackErrorRates: true
};

// ============================================================================
// TEST TYPE MAPPINGS
// ============================================================================

// Map test types to year levels
export const TEST_TYPE_YEAR_LEVELS: Record<string, number> = {
  'Year 5 NAPLAN': 5,
  'Year 7 NAPLAN': 7,
  'NSW Selective Entry (Year 7 Entry)': 7,
  'ACER Scholarship (Year 7 Entry)': 7,
  'EduTest Scholarship (Year 7 Entry)': 7,
  'VIC Selective Entry (Year 9 Entry)': 9
};

// Map test types to product types
export const TEST_TYPE_PRODUCTS: Record<string, string> = {
  'Year 5 NAPLAN': 'Year 5 NAPLAN',
  'Year 7 NAPLAN': 'Year 7 NAPLAN',
  'NSW Selective Entry (Year 7 Entry)': 'NSW Selective Entry (Year 7 Entry)',
  'ACER Scholarship (Year 7 Entry)': 'ACER Scholarship (Year 7 Entry)',
  'EduTest Scholarship (Year 7 Entry)': 'EduTest Scholarship (Year 7 Entry)',
  'VIC Selective Entry (Year 9 Entry)': 'VIC Selective Entry (Year 9 Entry)'
};

// ============================================================================
// MAX POINTS CONFIGURATION (from v1)
// ============================================================================

export const MAX_POINTS_CONFIG: Record<string, number> = {
  // NSW Selective Entry
  'NSW Selective Entry (Year 7 Entry)_writing': 50,

  // VIC Selective Entry
  'VIC Selective Entry (Year 9 Entry)_writing': 30,

  // NAPLAN
  'Year 5 NAPLAN_writing': 48,
  'Year 7 NAPLAN_writing': 48,

  // EduTest Scholarship
  'EduTest Scholarship (Year 7 Entry)_writing': 15,

  // ACER Scholarship
  'ACER Scholarship (Year 7 Entry)_writing': 20,

  // Default for multiple choice
  'default': 1
};

// Helper function to get max points
export function getMaxPoints(
  testType: string,
  subSkill: string,
  responseType: 'multiple_choice' | 'extended_response'
): number {
  if (responseType === 'extended_response' ||
      subSkill.toLowerCase().includes('writing') ||
      subSkill.toLowerCase().includes('narrative') ||
      subSkill.toLowerCase().includes('persuasive')) {

    const key = `${testType}_writing`;
    return MAX_POINTS_CONFIG[key] || MAX_POINTS_CONFIG['default'];
  }

  return MAX_POINTS_CONFIG['default'];
}

// ============================================================================
// DIFFICULTY DESCRIPTORS
// ============================================================================

export const DIFFICULTY_DESCRIPTORS: Record<number, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
  4: 'Very Hard',
  5: 'Extremely Hard',
  6: 'Expert Level'
};

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function getYearLevel(testType: string): number {
  return TEST_TYPE_YEAR_LEVELS[testType] || 7;
}

export function getProductType(testType: string): string {
  return TEST_TYPE_PRODUCTS[testType] || testType;
}

export function getDifficultyDescriptor(difficulty: number): string {
  return DIFFICULTY_DESCRIPTORS[difficulty] || 'Unknown';
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  enableVisualGeneration: true,
  enablePassageSharing: true,

  // Debugging flags
  logPrompts: false,
  logValidation: true,
  logStorage: true,

  // Cost control
  maxCostPerQuestion: 0.05, // $0.05 max per question
  stopOnHighCost: false // Don't stop, just warn
};

// ============================================================================
// VERSION
// ============================================================================

export const V2_ENGINE_VERSION = '2.2.0';
export const V2_ENGINE_NAME = 'EduCoach V2 Pattern-Based Generator';
