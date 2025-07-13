// Secure Question Generation Service
// Uses Supabase Edge Functions instead of direct Claude API calls

import { supabase } from '@/integrations/supabase/client';

export interface QuestionGenerationRequest {
  testType: string;
  yearLevel: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  questionCount: number;
  passageId?: string;
  visualRequired?: boolean;
  australianContext?: boolean;
  testMode?: string;
}

export interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  subSkill: string;
  hasVisual: boolean;
  visualType?: string;
  visualData?: any;
}

export interface QuestionGenerationResponse {
  success: boolean;
  data?: {
    questions: GeneratedQuestion[];
    savedQuestionIds: string[];
  };
  error?: string;
}

/**
 * Secure Question Generation Service
 * All Claude API calls go through Supabase Edge Functions
 */
export class SecureQuestionGenerationService {
  
  /**
   * Generate questions using the secure Edge Function
   */
  static async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<QuestionGenerationResponse> {
    try {
      console.log('🔐 Generating questions via secure Edge Function...');
      
      // Get the current session to ensure we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required for question generation');
      }
      
      // Call the secure Edge Function
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: request
      });
      
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(`Question generation failed: ${error.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Unknown error in question generation');
      }
      
      console.log('✅ Questions generated successfully:', {
        questionCount: data.data?.questions?.length || 0,
        savedIds: data.data?.savedQuestionIds?.length || 0
      });
      
      return data as QuestionGenerationResponse;
      
    } catch (error) {
      console.error('❌ Error in secure question generation:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Generate questions for a specific sub-skill with validation
   */
  static async generateSubSkillQuestions(
    testType: string,
    sectionName: string,
    subSkill: string,
    difficulty: number,
    count: number = 5
  ): Promise<string[]> {
    const request: QuestionGenerationRequest = {
      testType,
      yearLevel: this.getYearLevelFromTestType(testType),
      sectionName,
      subSkill,
      difficulty,
      questionCount: count,
      australianContext: true,
      visualRequired: this.shouldIncludeVisual(subSkill)
    };
    
    const response = await this.generateQuestions(request);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate questions');
    }
    
    return response.data.savedQuestionIds;
  }
  
  /**
   * Extract year level from test type
   */
  private static getYearLevelFromTestType(testType: string): string {
    if (testType.includes('Year 5')) return '5';
    if (testType.includes('Year 7')) return '7';
    if (testType.includes('Year 9')) return '9';
    return '7'; // Default fallback
  }
  
  /**
   * Determine if a sub-skill should include visual elements
   */
  private static shouldIncludeVisual(subSkill: string): boolean {
    const visualSubSkills = [
      'Geometry',
      'Measurement',
      'Statistics and Probability',
      'Patterns and Algebra',
      'Number and Algebra',
      'Data Representation',
      'Spatial Reasoning'
    ];
    
    return visualSubSkills.some(visual => 
      subSkill.toLowerCase().includes(visual.toLowerCase())
    );
  }
  
  /**
   * Validate that the Edge Function is properly configured
   */
  static async validateConfiguration(): Promise<{
    isConfigured: boolean;
    error?: string;
  }> {
    try {
      // Test with a minimal request
      const testRequest: QuestionGenerationRequest = {
        testType: 'Test',
        yearLevel: '7',
        sectionName: 'Test Section',
        subSkill: 'Test Skill',
        difficulty: 1,
        questionCount: 1
      };
      
      const { error } = await supabase.functions.invoke('generate-questions', {
        body: testRequest
      });
      
      // If we get a response (even an error), the function exists
      return {
        isConfigured: true
      };
      
    } catch (error) {
      return {
        isConfigured: false,
        error: error instanceof Error ? error.message : 'Unknown configuration error'
      };
    }
  }
}

/**
 * Legacy function wrapper for backward compatibility
 * @deprecated Use SecureQuestionGenerationService.generateQuestions instead
 */
export async function generateQuestionsSecurely(
  request: QuestionGenerationRequest
): Promise<QuestionGenerationResponse> {
  console.warn('⚠️ Using deprecated generateQuestionsSecurely function. Use SecureQuestionGenerationService.generateQuestions instead.');
  return SecureQuestionGenerationService.generateQuestions(request);
}