// Browser-safe question generation service
// This service provides type definitions and throws errors when functions are called
// The actual question generation engine only runs on the backend via API calls

// Type definitions (safe to define in browser)
export interface QuestionGenerationRequest {
  testType: string;
  yearLevel: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  questionCount: number;
  testMode?: string;
  passageId?: string;
  visualRequired?: boolean;
  australianContext?: boolean;
  questionsPerPassage?: number;
  passageRequirements?: {
    subSkills: string[];
    difficulties: number[];
    totalQuestions: number;
  };
}

export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
  passageGenerated?: {
    title: string;
    content: string;
    passageType: string;
    wordCount: number;
  };
  metadata: {
    testType: string;
    sectionName: string;
    subSkill: string;
    difficulty: number;
    generatedAt: string;
    complianceChecked: boolean;
  };
}

export interface GeneratedQuestion {
  questionText: string;
  options: string[] | null;
  correctAnswer: string | null;
  explanation: string;
  difficulty: number;
  subSkill: string;
  hasVisual: boolean;
  visualType?: string;
  visualSpecification?: VisualSpecification;
  passageReference?: string;
}

export interface VisualSpecification {
  title: string;
  description: string;
  visual_type: VisualType;
  dimensions: { width: number; height: number };
  elements: { [key: string]: any };
  styling: {
    colors: string[];
    fonts?: string[];
    background: string;
    theme: string;
  };
  data?: Record<string, unknown>;
  requirements: string[];
}

export type VisualType = 
  | 'geometric_grid_diagram'
  | 'bar_chart'
  | 'line_graph'
  | 'pie_chart'
  | 'technical_drawing'
  | 'coordinate_plane'
  | 'pattern_sequence'
  | 'measurement_diagram'
  | 'algebra_illustration'
  | 'statistical_display';

export interface FullTestResponse {
  testId: string;
  testType: string;
  mode: string;
  sections: Array<{
    sectionName: string;
    passages?: Array<{
      id: string;
      title: string;
      content: string;
      questions: GeneratedQuestion[];
    }>;
    questions: GeneratedQuestion[];
    questionCount: number;
  }>;
  totalQuestions: number;
  metadata: {
    generatedAt: string;
    estimatedTimeMinutes: number;
    complianceChecked: boolean;
  };
}

export interface VisualData {
  type: 'geometry' | 'chart' | 'pattern' | 'diagram';
  data: {
    shapes?: Array<{
      type: 'circle' | 'rectangle' | 'triangle' | 'line' | 'point';
      properties: Record<string, any>;
      coordinates?: number[];
    }>;
    chartType?: 'bar' | 'line' | 'pie' | 'scatter';
    chartData?: Array<{ label: string; value: number }>;
    sequence?: any[];
    elements?: Array<{ type: string; properties: any }>;
  };
  renderingSpecs: {
    width: number;
    height: number;
    interactive?: boolean;
    style?: Record<string, any>;
  };
  description: string;
}

// Browser-safe wrapper functions that throw errors
const BACKEND_ONLY_ERROR = 'This function is only available on the backend server. Please use the appropriate API endpoint.';

export async function generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export async function generateStandaloneQuestions(
  testType: string,
  yearLevel: string,
  sectionName: string,
  subSkill: string,
  difficulty: number,
  questionCount: number
): Promise<QuestionGenerationResponse> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export async function saveGeneratedQuestions(
  response: QuestionGenerationResponse,
  passageId?: string,
  testMode?: string
): Promise<{ questionIds: string[]; passageId?: string }> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export async function generateFullPracticeTest(
  testType: string,
  practiceTestNumber?: number
): Promise<FullTestResponse> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export async function generateFullDiagnosticTest(testType: string): Promise<FullTestResponse> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export async function generateFullDrillSet(testType: string): Promise<FullTestResponse> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export async function generatePassageWithMultipleQuestions(
  testType: string,
  yearLevel: string,
  subSkills: string[],
  passageDifficulty: number,
  questionsPerPassage: number,
  sectionName?: string
): Promise<QuestionGenerationResponse> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export async function generateReadingComprehensionSection(
  testType: string,
  yearLevel: string,
  totalQuestions: number
): Promise<any> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export function previewPracticeTestStructure(testType: string): any {
  // Return safe mock data for browser
  return {
    testType,
    sections: [],
    totalQuestions: 0,
    estimatedTimeMinutes: 0
  };
}

export async function generateTestSection(
  testType: string, 
  sectionName: string, 
  targetQuestions?: number
): Promise<QuestionGenerationResponse[]> {
  throw new Error(BACKEND_ONLY_ERROR);
}

export async function getGenerationStats(): Promise<{
  totalQuestions: number;
  questionsByTestType: Record<string, number>;
  questionsBySection: Record<string, number>;
  recentGenerations: Array<{
    testType: string;
    sectionName: string;
    questionCount: number;
    generatedAt: string;
  }>;
}> {
  // Return safe mock data for browser
  return {
    totalQuestions: 0,
    questionsByTestType: {},
    questionsBySection: {},
    recentGenerations: []
  };
}

export async function testClaudeConnection(): Promise<{
  success: boolean;
  model: string;
  error?: string;
}> {
  // Return safe mock data for browser
  return {
    success: false,
    model: 'claude-4-sonnet-20241218',
    error: 'API testing is only available on the server'
  };
} 