import { supabase } from '@/integrations/supabase/client';

export interface DrillSessionData {
  sessionId: string;
  userId: string;
  subSkillId: string; // This will be a UUID string
  productType: string;
  difficulty: number;
  status: string;
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
  questionIds: string[];
  answersData: Record<string, string>;
  startedAt: string;
  completedAt?: string;
}

export class DrillSessionService {
  /**
   * Create or resume a drill session
   */
  static async createOrResumeSession(
    userId: string,
    subSkillId: string,
    productType: string,
    difficulty: number,
    questionIds: string[],
    questionsTotal: number
  ): Promise<string> {
    try {
      console.log('🎯 DRILL: Creating/resuming session:', {
        userId,
        subSkillId,
        productType,
        difficulty,
        questionCount: questionsTotal
      });

      const { data, error } = await supabase.rpc('create_or_resume_drill_session', {
        p_user_id: userId,
        p_sub_skill_id: subSkillId,
        p_product_type: productType,
        p_difficulty: difficulty,
        p_question_ids: questionIds,
        p_questions_total: questionsTotal
      });

      if (error) {
        console.error('Database error creating drill session:', error);
        throw new Error(`Failed to create drill session: ${error.message}`);
      }

      if (!data) {
        throw new Error('No session ID returned from database');
      }

      console.log('✅ DRILL: Session created/resumed:', data);
      return data;
    } catch (error) {
      console.error('Failed to create/resume drill session:', error);
      throw error;
    }
  }

  /**
   * Get drill session for resuming
   */
  static async getSessionForResume(sessionId: string): Promise<DrillSessionData | null> {
    try {
      console.log('🔄 DRILL: Getting session for resume:', sessionId);

      const { data, error } = await supabase.rpc('get_drill_session_for_resume', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Database error getting drill session:', error);
        throw new Error(`Failed to get drill session: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('No drill session found for ID:', sessionId);
        return null;
      }

      const sessionData = data[0];
      
      console.log('✅ DRILL: Session retrieved for resume:', {
        sessionId: sessionData.session_id,
        questionsAnswered: sessionData.questions_answered,
        questionsTotal: sessionData.questions_total,
        status: sessionData.status
      });

      return {
        sessionId: sessionData.session_id,
        userId: sessionData.user_id,
        subSkillId: sessionData.sub_skill_id,
        productType: sessionData.product_type,
        difficulty: sessionData.difficulty,
        status: sessionData.status,
        questionsTotal: sessionData.questions_total,
        questionsAnswered: sessionData.questions_answered,
        questionsCorrect: sessionData.questions_correct,
        questionIds: sessionData.question_ids || [],
        answersData: sessionData.answers_data || {},
        startedAt: sessionData.started_at,
        completedAt: sessionData.completed_at
      };
    } catch (error) {
      console.error('Failed to get drill session for resume:', error);
      throw error;
    }
  }

  /**
   * Update drill session progress
   */
  static async updateProgress(
    sessionId: string,
    questionsAnswered: number,
    questionsCorrect: number,
    answersData: Record<string, string>
  ): Promise<void> {
    try {
      console.log('💾 DRILL: Updating progress:', {
        sessionId,
        questionsAnswered,
        questionsCorrect,
        answersCount: Object.keys(answersData).length
      });

      const { error } = await supabase.rpc('update_drill_session_progress', {
        p_session_id: sessionId,
        p_questions_answered: questionsAnswered,
        p_questions_correct: questionsCorrect,
        p_answers_data: answersData
      });

      if (error) {
        console.error('Database error updating drill progress:', error);
        throw new Error(`Failed to update drill progress: ${error.message}`);
      }

      console.log('✅ DRILL: Progress updated successfully');
    } catch (error) {
      console.error('Failed to update drill progress:', error);
      throw error;
    }
  }

  /**
   * Complete drill session
   */
  static async completeSession(
    sessionId: string,
    questionsAnswered: number,
    questionsCorrect: number,
    answersData: Record<string, string>
  ): Promise<void> {
    try {
      console.log('🏁 DRILL: Completing session:', {
        sessionId,
        questionsAnswered,
        questionsCorrect,
        accuracy: questionsAnswered > 0 ? Math.round((questionsCorrect / questionsAnswered) * 100) : 0
      });

      const { error } = await supabase.rpc('complete_drill_session', {
        p_session_id: sessionId,
        p_questions_answered: questionsAnswered,
        p_questions_correct: questionsCorrect,
        p_answers_data: answersData
      });

      if (error) {
        console.error('Database error completing drill session:', error);
        throw new Error(`Failed to complete drill session: ${error.message}`);
      }

      console.log('✅ DRILL: Session completed successfully');
    } catch (error) {
      console.error('Failed to complete drill session:', error);
      throw error;
    }
  }

  /**
   * Get active drill session for a specific sub-skill and difficulty
   */
  static async getActiveSession(
    userId: string,
    subSkillId: string,
    difficulty: number,
    productType: string
  ): Promise<{
    sessionId: string;
    status: string;
    questionsAnswered: number;
    questionsTotal: number;
    questionsCorrect: number;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_active_drill_session', {
        p_user_id: userId,
        p_sub_skill_id: subSkillId,
        p_difficulty: difficulty,
        p_product_type: productType
      });

      if (error) {
        console.error('Database error getting active drill session:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const session = data[0];
      return {
        sessionId: session.session_id,
        status: session.status,
        questionsAnswered: session.questions_answered,
        questionsTotal: session.questions_total,
        questionsCorrect: session.questions_correct
      };
    } catch (error) {
      console.error('Failed to get active drill session:', error);
      return null;
    }
  }

  /**
   * Record individual question response for drill
   */
  static async recordQuestionResponse(
    userId: string,
    questionId: string,
    sessionId: string,
    productType: string,
    userAnswer: string,
    isCorrect: boolean,
    timeSpentSeconds: number,
    isFlagged: boolean = false,
    isSkipped: boolean = false
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('record_question_response', {
        p_user_id: userId,
        p_question_id: questionId,
        p_test_session_id: sessionId,
        p_product_type: productType,
        p_user_answer: userAnswer,
        p_is_correct: isCorrect,
        p_time_spent_seconds: timeSpentSeconds,
        p_is_flagged: isFlagged,
        p_is_skipped: isSkipped
      });

      if (error) {
        console.error('Error recording drill question response:', error);
        throw error;
      }

      console.log('📝 DRILL: Question response recorded:', {
        sessionId,
        questionId,
        answer: userAnswer,
        isCorrect,
        timeSpent: timeSpentSeconds
      });
    } catch (error) {
      console.error('Error recording drill question response:', error);
      // Don't throw error to avoid disrupting drill flow
    }
  }
}