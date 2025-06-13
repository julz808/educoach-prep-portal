import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserProgress = Database['public']['Tables']['user_progress']['Row'];
type UserSubSkillPerformance = Database['public']['Tables']['user_sub_skill_performance']['Row'];

export interface DashboardStats {
  total_questions_completed: number;
  total_study_time_seconds: number;
  overall_accuracy: number;
  streak_days: number;
  diagnostic_completed: boolean;
  diagnostic_score: number | null;
  practice_tests_completed: number[];
  last_activity_at: string;
}

export interface SubSkillPerformance {
  section_name: string;
  sub_skill_name: string;
  questions_attempted: number;
  questions_correct: number;
  accuracy_percentage: number;
  last_updated: string;
}

export class UserProgressService {
  /**
   * Initialize user progress for a product type
   */
  static async initializeUserProgress(
    userId: string,
    productType: string
  ): Promise<void> {
    const { error } = await supabase.rpc('initialize_user_progress', {
      p_user_id: userId,
      p_product_type: productType
    });

    if (error) {
      console.error('Error initializing user progress:', error);
      throw error;
    }
  }

  /**
   * Record a question response and update performance tracking
   */
  static async recordQuestionResponse(params: {
    userId: string;
    questionId: string;
    sessionId: string;
    productType: string;
    answer: string;
    isCorrect: boolean;
    timeSpentSeconds?: number;
  }): Promise<void> {
    const { error } = await supabase.rpc('record_question_response', {
      p_user_id: params.userId,
      p_question_id: params.questionId,
      p_session_id: params.sessionId,
      p_product_type: params.productType,
      p_answer: params.answer,
      p_is_correct: params.isCorrect,
      p_time_spent: params.timeSpentSeconds || 0
    } as any);

    if (error) {
      console.error('Error recording question response:', error);
      throw error;
    }
  }

  /**
   * Complete a test session and update progress
   */
  static async completeTestSession(params: {
    sessionId: string;
    userId: string;
    productType: string;
    testMode: string;
    sectionScores?: Record<string, any>;
  }): Promise<void> {
    const { error } = await supabase.rpc('complete_test_session', {
      p_session_id: params.sessionId,
      p_user_id: params.userId,
      p_product_type: params.productType,
      p_test_mode: params.testMode,
      p_section_scores: params.sectionScores || null
    } as any);

    if (error) {
      console.error('Error completing test session:', error);
      throw error;
    }
  }

  /**
   * Get user dashboard statistics
   */
  static async getDashboardStats(
    userId: string,
    productType: string
  ): Promise<DashboardStats> {
    const { data, error } = await supabase.rpc('get_user_dashboard_stats', {
      p_user_id: userId,
      p_product_type: productType
    });

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }

    // Handle the returned data - it might be an array with one item
    if (Array.isArray(data) && data.length > 0) {
      const stats = data[0] as any;
      return {
        total_questions_completed: stats.total_questions_completed || 0,
        total_study_time_seconds: stats.total_study_time_seconds || 0,
        overall_accuracy: stats.overall_accuracy || 0,
        streak_days: stats.streak_days || 0,
        diagnostic_completed: stats.diagnostic_completed || false,
        diagnostic_score: stats.diagnostic_score || null,
        practice_tests_completed: stats.practice_tests_completed || [],
        last_activity_at: stats.last_activity_at || ''
      };
    }

    return {
      total_questions_completed: 0,
      total_study_time_seconds: 0,
      overall_accuracy: 0,
      streak_days: 0,
      diagnostic_completed: false,
      diagnostic_score: null,
      practice_tests_completed: [],
      last_activity_at: ''
    };
  }

  /**
   * Get detailed sub-skill performance
   */
  static async getSubSkillPerformance(
    userId: string,
    productType: string
  ): Promise<SubSkillPerformance[]> {
    const { data, error } = await supabase.rpc('get_sub_skill_performance', {
      p_user_id: userId,
      p_product_type: productType
    });

    if (error) {
      console.error('Error fetching sub-skill performance:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      section_name: item.section_name || '',
      sub_skill_name: item.sub_skill_name || '',
      questions_attempted: item.questions_attempted || 0,
      questions_correct: item.questions_correct || 0,
      accuracy_percentage: item.accuracy_percentage || 0,
      last_updated: item.last_updated || ''
    }));
  }

  /**
   * Update user streak
   */
  static async updateUserStreak(
    userId: string,
    productType: string
  ): Promise<void> {
    const { error } = await supabase.rpc('update_user_streak', {
      p_user_id: userId,
      p_product_type: productType
    });

    if (error) {
      console.error('Error updating user streak:', error);
      throw error;
    }
  }

  /**
   * Get user progress record
   */
  static async getUserProgress(
    userId: string,
    productType: string
  ): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', productType)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user progress:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get all user progress records for a user
   */
  static async getAllUserProgress(userId: string): Promise<UserProgress[]> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Error fetching all user progress:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get recent question responses for analysis
   */
  static async getRecentResponses(
    userId: string,
    productType: string,
    limit: number = 50
  ) {
    const { data, error } = await supabase
      .from('user_question_responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent responses:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get accuracy trends over time
   */
  static async getAccuracyTrends(
    userId: string,
    productType: string,
    days: number = 30
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('user_question_responses')
      .select('created_at, is_correct')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching accuracy trends:', error);
      throw error;
    }

    return data || [];
  }

  static async updateUserProgress(userId: string, progress: any) {
    // Placeholder implementation
    return true;
  }
}

export default UserProgressService; 