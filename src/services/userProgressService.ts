import { supabase } from '@/integrations/supabase/client';

export interface QuestionResponseParams {
  userId: string;
  questionId: string;
  sessionId: string;
  productType: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface UserProgressData {
  total_questions_completed: number;
  total_study_time_seconds: number;
  overall_accuracy: number;
  streak_days: number;
  diagnostic_completed: boolean;
  diagnostic_score: number | null;
  practice_tests_completed: number[];
  last_activity_at: string | null;
}

export interface SubSkillPerformance {
  section_name: string;
  sub_skill_name: string;
  questions_attempted: number;
  questions_correct: number;
  accuracy_percentage: number;
  last_updated: string;
}

/**
 * Record a user's response to a question with atomic updates
 */
export async function recordQuestionResponse({
  userId,
  questionId,
  sessionId,
  productType,
  answer,
  isCorrect,
  timeSpent
}: QuestionResponseParams): Promise<void> {
  const { error } = await supabase.rpc('record_question_response', {
    p_user_id: userId,
    p_question_id: questionId,
    p_session_id: sessionId,
    p_product_type: productType,
    p_answer: answer,
    p_is_correct: isCorrect,
    p_time_spent: timeSpent
  });
  
  if (error) {
    console.error('Error recording question response:', error);
    throw error;
  }
}

/**
 * Get comprehensive user progress data for dashboard
 */
export async function getUserProgress(userId: string, productType: string): Promise<UserProgressData | null> {
  const { data, error } = await supabase.rpc('get_user_dashboard_stats', {
    p_user_id: userId,
    p_product_type: productType
  });
  
  if (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
  
  return data?.[0] || null;
}

/**
 * Get detailed sub-skill performance breakdown
 */
export async function getSubSkillBreakdown(userId: string, productType: string): Promise<SubSkillPerformance[]> {
  const { data, error } = await supabase.rpc('get_sub_skill_performance', {
    p_user_id: userId,
    p_product_type: productType
  });
  
  if (error) {
    console.error('Error fetching sub-skill performance:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Complete a test session and update all related progress
 */
export async function completeTestSession(
  sessionId: string,
  userId: string,
  productType: string,
  testMode: 'diagnostic' | 'practice' | 'drill',
  sectionScores?: Record<string, number>
): Promise<void> {
  const { error } = await supabase.rpc('complete_test_session', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_product_type: productType,
    p_test_mode: testMode,
    p_section_scores: sectionScores || null
  });
  
  if (error) {
    console.error('Error completing test session:', error);
    throw error;
  }
}

/**
 * Initialize user progress for a product
 */
export async function initializeUserProgress(userId: string, productType: string): Promise<void> {
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
 * Update user activity streak
 */
export async function updateUserStreak(userId: string, productType: string): Promise<void> {
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
 * Get recent activity for insights
 */
export async function getRecentActivity(userId: string, productType: string, days: number = 7) {
  const { data, error } = await supabase
    .from('user_question_responses')
    .select(`
      created_at,
      is_correct,
      time_spent_seconds,
      questions!inner(sub_skill_id, sub_skills!inner(name, section_id, test_sections!inner(section_name)))
    `)
    .eq('user_id', userId)
    .eq('product_type', productType)
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get performance trends over time
 */
export async function getPerformanceTrends(userId: string, productType: string, days: number = 30) {
  const { data, error } = await supabase
    .from('user_question_responses')
    .select('created_at, is_correct')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching performance trends:', error);
    throw error;
  }
  
  // Group by day and calculate daily accuracy
  const dailyStats = (data || []).reduce((acc, response) => {
    const date = new Date(response.created_at).toDateString();
    if (!acc[date]) {
      acc[date] = { correct: 0, total: 0 };
    }
    acc[date].total++;
    if (response.is_correct) {
      acc[date].correct++;
    }
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);
  
  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    questionsAnswered: stats.total
  }));
} 