/**
 * V2 Question Generation Engine - Main Entry Point
 *
 * Pattern-based question generation using curriculumData v2
 *
 * @example Basic Usage
 * ```typescript
 * import { generateSingleQuestion } from '@/engines/questionGeneration/v2';
 *
 * const result = await generateSingleQuestion(
 *   'EduTest Scholarship (Year 7 Entry)',
 *   'Verbal Reasoning',
 *   'Analogies',
 *   2,
 *   'practice_1'
 * );
 * ```
 *
 * @example Batch Generation
 * ```typescript
 * import { generateQuestionsV2 } from '@/engines/questionGeneration/v2';
 *
 * const requests = [
 *   { testType: 'EduTest...', section: 'Verbal Reasoning', subSkill: 'Analogies', difficulty: 1, testMode: 'practice_1' },
 *   { testType: 'EduTest...', section: 'Verbal Reasoning', subSkill: 'Analogies', difficulty: 2, testMode: 'practice_1' },
 * ];
 *
 * const { results, summary } = await generateQuestionsV2(requests);
 * ```
 *
 * @example Advanced Usage with Options
 * ```typescript
 * import { generateQuestionV2 } from '@/engines/questionGeneration/v2';
 *
 * const result = await generateQuestionV2(
 *   {
 *     testType: 'EduTest Scholarship (Year 7 Entry)',
 *     section: 'Verbal Reasoning',
 *     subSkill: 'Analogies',
 *     difficulty: 2,
 *     testMode: 'practice_1'
 *   },
 *   {
 *     skipValidation: false,
 *     skipStorage: false,
 *     strictValidation: true
 *   }
 * );
 * ```
 */

// ============================================================================
// CORE GENERATION
// ============================================================================

export {
  generateQuestionV2,
  generateQuestionsV2,
  generateSingleQuestion
} from './generator';

// ============================================================================
// SECTION & PASSAGE GENERATION (NEW)
// ============================================================================

export {
  generateSectionV2,
  type SectionGenerationResult
} from './sectionGenerator';

export {
  generatePassageV2,
  generatePassageWithQuestions,
  generateMultiplePassagesWithQuestions,
  type PassageWithQuestionsResult
} from './passageGenerator';

// ============================================================================
// EXAMPLE DISTRIBUTION (NEW)
// ============================================================================

export {
  createExampleDistributionPlan,
  generateExampleSequence,
  getNextExample,
  printDistributionPlan,
  createMultiSubSkillDistribution,
  type ExampleDistributionPlan
} from './exampleDistributor';

// ============================================================================
// DIFFICULTY DISTRIBUTION (NEW)
// ============================================================================

export {
  createDifficultyPlan,
  createSubSkillDifficultyPlan,
  printDifficultyPlan,
  getDifficultyForQuestion,
  type DifficultyStrategy,
  type DifficultyDistributionPlan
} from './difficultyDistributor';

// ============================================================================
// VISUAL GENERATION (NEW)
// ============================================================================

export {
  generateVisual,
  validateSVG,
  generateFallbackDescription,
  type VisualType,
  type VisualSpec,
  type VisualGenerationResult
} from './visualGenerator';

// ============================================================================
// VALIDATION
// ============================================================================

export {
  validateQuestionV2,
  quickValidate
} from './validator';

// ============================================================================
// STORAGE
// ============================================================================

export {
  storeQuestionV2,
  storePassageV2,
  storeQuestionsV2,
  storePassagesV2,
  fetchPassageV2,
  fetchQuestionsForPassageV2,
  getExistingPassagesV2,
  getExistingQuestionCountsV2,
  getRecentQuestionsForSubSkill,  // NEW: For diversity checking
  getQualityMetricsV2,
  validateDatabaseConnectionV2,
  getStorageStatsV2,
  printGenerationReportV2,
  clearTestDataV2
} from './supabaseStorage';

// ============================================================================
// PROMPT BUILDING
// ============================================================================

export {
  buildPromptWithExamples,
  buildWritingPrompt,
  buildPassagePrompt,
  estimateTokens
} from './promptBuilder';

// ============================================================================
// CONFIGURATION
// ============================================================================

