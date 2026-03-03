import { supabase } from '@/integrations/supabase/client';
import { WritingRubricService, AssessmentResult } from './writingRubricService';

// CRITICAL: Use the same questions table as test loading
const USE_V2_QUESTIONS = import.meta.env.VITE_USE_V2_QUESTIONS === 'true';
const QUESTIONS_TABLE = USE_V2_QUESTIONS ? 'questions_v2' : 'questions';

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
    userId: string,
    questionText?: string,
    subSkill?: string
  ): Promise<AssessmentResult> {
    console.log('🎯 Starting writing assessment:', { questionId, productType, sessionId });

    try {
      // 1. Get question details and determine genre
      let genre: string;
      let writingPrompt: string;

      // If question data is provided, use it directly (preferred for writing questions)
      if (questionText && subSkill) {
        genre = subSkill;
        writingPrompt = questionText;
        console.log('📝 Using provided question data:', { genre, prompt: writingPrompt.substring(0, 100) + '...' });
      } else {
        // Fallback: try to fetch from database
        const question = await this.getQuestion(questionId);
        if (!question) {
          throw new Error(`Question not found: ${questionId}. Please provide questionText and subSkill parameters.`);
        }
        genre = question.sub_skill;
        writingPrompt = question.writing_prompt || question.question_text;
        console.log('📝 Fetched question from database:', { genre, prompt: writingPrompt.substring(0, 100) + '...' });
      }
      
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
    // questions_v2 doesn't have writing_prompt column, only question_text
    const selectFields = USE_V2_QUESTIONS
      ? 'id, question_text, sub_skill, section_name'
      : 'id, question_text, writing_prompt, sub_skill, section_name';

    const { data, error } = await supabase
      .from(QUESTIONS_TABLE)
      .select(selectFields)
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
      console.log('🔐 Session check:', session ? 'User authenticated' : 'No session');

      if (session) {
        console.log('🔄 Attempting Supabase Edge Function...');
        console.log('📤 Sending to Edge Function:', {
          userResponseLength: userResponse.length,
          rubricName: rubric.genre,
          rubricTotalMarks: rubric.totalMarks,
          yearLevel
        });

        const response = await supabase.functions.invoke('assess-writing', {
          body: {
            userResponse,
            writingPrompt,
            rubric,
            yearLevel
          }
        });

        console.log('📥 Edge Function raw response:', {
          hasError: !!response.error,
          hasData: !!response.data,
          error: response.error,
          dataKeys: response.data ? Object.keys(response.data) : []
        });

        if (!response.error && response.data) {
          console.log('✅ Supabase Edge Function successful');
          console.log('📋 Edge Function Response:', response.data);

          // Edge Function returns the correct format directly - no transformation needed
          const assessment = response.data;

          // Ensure processingMetadata exists
          if (!assessment.processingMetadata) {
            assessment.processingMetadata = {
              modelVersion: 'claude-3-opus-20240229',
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

        console.error('❌ Supabase Edge Function failed with error:', response.error);
        console.error('❌ Full error details:', JSON.stringify(response.error, null, 2));

        // Try to extract more details from the error
        if (response.error && typeof response.error === 'object') {
          console.error('❌ Error properties:', Object.keys(response.error));
          if ('message' in response.error) {
            console.error('❌ Error message:', response.error.message);
          }

          // Try to read the response body from the context
          if ('context' in response.error && response.error.context instanceof Response) {
            console.log('🔍 Attempting to read error response body...');
            try {
              const errorBody = await response.error.context.clone().json();
              console.error('❌ Edge Function error body:', errorBody);
              console.error('❌ Error details:', {
                message: errorBody.message,
                type: errorBody.type,
                stack: errorBody.stack,
                context: errorBody.context
              });
            } catch (bodyError) {
              console.error('❌ Could not parse error response body:', bodyError);
              try {
                const errorText = await response.error.context.clone().text();
                console.error('❌ Error response text:', errorText);
              } catch (textError) {
                console.error('❌ Could not read error response at all:', textError);
              }
            }
          } else if ('context' in response.error) {
            console.error('❌ Error context (not a Response):', response.error.context);
          }

          if ('stack' in response.error) {
            console.error('❌ Error stack:', response.error.stack);
          }
        }
      } else {
        console.warn('⚠️ No user session - skipping Edge Function');
      }
    } catch (edgeError) {
      console.error('❌ Supabase Edge Function exception:', edgeError);
      console.error('❌ Exception details:', {
        message: edgeError.message,
        stack: edgeError.stack,
        name: edgeError.name
      });

      // Try to extract response body if available
      if (edgeError.context) {
        console.error('❌ Exception context:', edgeError.context);
      }
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
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Check if it's a foreign key constraint error (code 23503)
      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key constraint')) {
        console.warn('⚠️ Foreign key constraint error - question_id may not exist in questions table.');
        console.warn('⚠️ This is expected for dynamically generated writing questions.');
        console.warn('⚠️ Assessment completed successfully but not stored in database.');
        console.warn('⚠️ To fix: Run migration to remove foreign key constraint on writing_assessments.question_id');
        // Don't throw - assessment was successful, just couldn't be stored
        return;
      }

      // For other errors, throw with detailed information
      throw new Error(`Failed to store assessment in database: ${error.message || error.code || 'Unknown error'} (code: ${error.code}, details: ${error.details})`);
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
    // First, check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Cannot fetch writing assessment: User not authenticated');
      return null;
    }

    // Try without .single() first to see if any records exist
    const { data: assessments, error: listError } = await supabase
      .from('writing_assessments')
      .select('*')
      .eq('question_id', questionId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (listError) {
      console.error('Error fetching writing assessment:', listError);
      return null;
    }

    // If no assessments found, log it
    if (!assessments || assessments.length === 0) {
      console.log('No writing assessment found for question:', questionId, 'session:', sessionId);
      return null;
    }

    // Return the first (and should be only) assessment
    return assessments[0];
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