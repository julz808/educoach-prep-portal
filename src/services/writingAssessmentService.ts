import { supabase } from '@/integrations/supabase/client';
import { WritingRubricService, AssessmentResult } from './writingRubricService';

interface Question {
  id: string;
  question_text: string;
  writing_prompt?: string;
  sub_skill: string;
  section_name: string;
}

interface StoreAssessmentData {
  userId: string;
  sessionId: string;
  questionId: string;
  productType: string;
  genre: string;
  userResponse: string;
  assessment: AssessmentResult;
  rubric: any;
}

export class WritingAssessmentService {
  private static readonly CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
  
  /**
   * Main function to assess a writing response
   */
  static async assessWriting(
    userResponse: string,
    questionId: string,
    productType: string,
    sessionId: string,
    userId: string
  ): Promise<AssessmentResult> {
    console.log('🎯 Starting writing assessment:', { questionId, productType, sessionId });
    
    try {
      // 1. Get question details and determine genre
      const question = await this.getQuestion(questionId);
      if (!question) {
        throw new Error(`Question not found: ${questionId}`);
      }
      
      const genre = question.sub_skill; // Genre from questions table
      const writingPrompt = question.writing_prompt || question.question_text;
      
      console.log('📝 Question details:', { genre, prompt: writingPrompt.substring(0, 100) + '...' });
      
      // 2. Get appropriate rubric
      const rubric = WritingRubricService.getRubric(productType, genre);
      if (!rubric) {
        throw new Error(`No rubric found for ${productType} - ${genre}`);
      }
      
      console.log('📋 Using rubric:', { 
        totalMarks: rubric.totalMarks, 
        criteriaCount: rubric.criteria.length,
        timeMinutes: rubric.timeMinutes 
      });
      
      // 3. Validate response
      if (!userResponse || userResponse.trim().length === 0) {
        return this.getEmptyResponseAssessment(rubric);
      }
      
      // 4. Call Claude API for assessment
      const startTime = Date.now();
      let assessment: AssessmentResult;
      
      try {
        assessment = await this.callClaudeAPI(userResponse, writingPrompt, rubric);
        // Ensure processingMetadata exists before setting processingTimeMs
        if (!assessment.processingMetadata) {
          assessment.processingMetadata = {
            modelVersion: 'unknown',
            processingTimeMs: 0,
            promptTokens: undefined,
            responseTokens: undefined
          };
        }
        assessment.processingMetadata.processingTimeMs = Date.now() - startTime;
      } catch (apiError) {
        console.warn('Claude API failed, using fallback scoring:', apiError);
        assessment = WritingRubricService.getFallbackScore(userResponse, rubric);
        // Ensure processingMetadata exists before setting processingTimeMs
        if (!assessment.processingMetadata) {
          assessment.processingMetadata = {
            modelVersion: 'fallback-scoring',
            processingTimeMs: 0,
            promptTokens: undefined,
            responseTokens: undefined
          };
        }
        assessment.processingMetadata.processingTimeMs = Date.now() - startTime;
      }
      
      // 5. Store assessment in database
      await this.storeAssessment({
        userId,
        sessionId,
        questionId,
        productType,
        genre,
        userResponse,
        assessment,
        rubric
      });
      
      console.log('✅ Writing assessment completed:', { 
        totalScore: assessment.totalScore, 
        maxScore: assessment.maxPossibleScore,
        percentage: assessment.percentageScore 
      });
      
      return assessment;
      
    } catch (error) {
      console.error('❌ Error in writing assessment:', error);
      throw error;
    }
  }
  
  /**
   * Get question details from database
   */
  private static async getQuestion(questionId: string): Promise<Question | null> {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_text, writing_prompt, sub_skill, section_name')
      .eq('id', questionId)
      .single();
    
    if (error) {
      console.error('Error fetching question:', error);
      return null;
    }
    
    return data;
  }
  
