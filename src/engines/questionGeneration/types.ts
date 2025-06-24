// ============================================================================
// QUESTION GENERATION ENGINE TYPES
// ============================================================================

// Core request interfaces
export interface QuestionGenerationRequest {
  testType: string;
  sectionName: string;
  questionCount: number;
  difficultyRange: {
    min: number;
    max: number;
  };
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  subSkills?: string[];
  includeVisuals?: boolean;
  passageLength?: number;
  contextualLearning?: boolean;
  apiConfig: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  batchSize?: number;
  onProgress?: (progress: GenerationProgress) => void;
  testMode: 'practice' | 'diagnostic' | 'drill';
  sections?: string[];
  practiceTestNumber?: number; // For practice tests (1-5)
  sessionId?: string;
  resumeFromState?: string;
}

// Response types for questions
export type ResponseType = 'multiple_choice' | 'extended_response';

// Request for generating a single question
export interface SingleQuestionRequest {
  testType: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  responseType: ResponseType;
  generateVisual: boolean;
  generationContext: GenerationContext;
  passageContent?: string;
}

export interface PassageGenerationRequest {
  testType: string;
  sectionName: string;
  wordCount: number;
  difficulty: number;
  passageType: 'narrative' | 'informational' | 'persuasive';
  generationContext: GenerationContext;
}

// Generation context for managing state
export interface GenerationContext {
  sessionId?: string;
  testType?: string;
  usedTopics: Set<string>;
  usedNames: Set<string>;
  usedLocations: Set<string>;
  usedScenarios: Set<string>;
  passageBank?: GeneratedPassage[];
  questionBank?: GeneratedQuestion[];
  generatedQuestions?: GeneratedQuestion[];
  currentDifficulty?: number;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  visualsGenerated?: number;
  lastUpdate?: string;
}

// Generated content interfaces
export interface GeneratedQuestion {
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
  response_type: ResponseType;
  passage_reference: boolean;
  australian_context: boolean;
  max_points: number; // NEW: Maximum points for this question (1 for MC, 15-50 for writing)
  product_type?: string; // NEW: Product type derived from test_type
  question_order?: number; // NEW: Sequential order within section
  generation_metadata: {
    generation_timestamp: string;
    attempt_number?: number;
    prompt_length?: number;
    response_time_ms?: number;
  };
  created_at?: string;
}

// Passage types
export type PassageType = 'narrative' | 'informational' | 'persuasive';

// Generated passage structure
export interface GeneratedPassage {
  id?: string;
  test_type: string;
  year_level: number;
  section_name: string;
  title: string;
  content: string;
  passage_type: PassageType;
  word_count: number;
  australian_context: boolean;
  difficulty: number;
  main_themes: string[];
  key_characters: string[];
  setting: string;
  potential_question_topics: string[];
  generation_metadata: {
    test_type: string;
    section_name: string;
    difficulty: number;
    passage_type: PassageType;
    target_word_count: number;
    generation_timestamp: string;
    attempt_number: number;
  };
  created_at?: string;
}

// Response interfaces
export interface GenerationResult {
  success: boolean;
  testId?: string;
  sections: GenerationSection[];
  totalQuestions: number;
  totalPassages: number;
  metadata: GenerationMetadata;
  stateId?: string; // For resumable generation
  errors: string[];
  warnings: string[];
}

export interface GenerationSection {
  sectionName: string;
  passages: GeneratedPassage[];
  questions: GeneratedQuestion[];
  questionCount: number;
  completionStatus: 'completed' | 'partial' | 'failed';
}

// Generation metadata for tracking
export interface GenerationMetadata {
  sessionId: string;
  timestamp: string;
  generation_timestamp: string;
  testType: string;
  section_name: string;
  totalQuestions: number;
  totalPassages: number;
  generationTimeSeconds: number;
  total_questions_generated: number;
  total_passages_generated: number;
  generation_time_seconds: number;
  estimated_time_seconds?: number;
  estimatedTimeSeconds?: number;
  apiCalls?: number;
  tokensUsed?: number;
  averageQuality?: number;
  question_distribution?: Record<string, number>;
  questionDistribution?: Record<string, number>;
  errors?: string[];
}

// State management interfaces
export interface GenerationState {
  sessionId: string;
  status: 'initializing' | 'in_progress' | 'completed' | 'failed' | 'paused';
  startTime: number;
  stage: string;
  progress: GenerationProgress;
  context: GenerationContext;
  errors?: string[];
  warnings?: string[];
}

