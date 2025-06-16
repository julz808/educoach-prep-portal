import { UserProgressService } from './userProgressService';
import { supabase } from '@/lib/supabase';

export interface TestSessionConfig {
  type: 'diagnostic' | 'practice' | 'drill';
  productType: string;
  subjectId: string;
  subjectName: string;
  sectionId?: string;
  sectionName?: string;
  skillId?: string;
  skillName?: string;
  questionCount: number;
  timeLimit: number; // in minutes
  metadata?: {
    questionOrder?: string[];
    [key: string]: any;
  };
}

export interface QuestionResponseData {
  questionId: string;
  questionIndex: number;
  answerIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  subSkill: string;
  difficulty: number;
  isFlagged?: boolean;
  isSkipped?: boolean;
}

export interface SessionCompletionData {
  sessionId: string;
  userId: string;
  productType: string;
  testMode: string;
  totalQuestions: number;
  correctAnswers: number;
  totalTimeSeconds: number;
  sectionScores: Record<string, any>;
}

export interface TestSessionData {
  sessionId: string;
  userId: string;
  productType: string;
  testMode: string;
  sectionName: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  status: string;
  sessionData: {
    startedAt: string;
    timeRemainingSeconds: number;
    flaggedQuestions: number[];
    answers: Record<string, string>;
    lastUpdated?: string;
  };
  questionOrder: string[];
  startedAt: string;
  questionResponses: Record<string, {
    user_answer: string;
    is_correct: boolean;
    time_spent_seconds: number;
    is_flagged: boolean;
    is_skipped: boolean;
  }>;
}

export class TestSessionService {
  private static activeSession: string | null = null;
  private static questionStartTime: number = Date.now();
  private static sessionStartTime: number = Date.now();

  /**
   * Create or resume a test session with question order
   */
  static async createOrResumeSession(
    userId: string,
    productType: string,
    testMode: 'diagnostic' | 'practice' | 'drill',
    sectionName: string,
    totalQuestions?: number,
    questionOrder?: string[]
  ): Promise<string> {
    try {
      console.log('🚀 Creating/resuming session with question order:', {
        userId,
        productType,
        testMode,
        sectionName,
        totalQuestions,
        questionOrderLength: questionOrder?.length || 0
      });

      const { data, error } = await supabase.rpc('create_or_resume_test_session', {
        p_user_id: userId,
        p_product_type: productType,
        p_test_mode: testMode,
        p_section_name: sectionName,
        p_total_questions: totalQuestions || null,
        p_question_order: questionOrder || []
      });

      if (error) {
        console.error('Database error creating session:', error);
        throw new Error(`Failed to create session: ${error.message}`);
      }

      if (!data) {
        throw new Error('No session ID returned from database');
      }

      console.log('✅ Session created/resumed:', data);
      return data;
    } catch (error) {
      console.error('Failed to create/resume session:', error);
      throw error;
    }
  }