  /**
   * Call Claude API for writing assessment via backend proxy
   */
  private static async callClaudeAPI(
    userResponse: string,
    writingPrompt: string,
    rubric: any
  ): Promise<AssessmentResult> {
    const yearLevel = WritingRubricService.getYearLevel(rubric.testName);
    
    console.log('🤖 Calling Claude API via backend proxy...');
    
    // Try Supabase Edge Function first, then fallback to local proxy
    try {
      // Option 1: Supabase Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('🔄 Attempting Supabase Edge Function...');
        const response = await supabase.functions.invoke('assess-writing', {
          body: {
            userResponse,
            writingPrompt,
            rubric,
            yearLevel
          }
        });
        
        if (!response.error && response.data) {
          console.log('✅ Supabase Edge Function successful');
          console.log('📋 Edge Function Response:', response.data);
          
          // Edge Function returns the correct format directly - no transformation needed
          const assessment = response.data;
          
          // Ensure processingMetadata exists
          if (!assessment.processingMetadata) {
            assessment.processingMetadata = {
              modelVersion: 'claude-3-5-sonnet-20241022',
              processingTimeMs: 0,
              promptTokens: undefined,
              responseTokens: undefined
            };
          }
          
          console.log('✅ Assessment processed:', {
            totalScore: assessment.totalScore,
            maxScore: assessment.maxPossibleScore,
            percentage: assessment.percentageScore
          });
          
          return assessment as AssessmentResult;
        }
        
        console.warn('⚠️ Supabase Edge Function failed:', response.error);
      }
    } catch (edgeError) {
      console.warn('⚠️ Supabase Edge Function error:', edgeError);
    }
    
    // Option 2: Local proxy server fallback
    try {
      console.log('🔄 Attempting local proxy server...');
      const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3002';
      
      const response = await fetch(`${proxyUrl}/api/assess-writing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse,
          writingPrompt,
          rubric,
          yearLevel
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Proxy API error (${response.status}): ${errorData}`);
      }
      
      const assessment = await response.json();
      console.log('✅ Local proxy server successful');
      return assessment as AssessmentResult;
      
    } catch (proxyError) {
      console.warn('⚠️ Local proxy server error:', proxyError);
      console.warn('🔄 All API methods failed, will use fallback scoring');
      throw new Error(`All assessment methods failed. Last error: ${proxyError.message}`);
    }
  }
  
  /**
   * Store assessment results in database
   */
  private static async storeAssessment(data: StoreAssessmentData): Promise<void> {
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated for writing assessment storage');
    }
    
    // Use RPC function to handle the upsert properly
    const { error } = await supabase.rpc('upsert_writing_assessment', {
      p_user_id: data.userId,
      p_session_id: data.sessionId,
      p_question_id: data.questionId,
      p_product_type: data.productType,
      p_writing_genre: data.genre,
      p_rubric_used: data.rubric,
      p_user_response: data.userResponse,
      p_word_count: WritingRubricService.getWordCount(data.userResponse),
      p_total_score: data.assessment.totalScore,
      p_max_possible_score: data.assessment.maxPossibleScore,
      p_percentage_score: data.assessment.percentageScore,
      p_criterion_scores: data.assessment.criterionScores,
      p_overall_feedback: data.assessment.overallFeedback,
      p_strengths: JSON.stringify(data.assessment.strengths || []), // Convert to JSON string
      p_improvements: JSON.stringify(data.assessment.improvements || []), // Convert to JSON string
      p_claude_model_version: data.assessment.processingMetadata?.modelVersion || 'unknown',
      p_processing_time_ms: data.assessment.processingMetadata?.processingTimeMs || 0,
      p_prompt_tokens: data.assessment.processingMetadata?.promptTokens,
      p_response_tokens: data.assessment.processingMetadata?.responseTokens
    });
      
    if (error) {
      console.error('Error storing writing assessment:', error);
      throw new Error('Failed to store assessment in database');
    }
    
    console.log('💾 Assessment stored successfully');
  }
  
  /**
   * Get assessment for empty response
   */
  private static getEmptyResponseAssessment(rubric: any): AssessmentResult {
    const criterionScores: Record<string, { score: number; maxMarks: number; feedback: string }> = {};
    
    for (const criterion of rubric.criteria) {
      criterionScores[criterion.name] = {
        score: 0,
        maxMarks: criterion.maxMarks,
        feedback: 'No response provided.'
      };
    }
    
    return {
      totalScore: 0,
      maxPossibleScore: rubric.totalMarks,
      percentageScore: 0,
      criterionScores,
      overallFeedback: 'No response was provided for this writing task.',
      strengths: [],
      improvements: ['Please provide a response to the writing prompt', 'Take time to plan your writing before starting'],
      processingMetadata: {
        modelVersion: 'empty-response',
        processingTimeMs: 0,
        promptTokens: undefined,
        responseTokens: undefined
      }
    };
  }
  
  /**
   * Get writing assessment for a specific question and session
   */
  static async getWritingAssessment(questionId: string, sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('writing_assessments')
      .select('*')
      .eq('question_id', questionId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching writing assessment:', error);
      return null;
    }
    
    return data;
  }
  
  /**
   * Get all writing assessments for a user and product
   */
  static async getUserWritingAssessments(userId: string, productType: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('writing_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', productType)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user writing assessments:', error);
      return [];
    }
    
    return data || [];
  }
}