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
  metadata?: Record<string, any>;
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
  currentQuestionIndex: number;
  questionsAnswered: number;
  totalQuestions: number;
  startedAt: string;
  status: 'in_progress' | 'completed' | 'paused';
  sessionData: {
    answers: Record<string, any>;
    flaggedQuestions: number[];
    timeRemainingSeconds?: number;
    currentQuestionIndex: number;
    lastUpdated: string;
  };
  questionResponses: Record<string, any>;
}

export class TestSessionService {
  private static activeSession: string | null = null;
  private static questionStartTime: number = Date.now();
  private static sessionStartTime: number = Date.now();

  /**
   * Create or resume a test session using database function
   */
  static async createOrResumeSession(
    userId: string,
    productType: string,
    testMode: string,
    sectionName: string,
    totalQuestions?: number
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_or_resume_test_session', {
        p_user_id: userId,
        p_product_type: productType,
        p_test_mode: testMode,
        p_section_name: sectionName,
        p_total_questions: totalQuestions
      });

      if (error) {
        console.error('Error creating/resuming session:', error);
        throw error;
      }

      this.activeSession = data;
      this.sessionStartTime = Date.now();

      console.log('🎯 Test session created/resumed:', {
        sessionId: data,
        productType,
        testMode,
        sectionName,
        totalQuestions
      });

      return data;
    } catch (error) {
      console.error('Error in createOrResumeSession:', error);
      throw new Error('Failed to create or resume test session. Please try again.');
    }
  }

  /**
   * Get session data for resumption
   */
  static async getSessionForResume(sessionId: string): Promise<TestSessionData | null> {
    try {
      const { data, error } = await supabase.rpc('get_session_for_resume', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Error getting session for resume:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const sessionData = data[0];
      console.log('📋 Session data retrieved for resume:', {
        sessionId,
        questionsAnswered: sessionData.questions_answered,
        currentIndex: sessionData.current_question_index
      });

      return {
        sessionId: sessionData.session_id,
        userId: sessionData.user_id,
        productType: sessionData.product_type,
        testMode: sessionData.test_mode,
        sectionName: sessionData.section_name,
        currentQuestionIndex: sessionData.current_question_index,
        questionsAnswered: sessionData.questions_answered,
        totalQuestions: sessionData.total_questions,
        startedAt: sessionData.started_at,
        status: sessionData.status,
        sessionData: sessionData.session_data || {
          answers: {},
          flaggedQuestions: [],
          currentQuestionIndex: 0,
          lastUpdated: new Date().toISOString()
        },
        questionResponses: sessionData.question_responses || {}
      };
    } catch (error) {
      console.error('Error getting session for resume:', error);
      return null;
    }
  }

  /**
   * Update session progress after each answer
   */
  static async updateSessionProgress(
    sessionId: string,
    currentQuestionIndex: number,
    answers: Record<string, any>,
    flaggedQuestions: number[] = [],
    timeRemainingSeconds?: number
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_session_progress', {
        p_session_id: sessionId,
        p_current_question_index: currentQuestionIndex,
        p_answers: answers,
        p_flagged_questions: flaggedQuestions,
        p_time_remaining_seconds: timeRemainingSeconds
      });

      if (error) {
        console.error('Error updating session progress:', error);
        throw error;
      }

      console.log('💾 Session progress updated:', {
        sessionId,
        currentIndex: currentQuestionIndex,
        answersCount: Object.keys(answers).length,
        flaggedCount: flaggedQuestions.length
      });
    } catch (error) {
      console.error('Error in updateSessionProgress:', error);
      // Don't throw to avoid disrupting user experience
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
        config.questionCount
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
} 