// Visual generation types
export type VisualType = 
  | 'bar_chart' 
  | 'line_graph' 
  | 'pie_chart' 
  | 'table' 
  | 'geometric_shapes' 
  | 'coordinate_grid' 
  | 'scatter_plot'
  | 'tree_diagram';

export interface VisualSpecification {
  visual_type: VisualType;
  required_fields: string[];
  svg_constraints: {
    width: number;
    height: number;
    [key: string]: unknown;
  };
  data_format: string;
}

// Claude API interfaces  
export interface ClaudeAPIRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ClaudeAPIResponse {
  content?: Array<{
    text: string;
    type: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason?: string;
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number; // Optional quality score
}

export interface ContentValidation extends ValidationResult {
  spellingIssues: string[];
  formatIssues: string[];
  difficultyAlignment: boolean;
  answerDistribution: Record<string, number>;
}

// Batch processing interfaces
export interface BatchProcessingOptions {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  validateBeforeInsert: boolean;
  saveProgressEvery?: number; // Save state every N questions
}

export interface BatchResult {
  successful: number;
  failed: number;
  totalProcessed: number;
  errors: Array<{
    index: number;
    error: string;
    data?: unknown;
  }>;
  processingTimeMs: number;
}

// Error handling
export interface GenerationError {
  code: string;
  message: string;
  context?: unknown;
  retryable: boolean;
  timestamp: string;
}

// Difficulty calibration
export interface DifficultyCalibration {
  testType: string;
  difficulty: number;
  percentileRange: string;
  description: string;
  characteristics: string[];
}

// Answer distribution tracking
export interface AnswerDistributionTracker {
  testId: string;
  sectionName: string;
  currentDistribution: Record<string, number>;
  targetDistribution: Record<string, number>;
  shouldAdjust: boolean;
  recommendedAnswer?: string;
}

// Progress tracking
export interface ProgressUpdate {
  stateId: string;
  completedQuestions: number;
  totalQuestions: number;
  currentSection: string;
  estimatedTimeRemainingMs: number;
  lastUpdate: string;
}

// Generation progress tracking
export interface GenerationProgress {
  stage: string;
  completed: number;
  total: number;
  currentOperation: string;
  currentItem?: string;
  stageProgress?: number;
  overallProgress?: number;
  estimatedTimeRemaining?: number;
  errors: string[];
  warnings: string[];
}

// Generation state for tracking active sessions
export interface GenerationSession {
  sessionId: string;
  startTime: number;
  progress: GenerationProgress;
  context: GenerationContext;
  results: GeneratedQuestion[];
}

// Export utility type for test type validation
export type TestTypeKey = keyof typeof import('../../data/curriculumData').TEST_STRUCTURES;

// Visual data structure
export interface VisualData {
  type: string;
  data: Record<string, unknown>;
  svgContent?: string;
  description: string;
  altText: string;
}

// Types for batch question generation engine

export interface BatchGenerationRequest {
  testType: string;
  testMode: string;
  yearLevel?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  generatePassages?: boolean;
}

export interface SectionGenerationConfig {
  totalQuestions: number;
  timeLimit: number;
  format: 'Multiple Choice' | 'Written Response';
  passages: number;
  wordsPerPassage: number;
  subSkills: string[];
  questionsPerSubSkill: number;
  isWritingSection: boolean;
  requiresPassages?: boolean;
}

export interface TestStructureInfo {
  testType: string;
  sections: Record<string, SectionGenerationConfig>;
  totalQuestions: number;
  metadata: {
    sourceTimestamp: string;
    dataSource: string;
  };
}

export interface SectionGenerationResult {
  sectionName: string;
  questionsGenerated: number;
  questionIds: string[];
  errors: string[];
  subSkillResults: SubSkillGenerationResult[];
}

export interface SubSkillGenerationResult {
  subSkill: string;
  questionsRequested: number;
  questionsGenerated: number;
  questionIds: string[];
  errors: string[];
}

export interface BatchGenerationResult {
  testType: string;
  testMode: string;
  totalQuestions: number;
  sectionsGenerated: SectionGenerationResult[];
  questionIds: string[];
  metadata: {
    startTime: string;
    endTime: string;
    duration: number;
    sourceStructure?: {
      sourceTimestamp: string;
      dataSource: string;
    };
  };
  errors: string[];
}

// Existing types for compatibility
export interface QuestionData {
  question_text: string;
  answer_options?: string[];
  correct_answer: string;
  explanation?: string;
  // Writing-specific fields
  writing_prompt_type?: string;
  word_count_guidance?: string;
  assessment_criteria?: string[];
}

export interface GenerationResult {
  success: boolean;
  questionIds: string[];
  errors: string[];
} 