  /**
   * Get session data for resumption with question order
   */
  static async getSessionForResume(sessionId: string): Promise<TestSessionData | null> {
    try {
      console.log('🔄 Getting session for resume:', sessionId);

      const { data, error } = await supabase.rpc('get_session_for_resume', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Database error getting session:', error);
        throw new Error(`Failed to get session: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('No session found for ID:', sessionId);
        return null;
      }

      const sessionData = data[0];
      console.log('✅ Session data retrieved:', {
        sessionId: sessionData.session_id,
        questionOrderLength: sessionData.question_order?.length || 0,
        currentQuestion: sessionData.current_question_index,
        status: sessionData.status
      });

      return {
        sessionId: sessionData.session_id,
        userId: sessionData.user_id,
        productType: sessionData.product_type,
        testMode: sessionData.test_mode,
        sectionName: sessionData.section_name,
        totalQuestions: sessionData.total_questions,
        currentQuestionIndex: sessionData.current_question_index,
        status: sessionData.status,
        sessionData: sessionData.session_data || {
          startedAt: sessionData.started_at,
          timeRemainingSeconds: 3600,
          flaggedQuestions: [],
          answers: {}
        },
        questionOrder: sessionData.question_order || [],
        startedAt: sessionData.started_at,
        questionResponses: sessionData.question_responses || {}
      };
    } catch (error) {
      console.error('Failed to get session for resume:', error);
      throw error;
    }
  }

  /**
   * Update session progress with question order support
   */
  static async updateSessionProgress(
    sessionId: string,
    currentQuestionIndex: number,
    answers: Record<number, string>,
    flaggedQuestions: number[],
    timeRemainingSeconds: number,
    questionOrder?: string[]
  ): Promise<void> {
    try {
      console.log('💾 Updating session progress with question order:', {
        sessionId,
        currentQuestionIndex,
        answersCount: Object.keys(answers).length,
        flaggedCount: flaggedQuestions.length,
        timeRemaining: timeRemainingSeconds,
        questionOrderLength: questionOrder?.length || 0
      });

      const answersJsonb: Record<string, string> = {};
      Object.entries(answers).forEach(([index, answer]) => {
        answersJsonb[index] = answer;
      });

      const { error } = await supabase.rpc('update_session_progress', {
        p_session_id: sessionId,
        p_current_question_index: currentQuestionIndex,
        p_answers: answersJsonb,
        p_flagged_questions: flaggedQuestions,
        p_time_remaining_seconds: timeRemainingSeconds,
        p_question_order: questionOrder || []
      });

      if (error) {
        console.error('Database error updating session:', error);
        throw new Error(`Failed to update session: ${error.message}`);
      }

      console.log('✅ Session progress updated successfully');
    } catch (error) {
      console.error('Failed to update session progress:', error);
      throw error;
    }
  }

  /**
   * Record a question response with session linking
   */
  static async recordQuestionResponse(
    userId: string,
    sessionId: string,
    productType: string,
    responseData: QuestionResponseData
  ): Promise<void> {
    try {
      // Convert answer index to letter (A, B, C, D)
      const answerLetter = String.fromCharCode(65 + responseData.answerIndex);
      
      const { error } = await supabase.rpc('record_question_response', {
        p_user_id: userId,
        p_question_id: responseData.questionId,
        p_test_session_id: sessionId,
        p_product_type: productType,
        p_user_answer: answerLetter,
        p_is_correct: responseData.isCorrect,
        p_time_spent_seconds: responseData.timeSpentSeconds,
        p_is_flagged: responseData.isFlagged || false,
        p_is_skipped: responseData.isSkipped || false
      });

      if (error) {
        console.error('Error recording question response:', error);
        throw error;
      }

      console.log('📝 Question response recorded:', {
        sessionId,
        questionId: responseData.questionId,
        answer: answerLetter,
        isCorrect: responseData.isCorrect,
        timeSpent: responseData.timeSpentSeconds,
        isFlagged: responseData.isFlagged,
        isSkipped: responseData.isSkipped
      });
    } catch (error) {
      console.error('Error recording question response:', error);
      // Don't throw error to avoid disrupting user experience
      // Just log it for monitoring
    }
  }

  /**
   * Complete a test session using database function
   */
  static async completeSession(
    completionData: SessionCompletionData
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('complete_test_session', {
        p_session_id: completionData.sessionId,
        p_user_id: completionData.userId,
        p_product_type: completionData.productType,
        p_test_mode: completionData.testMode,
        p_section_scores: completionData.sectionScores
      });

      if (error) {
        console.error('Error completing test session:', error);
        throw error;
      }

      const accuracy = completionData.totalQuestions > 0 
        ? completionData.correctAnswers / completionData.totalQuestions 
        : 0;

      console.log('🏁 Test session completed:', {
        sessionId: completionData.sessionId,
        score: Math.round(accuracy * 100),
        questions: `${completionData.correctAnswers}/${completionData.totalQuestions}`,
        timeSpent: `${Math.round(completionData.totalTimeSeconds / 60)}min`
      });

      // Clear active session
      this.activeSession = null;
    } catch (error) {
      console.error('Error completing test session:', error);
      throw new Error('Failed to save test results. Please try again.');
    }
  }

  /**
   * Get diagnostic progress with session information
   */
  static async getDiagnosticProgress(
    userId: string,
    productType: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_diagnostic_progress', {
        p_user_id: userId,
        p_product_type: productType
      });

      if (error) {
        console.error('Error getting diagnostic progress:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getDiagnosticProgress:', error);
      return [];
    }
  }

  /**
   * Start a new test session and initialize progress tracking
   */
  static async startSession(
    userId: string,
    config: TestSessionConfig
  ): Promise<string> {
    try {
      // Use the new createOrResumeSession method
      const sessionId = await this.createOrResumeSession(
        userId,
        config.productType,
        config.type,
        config.sectionName || 'default',
        config.questionCount,
        config.metadata?.questionOrder
      );
      
      return sessionId;
    } catch (error) {
      console.error('Error starting test session:', error);
      throw new Error('Failed to start test session. Please try again.');
    }
  }

  /**
   * Mark the start of a new question (for timing)
   */
  static startQuestion(): void {
    this.questionStartTime = Date.now();
  }

  /**
   * Calculate time spent on current question
   */
  static getQuestionTimeSpent(): number {
    return Math.round((Date.now() - this.questionStartTime) / 1000);
  }

  /**
   * Calculate total session time
   */
  static getTotalSessionTime(): number {
    return Math.round((Date.now() - this.sessionStartTime) / 1000);
  }

  /**
   * Update user streak after session completion
   */
  static async updateUserStreak(
    userId: string,
    productType: string
  ): Promise<void> {
    try {
      await UserProgressService.updateUserStreak(userId, productType);
    } catch (error) {
      console.error('Error updating user streak:', error);
      // Don't throw error as this is a non-critical operation
    }
  }

  /**
   * Get the current active session ID
   */
  static getActiveSessionId(): string | null {
    return this.activeSession;
  }

  /**
   * Reset session tracking (for cleanup)
   */
  static resetSession(): void {
    this.activeSession = null;
    this.questionStartTime = Date.now();
    this.sessionStartTime = Date.now();
  }

  /**
   * Batch record multiple responses (for offline support)
   */
  static async batchRecordResponses(
    userId: string,
    productType: string,
    responses: Array<{
      sessionId: string;
      responseData: QuestionResponseData;
    }>
  ): Promise<void> {
    try {
      // Process responses sequentially to maintain order
      for (const response of responses) {
        await this.recordQuestionResponse(
          userId,
          response.sessionId,
          productType,
          response.responseData
        );
      }
      
      console.log(`📦 Batch recorded ${responses.length} responses`);
    } catch (error) {
      console.error('Error in batch recording responses:', error);
      throw error;
    }
  }

  /**
   * Create session (legacy method for compatibility)
   */
  static createSession(config: TestSessionConfig): string {
    const sessionId = crypto.randomUUID();
    this.activeSession = sessionId;
    this.sessionStartTime = Date.now();
    return sessionId;
  }

  /**
   * Get question order for a session
   */
  static async getSessionQuestionOrder(sessionId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_session_question_order', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Database error getting question order:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get session question order:', error);
      return [];
    }
  }

  /**
   * Rebuild answers from question responses (fallback method)
   */
  static async rebuildSessionAnswers(sessionId: string): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase.rpc('rebuild_session_answers', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Database error rebuilding answers:', error);
        return {};
      }

      return data || {};
    } catch (error) {
      console.error('Failed to rebuild session answers:', error);
      return {};
    }
  }
} 