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
        assessment.processingMetadata.processingTimeMs = Date.now() - startTime;
      } catch (apiError) {
        console.warn('Claude API failed, using fallback scoring:', apiError);
        assessment = WritingRubricService.getFallbackScore(userResponse, rubric);
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
   * Call Claude API for writing assessment
   */
  private static async callClaudeAPI(
    userResponse: string,
    writingPrompt: string,
    rubric: any
  ): Promise<AssessmentResult> {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('Claude API key not found');
    }
    
    const yearLevel = WritingRubricService.getYearLevel(rubric.testName);
    const prompt = WritingRubricService.generateAssessmentPrompt(
      userResponse,
      writingPrompt,
      rubric,
      yearLevel
    );
    
    console.log('🤖 Calling Claude API...');
    
    const response = await fetch(this.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent scoring
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorData}`);
    }
    
    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      throw new Error('No content in Claude API response');
    }
    
    // Parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from response (Claude sometimes adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', content);
      throw new Error('Invalid JSON response from Claude API');
    }
    
    // Validate and clean response
    const assessment = WritingRubricService.validateAssessmentResponse(parsedResponse, rubric);
    
    // Add token usage if available
    if (data.usage) {
      assessment.processingMetadata.promptTokens = data.usage.input_tokens;
      assessment.processingMetadata.responseTokens = data.usage.output_tokens;
    }
    
    return assessment;
  }
  
  /**
   * Store assessment results in database
   */
  private static async storeAssessment(data: StoreAssessmentData): Promise<void> {
    const { error } = await supabase
      .from('writing_assessments')
      .insert({
        user_id: data.userId,
        session_id: data.sessionId,
        question_id: data.questionId,
        product_type: data.productType,
        writing_genre: data.genre,
        rubric_used: data.rubric,
        user_response: data.userResponse,
        word_count: WritingRubricService.getWordCount(data.userResponse),
        total_score: data.assessment.totalScore,
        max_possible_score: data.assessment.maxPossibleScore,
        percentage_score: data.assessment.percentageScore,
        criterion_scores: data.assessment.criterionScores,
        overall_feedback: data.assessment.overallFeedback,
        strengths: data.assessment.strengths,
        improvements: data.assessment.improvements,
        claude_model_version: data.assessment.processingMetadata.modelVersion,
        processing_time_ms: data.assessment.processingMetadata.processingTimeMs,
        prompt_tokens: data.assessment.processingMetadata.promptTokens,
        response_tokens: data.assessment.processingMetadata.responseTokens
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
        processingTimeMs: 0
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