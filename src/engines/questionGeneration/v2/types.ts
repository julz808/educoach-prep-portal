/**
 * V2 Question Generation Engine - Type Definitions
 * Uses curriculumData v2 for pattern-based generation
 */

import type { SubSkillExampleData, SubSkillExample, SubSkillPattern } from '@/data/curriculumData_v2/types';

// ============================================================================
// GENERATION REQUEST TYPES
// ============================================================================

export interface GenerationRequestV2 {
  testType: string;
  section: string;
  subSkill: string;
  difficulty: number;
  testMode: string; // 'practice_1', 'practice_2', 'drill', 'diagnostic'
  passageId?: string; // Optional passage linking
  questionOrder?: number; // Position in test
}

export interface BatchGenerationRequestV2 {
  testType: string;
  testMode: string;
  sections?: string[]; // If not provided, generates all sections
  questionCountOverride?: number; // Override TEST_STRUCTURES count
}

// ============================================================================
// QUESTION & PASSAGE TYPES (V2 Enhanced)
// ============================================================================

export interface QuestionV2 {
  // Core content
  question_text: string;
  answer_options: string[] | null;
  correct_answer: string | null;
  solution: string;

  // Test identification
  test_type: string;
  test_mode: string;
  section_name: string;
  sub_skill: string;
  sub_skill_id?: string;

  // Metadata
  difficulty: number;
  response_type: 'multiple_choice' | 'extended_response';
  max_points: number;
  year_level: number;
  product_type: string;
  question_order?: number;
  australian_context: boolean;

  // Visual content
  has_visual: boolean;
  visual_type?: string | null;
  visual_data?: any;
  visual_svg?: string | null;

  // Passage linking
  passage_id?: string | null;

  // V2 enhancements
  curriculum_source: string; // e.g., "EduTest Scholarship (Year 7 Entry) - Verbal Reasoning - Analogies"
  generation_method: 'pattern-based' | 'example-inspired';
  quality_score?: number; // 0-100
  validated_by?: string;
  error_rate?: number;

  // Tracking
  generated_by: string;
  curriculum_aligned: boolean;
  generation_metadata: GenerationMetadata;
  validation_metadata?: ValidationMetadata;

  // Database fields (populated after storage)
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PassageV2 {
  // Core content
  title: string;
  content: string;
  passage_type: 'narrative' | 'informational' | 'persuasive' | 'poetry' | 'visual' | 'multimodal' | 'micro' | 'medium' | 'long';
  word_count: number;

  // Test identification
  test_type: string;
  section_name: string;
  year_level: number; // Derived from test_type via getYearLevel()

  // Metadata
  difficulty: number;
  metadata?: {
    main_themes?: string[];
    key_characters?: string[];
    setting?: string;
    potential_question_topics?: string[];
    generation_timestamp?: string;
  };

  // Database fields
  id: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// METADATA TYPES
// ============================================================================

export interface GenerationMetadata {
  generation_timestamp: string;
  attempt_number: number;
  prompt_tokens?: number;
  response_tokens?: number;
  response_time_ms?: number;
  model: string;
  temperature: number;
  examples_used: number; // How many example questions were in prompt
  pattern_type: string; // Which pattern was used
}

export interface PassageGenerationMetadata {
  generation_timestamp: string;
  attempt_number: number;
  model: string;
  target_word_count: number;
  actual_word_count: number;
  passage_type: 'narrative' | 'informational' | 'persuasive' | 'poetry' | 'visual' | 'multimodal' | 'micro' | 'medium' | 'long';
  questions_allocated?: number; // How many questions will use this passage
}

export interface ValidationMetadata {
  validation_timestamp: string;
  hallucination_check: {
    passed: boolean;
    patterns_checked: number;
    issues_found: string[];
  };
  answer_verification: {
    passed: boolean;
    method: string; // 'haiku-verification' | 'manual' | 'skipped'
    confidence: number;
    reasoning?: string;
  };
  quality_checks: {
    style_match: number; // 0-100
    difficulty_match: number; // 0-100
    curriculum_alignment: number; // 0-100
  };
  overall_quality_score: number; // 0-100
}

// ============================================================================
// PROMPT BUILDING TYPES
// ============================================================================

export interface PromptContext {
  testType: string;
  section: string;
  subSkill: string;
  difficulty: number;
  subSkillData: SubSkillExampleData;
  examples: SubSkillExample[];
  pattern: SubSkillPattern;
  passage?: PassageV2;  // Include passage for reading comprehension questions
  passageId?: string;   // Passage ID if question is linked to a passage
  recentQuestions?: Array<{  // Last 20 DB questions — diversity context for prompt + duplicate check
    question_text: string;
    answer_options: string[];
    correct_answer: string;
    solution: string;
    test_mode: string;
    created_at: string;
  }>;
  previousFailures?: Array<{  // Previous failed attempts in this generation session (for learning/pivoting)
    question: string;
    reason: string;
  }>;
}

export interface BuiltPrompt {
  prompt: string;
  metadata: {
    examples_included: number;
    prompt_length: number;
    pattern_type: string;
    difficulty_guidance: string;
  };
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationOptions {
  // Validator always runs: structure check, correctness (Haiku), duplicate (Haiku)
  // These flags are reserved for future per-check control but currently unused.
  strictMode?: boolean; // If true, fail on warnings too
}

export interface ValidationResult {
  isValid: boolean;
  qualityScore: number; // 0-100
  errors: string[];
  warnings: string[];
  metadata: ValidationMetadata;
}

// ============================================================================
// GENERATION RESULT TYPES
// ============================================================================

export interface GenerationResultV2 {
  success: boolean;
  question?: QuestionV2;
  error?: string;
  attempts: number;
  timeMs: number;
  cost: number;
  validationResult?: ValidationResult;
}

export interface BatchGenerationResultV2 {
  success: boolean;
  questionsGenerated: number;
  passagesGenerated: number;
  errors: string[];
  warnings: string[];
  duration: number;
  totalCost: number;
  averageQualityScore: number;

  details: {
    questionsBySection: Record<string, number>;
    questionsBySubSkill: Record<string, number>;
    questionsByDifficulty: Record<number, number>;
    passagesBySection: Record<string, number>;
  };
}

// ============================================================================
// CLAUDE API TYPES
// ============================================================================

export interface ClaudeResponse {
  question: QuestionV2;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
}

export interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  maxRetries: number;
}

// ============================================================================
// VISUAL GENERATION TYPES
// ============================================================================

// Re-exported from visualGenerator.ts — VisualSpec describes what to draw (input to generateVisual)
export type { VisualType, VisualSpec, VisualGenerationResult } from './visualGenerator';

// ============================================================================
// TEST ORCHESTRATION TYPES
// ============================================================================

export interface TestStructure {
  testType: string;
  sections: Record<string, SectionStructure>;
  totalQuestions: number;
}

export interface SectionStructure {
  sectionName: string;
  totalQuestions: number;
  passages?: number;
  wordsPerPassage?: number;
  subSkills: string[];
  questionsPerSubSkill: number;
  difficultyDistribution: Record<number, number>; // difficulty -> count
}

// ============================================================================
// EXPORT TYPES FROM CURRICULUMDATA
// ============================================================================

export type { SubSkillExampleData, SubSkillExample, SubSkillPattern };
