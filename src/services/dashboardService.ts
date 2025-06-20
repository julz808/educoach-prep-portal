/**
 * Dashboard Service
 * 
 * Comprehensive service for fetching real user dashboard metrics from Supabase.
 * Uses optimal data sources for each metric to ensure accuracy and performance.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  // Hero metrics
  totalQuestionsCompleted: number;
  totalStudyTimeHours: number;
  currentStreak: number;
  averageScore: string; // percentage or '-'
  questionsAvailable: number;
  lastActivityDate: string | null;
  
  // Test mode progress
  diagnostic: {
    sectionsCompleted: number;
    totalSections: number;
    hasActiveSession: boolean;
    activeSessionId: string | null;
  };
  
  practice: {
    testsCompleted: number;
    totalTests: number;
    hasActiveSession: boolean;
    activeSessionId: string | null;
  };
  
  drill: {
    subSkillsCompleted: number;
    totalSubSkills: number;
    hasActiveSession: boolean;
    activeSessionId: string | null;
  };
}

export interface RecentActivity {
  id: string;
  type: 'diagnostic' | 'practice' | 'drill';
  sectionName: string;
  questionsAnswered: number;
  score: number | null;
  date: string;
  timeSpent: number; // in seconds
}

// Map frontend product IDs to database product_type values
const getDbProductType = (productId: string): string => {
  const productMap: Record<string, string> = {
    'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
    'nsw-selective': 'NSW Selective Entry (Year 7 Entry)', 
    'year-5-naplan': 'Year 5 NAPLAN',
    'year-7-naplan': 'Year 7 NAPLAN',
    'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
    'acer-year-7': 'ACER Scholarship (Year 7 Entry)'
  };
  return productMap[productId] || productId;
};

/**
 * Fetch comprehensive dashboard metrics for a user and product
 */