export {
  CLAUDE_CONFIG,
  GENERATION_CONFIG,
  FEATURE_FLAGS,
  V2_ENGINE_VERSION,
  V2_ENGINE_NAME,
  getYearLevel,
  getProductType,
  getMaxPoints,
  getDifficultyDescriptor
} from './config';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Request types
  GenerationRequestV2,
  BatchGenerationRequestV2,

  // Question & Passage types
  QuestionV2,
  PassageV2,

  // Metadata types
  GenerationMetadata,
  PassageGenerationMetadata,
  ValidationMetadata,

  // Prompt building types
  PromptContext,
  BuiltPrompt,

  // Validation types
  ValidationOptions,
  ValidationResult,

  // Result types
  GenerationResultV2,
  BatchGenerationResultV2,

  // Claude types
  ClaudeResponse,
  ClaudeConfig,

  // Test orchestration types
  TestStructure,
  SectionStructure
} from './types';

// ============================================================================
// VERSION INFO
// ============================================================================

import { V2_ENGINE_VERSION, V2_ENGINE_NAME } from './config';

export const ENGINE_INFO = {
  version: V2_ENGINE_VERSION,
  name: V2_ENGINE_NAME,
  features: [
    '✅ Pattern-based generation using curriculumData v2',
    '✅ Section-level orchestration (23 sections across 6 test types)',
    '✅ Balanced example distribution within sub-skills',
    '✅ 4 difficulty distribution strategies (single, balanced, weighted, progressive)',
    '✅ 3 generation strategies (balanced, passage-based, hybrid)',
    '✅ SVG + HTML table visual generation (geometry, charts, graphs, diagrams)',
    '✅ Passage-aware question generation with mini-passages for drills',
    '✅ Gap detection — only generates missing questions/passages',
    '✅ Topic diversity — avoids repeating passage topics from DB history',
    '✅ Year-level calibrated difficulty (Year 5 / Year 7 / Year 9)',
    '✅ Correctness verification via Haiku 4',
    '✅ Section-aware duplicate detection via Haiku 4',
    '✅ Quality scoring (0-100)',
    '✅ Comprehensive metadata tracking'
  ],
  targets: {
    errorRate: '<2%',
    qualityScore: '>85/100',
    costPerQuestion: '<$0.022'
  }
} as const;

// ============================================================================
// QUICK START HELPER
// ============================================================================

/**
 * Quick start helper - prints engine info and validates connection
 */
export async function initializeV2Engine(): Promise<{
  engineInfo: typeof ENGINE_INFO;
  databaseConnected: boolean;
  errors: string[];
}> {
  const { validateDatabaseConnectionV2 } = await import('./supabaseStorage');

  console.log('\n' + '='.repeat(80));
  console.log(`🚀 ${ENGINE_INFO.name} v${ENGINE_INFO.version}`);
  console.log('='.repeat(80));
  console.log('\n📋 Features:');
  ENGINE_INFO.features.forEach(feature => console.log(`   ${feature}`));
  console.log('\n🎯 Targets:');
  Object.entries(ENGINE_INFO.targets).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  console.log('\n' + '='.repeat(80));

  // Validate database connection
  console.log('\n🔍 Validating database connection...');
  const dbValidation = await validateDatabaseConnectionV2();

  if (dbValidation.valid) {
    console.log('✅ Database connection successful');
    console.log('   - questions_v2 table: OK');
    console.log('   - passages_v2 table: OK');
  } else {
    console.error('❌ Database connection failed:');
    dbValidation.errors.forEach(error => console.error(`   - ${error}`));
  }

  console.log('\n' + '='.repeat(80) + '\n');

  return {
    engineInfo: ENGINE_INFO,
    databaseConnected: dbValidation.valid,
    errors: dbValidation.errors
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import {
  generateQuestionV2 as _generateQuestionV2,
  generateQuestionsV2 as _generateQuestionsV2,
  generateSingleQuestion as _generateSingleQuestion
} from './generator';

import {
  validateQuestionV2 as _validateQuestionV2,
  quickValidate as _quickValidate
} from './validator';

import {
  storeQuestionV2 as _storeQuestionV2,
  storePassageV2 as _storePassageV2,
  getStorageStatsV2 as _getStorageStatsV2,
  printGenerationReportV2 as _printGenerationReportV2
} from './supabaseStorage';

export default {
  // Core functions
  generateQuestionV2: _generateQuestionV2,
  generateQuestionsV2: _generateQuestionsV2,
  generateSingleQuestion: _generateSingleQuestion,

  // Validation
  validateQuestionV2: _validateQuestionV2,
  quickValidate: _quickValidate,

  // Storage
  storeQuestionV2: _storeQuestionV2,
  storePassageV2: _storePassageV2,
  getStorageStatsV2: _getStorageStatsV2,
  printGenerationReportV2: _printGenerationReportV2,

  // Initialization
  initializeV2Engine,

  // Info
  ENGINE_INFO,
  version: V2_ENGINE_VERSION
};