export async function fetchDashboardMetrics(
  userId: string,
  productId: string
): Promise<DashboardMetrics> {
  const dbProductType = getDbProductType(productId);
  
  console.log('📊 DASHBOARD: Fetching metrics for user:', userId, 'product:', dbProductType);
  
  // 1. Get basic user progress (auto-updated by triggers)
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .single();
  
  console.log('📊 DASHBOARD: User progress data:', userProgress);
  
  // 2. Get total questions available for this product
  const { count: questionsAvailable } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('product_type', dbProductType);
  
  // 3. Calculate average score from completed test sessions (diagnostic and practice only)
  const { data: completedSessions } = await supabase
    .from('user_test_sessions')
    .select('final_score, test_mode')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('status', 'completed')
    .in('test_mode', ['diagnostic', 'practice'])
    .not('final_score', 'is', null);
  
  let averageScore = '-';
  if (completedSessions && completedSessions.length > 0) {
    const scores = completedSessions
      .map(s => s.final_score)
      .filter((score): score is number => typeof score === 'number');
    
    if (scores.length > 0) {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      averageScore = Math.round(avg).toString();
    }
  }
  
  // 3b. Calculate overall accuracy from user_progress (auto-calculated by trigger)
  let overallAccuracy = '-';
  if (userProgress?.overall_accuracy !== null && userProgress?.overall_accuracy !== undefined) {
    overallAccuracy = Math.round(userProgress.overall_accuracy).toString();
  }
  
  // 4. Diagnostic progress - count unique completed sections
  const { data: diagnosticSections } = await supabase
    .from('user_test_sessions')
    .select('section_name')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('test_mode', 'diagnostic')
    .eq('status', 'completed');
  
  const uniqueDiagnosticSections = [...new Set(diagnosticSections?.map(s => s.section_name) || [])];
  
  // Get total available diagnostic sections
  const { data: allDiagnosticSections } = await supabase
    .from('questions')
    .select('section_name')
    .eq('product_type', dbProductType)
    .eq('test_mode', 'diagnostic');
  
  const totalDiagnosticSections = [...new Set(allDiagnosticSections?.map(s => s.section_name) || [])].length;
  
  // Check for active diagnostic session
  const { data: activeDiagnosticSession } = await supabase
    .from('user_test_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('test_mode', 'diagnostic')
    .eq('status', 'active')
    .limit(1)
    .single();
  
  // 5. Practice tests progress
  const { data: practiceTestSessions } = await supabase
    .from('user_test_sessions')
    .select('section_name, test_number, created_at')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('test_mode', 'practice')
    .eq('status', 'completed')
    .order('created_at');
  
  // Group by test_number to count complete practice tests
  const testsByNumber = new Map<string, Set<string>>();
  const requiredSections = ['General Ability - Verbal', 'General Ability - Quantitative', 'Writing', 'Mathematics Reasoning', 'Reading Reasoning'];
  
  practiceTestSessions?.forEach(session => {
    const testNumber = session.test_number || 'practice_1';
    if (!testsByNumber.has(testNumber)) {
      testsByNumber.set(testNumber, new Set());
    }
    testsByNumber.get(testNumber)!.add(session.section_name);
  });
  
  const completedPracticeTests = Array.from(testsByNumber.values()).filter(
    sections => requiredSections.every(req => sections.has(req))
  ).length;
  
  // Check for active practice session
  const { data: activePracticeSession } = await supabase
    .from('user_test_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('test_mode', 'practice')
    .eq('status', 'active')
    .limit(1)
    .single();
  
  // 6. Drill progress - count completed sub-skills
  const { data: completedDrillSessions } = await supabase
    .from('drill_sessions')
    .select('sub_skill_id')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('status', 'completed');
  
  const uniqueCompletedSubSkills = [...new Set(completedDrillSessions?.map(s => s.sub_skill_id) || [])];
  
  // Get total available sub-skills
  const { data: allSubSkills } = await supabase
    .from('questions')
    .select('sub_skill_id')
    .eq('product_type', dbProductType)
    .eq('test_mode', 'drill')
    .not('sub_skill_id', 'is', null);
  
  const totalSubSkills = [...new Set(allSubSkills?.map(s => s.sub_skill_id) || [])].length;
  
  // Check for active drill session
  const { data: activeDrillSession } = await supabase
    .from('drill_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('status', 'active')
    .limit(1)
    .single();
  
  // 7. Calculate total questions completed by counting actual answers from session data
  
  // Count answers from test sessions (diagnostic + practice)
  const { data: testSessions } = await supabase
    .from('user_test_sessions')
    .select('answers_data, text_answers_data')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('status', 'completed');
  
  let testQuestionCount = 0;
  testSessions?.forEach(session => {
    const mcAnswers = session.answers_data ? Object.keys(session.answers_data).length : 0;
    const textAnswers = session.text_answers_data ? Object.keys(session.text_answers_data).length : 0;
    testQuestionCount += mcAnswers + textAnswers;
  });
  
  // Count answers from drill sessions
  const { data: drillSessions } = await supabase
    .from('drill_sessions')
    .select('answers_data')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('status', 'completed');
  
  let drillQuestionCount = 0;
  drillSessions?.forEach(session => {
    const drillAnswers = session.answers_data ? Object.keys(session.answers_data).length : 0;
    drillQuestionCount += drillAnswers;
  });
  
  const totalQuestionsCompleted = testQuestionCount + drillQuestionCount;
  
  console.log('📊 DASHBOARD: Questions calculation:', {
    testSessions: testSessions?.length || 0,
    testQuestionCount,
    drillSessions: drillSessions?.length || 0,
    drillQuestionCount,
    totalQuestionsCompleted,
    userProgressValue: userProgress?.total_questions_completed
  });
  
  // 8. Get total study time from user_progress (auto-calculated by trigger)
  const totalStudyTimeHours = userProgress?.total_study_time_seconds 
    ? Math.round((userProgress.total_study_time_seconds / 3600) * 2) / 2 
    : 0;
  
  // 7. Build final metrics object
  const metrics: DashboardMetrics = {
    // Hero metrics
    totalQuestionsCompleted,
    totalStudyTimeHours,
    currentStreak: userProgress?.streak_days ?? 0,
    averageScore,
    overallAccuracy,
    questionsAvailable: questionsAvailable ?? 0,
    lastActivityDate: userProgress?.last_activity_at ?? null,
    
    // Test mode progress
    diagnostic: {
      sectionsCompleted: uniqueDiagnosticSections.length,
      totalSections: totalDiagnosticSections,
      hasActiveSession: !!activeDiagnosticSession,
      activeSessionId: activeDiagnosticSession?.id ?? null,
    },
    
    practice: {
      testsCompleted: completedPracticeTests,
      totalTests: 5, // Standard number of practice tests
      hasActiveSession: !!activePracticeSession,
      activeSessionId: activePracticeSession?.id ?? null,
    },
    
    drill: {
      subSkillsCompleted: uniqueCompletedSubSkills.length,
      totalSubSkills,
      hasActiveSession: !!activeDrillSession,
      activeSessionId: activeDrillSession?.id ?? null,
    }
  };
  
  console.log('📊 DASHBOARD: Final metrics:', metrics);
  return metrics;
}

/**
 * Fetch recent user activity across all test modes
 */
export async function fetchRecentActivity(
  userId: string,
  productId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  const dbProductType = getDbProductType(productId);
  
  // Get recent test sessions
  const { data: recentSessions } = await supabase
    .from('user_test_sessions')
    .select('id, test_mode, section_name, questions_answered, final_score, created_at, time_spent_seconds')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .in('status', ['completed', 'active'])
    .order('created_at', { ascending: false })
    .limit(limit);
  
  // Get recent drill sessions
  const { data: recentDrills } = await supabase
    .from('drill_sessions')
    .select('id, sub_skill_id, questions_answered, questions_correct, questions_total, created_at')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .in('status', ['completed', 'active'])
    .order('created_at', { ascending: false })
    .limit(limit);
  
  const activities: RecentActivity[] = [];
  
  // Add test sessions
  recentSessions?.forEach(session => {
    activities.push({
      id: session.id,
      type: session.test_mode as 'diagnostic' | 'practice',
      sectionName: session.section_name,
      questionsAnswered: session.questions_answered || 0,
      score: session.final_score,
      date: session.created_at,
      timeSpent: session.time_spent_seconds || 0
    });
  });
  
  // Add drill sessions
  recentDrills?.forEach(drill => {
    const score = drill.questions_answered > 0 
      ? Math.round((drill.questions_correct / drill.questions_answered) * 100)
      : null;
    
    activities.push({
      id: drill.id,
      type: 'drill',
      sectionName: `Sub-skill Practice`, // Could be enhanced with actual sub-skill name
      questionsAnswered: drill.questions_answered || 0,
      score,
      date: drill.created_at,
      timeSpent: 0 // Drill sessions don't track time yet
    });
  });
  
  // Sort all activities by date and limit
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return activities.slice(0, limit);
}

/**
 * Get detailed progress for a specific test mode
 */
export async function fetchTestModeProgress(
  userId: string,
  productId: string,
  testMode: 'diagnostic' | 'practice' | 'drill'
) {
  const dbProductType = getDbProductType(productId);
  
  if (testMode === 'drill') {
    // Drill-specific progress
    const { data: drillSessions } = await supabase
      .from('drill_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .order('created_at', { ascending: false });
    
    return drillSessions;
  } else {
    // Test session progress
    const { data: testSessions } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('test_mode', testMode)
      .order('created_at', { ascending: false });
    
    return testSessions;
  }
}

/**
 * Update user progress manually (useful for testing)
 */
export async function updateUserProgress(
  userId: string,
  productId: string,
  updates: Partial<{
    totalQuestionsCompleted: number;
    totalStudyTimeSeconds: number;
    streakDays: number;
    overallAccuracy: number;
  }>
) {
  const dbProductType = getDbProductType(productId);
  
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      product_type: dbProductType,
      total_questions_completed: updates.totalQuestionsCompleted,
      total_study_time_seconds: updates.totalStudyTimeSeconds,
      streak_days: updates.streakDays,
      overall_accuracy: updates.overallAccuracy,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
  
  return data;
}