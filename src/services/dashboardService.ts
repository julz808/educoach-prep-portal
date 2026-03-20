/**
 * Dashboard Service
 * 
 * Comprehensive service for fetching real user dashboard metrics from Supabase.
 * Uses optimal data sources for each metric to ensure accuracy and performance.
 */

import { supabase } from '@/integrations/supabase/client';

// CRITICAL: Use the same questions table as test loading
const USE_V2_QUESTIONS = import.meta.env.VITE_USE_V2_QUESTIONS === 'true';
const QUESTIONS_TABLE = USE_V2_QUESTIONS ? 'questions_v2' : 'questions';

export interface DashboardMetrics {
  // Hero metrics
  totalQuestionsCompleted: number;
  totalStudyTimeHours: number;
  currentStreak: number;
  averageScore: string; // percentage or '-'
  overallAccuracy: string; // percentage or '-'
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
    subSkillsCompleted: number; // Actually "attempted" sub-skills, not completed
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
    'edutest-scholarship': 'EduTest Scholarship (Year 7 Entry)',
    'acer-scholarship': 'ACER Scholarship (Year 7 Entry)'
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

  // PERFORMANCE OPTIMIZATION: Execute all independent queries in parallel
  // This reduces load time from ~2-5s to ~300-500ms
  const [
    { data: userProgress, error: progressError },
    { count: questionsAvailable },
    { data: completedSessions },
    { data: diagnosticSections },
    { data: allDiagnosticSections },
    { data: activeDiagnosticSession },
    { data: allPracticeTestSessions, error: practiceError },
    { data: testStructureData }
  ] = await Promise.all([
    // 1. Get basic user progress
    supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .single(),

    // 2. Get total questions available
    supabase
      .from(QUESTIONS_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('product_type', dbProductType),

    // 3. Get completed sessions
    supabase
      .from('user_test_sessions')
      .select('final_score, test_mode, section_name')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('status', 'completed')
      .not('final_score', 'is', null),

    // 4. Get diagnostic sections
    supabase
      .from('user_test_sessions')
      .select('section_name')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('test_mode', 'diagnostic')
      .eq('status', 'completed'),

    // 5. Get all diagnostic sections
    supabase
      .from(QUESTIONS_TABLE)
      .select('section_name')
      .eq('product_type', dbProductType)
      .eq('test_mode', 'diagnostic'),

    // 6. Check for active diagnostic session
    supabase
      .from('user_test_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('test_mode', 'diagnostic')
      .eq('status', 'active')
      .limit(1)
      .single(),

    // 7. Get all practice test sessions
    supabase
      .from('user_test_sessions')
      .select('test_number, section_name, test_mode, status, created_at')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .order('created_at'),

    // 8. Get test structure to know sections per practice test
    supabase
      .from(QUESTIONS_TABLE)
      .select('section_name, test_mode')
      .eq('product_type', dbProductType)
      .not('section_name', 'is', null)
  ]);

  console.log('📊 DASHBOARD: User progress query result:', { userProgress, progressError });

  // If no user_progress record exists, it means the user hasn't done any activities yet
  if (progressError && progressError.code === 'PGRST116') {
    console.log('📊 DASHBOARD: No user_progress record found, user has not started any activities yet');
  } else if (progressError) {
    console.error('📊 DASHBOARD: Error fetching user progress:', progressError);
  }
  
  let averageScore = '-';
  if (completedSessions && completedSessions.length > 0) {
    // Filter for diagnostic and practice sessions only and get ALL section scores
    const practiceAndDiagnosticSessions = completedSessions.filter(s => 
      s.test_mode === 'diagnostic' || 
      s.test_mode === 'practice' || 
      s.test_mode?.startsWith('practice_')
    );
    
    const scores = practiceAndDiagnosticSessions
      .map(s => s.final_score)
      .filter((score): score is number => typeof score === 'number');
    
    if (scores.length > 0) {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      averageScore = Math.round(avg).toString();
      console.log('📊 DASHBOARD: Average score calculated from', scores.length, 'sections:', averageScore);
    }
  }
  
  // 3b. Calculate overall accuracy from user_progress (auto-calculated by trigger)
  let overallAccuracy = '-';
  if (userProgress?.overall_accuracy !== null && userProgress?.overall_accuracy !== undefined) {
    overallAccuracy = Math.round(userProgress.overall_accuracy).toString();
  } else {
    console.log('📊 DASHBOARD: No overall_accuracy in user_progress, calculating manually...');
    
    // Fallback: Calculate accuracy manually from all completed sessions
    if (completedSessions && completedSessions.length > 0) {
      const practiceAndDiagnosticSessions = completedSessions.filter(s => 
        s.test_mode === 'diagnostic' || 
        s.test_mode === 'practice' || 
        s.test_mode?.startsWith('practice_')
      );
      
      if (practiceAndDiagnosticSessions.length > 0) {
        const totalScore = practiceAndDiagnosticSessions.reduce((sum, s) => sum + (s.final_score || 0), 0);
        const avgAccuracy = totalScore / practiceAndDiagnosticSessions.length;
        overallAccuracy = Math.round(avgAccuracy).toString();
        console.log('📊 DASHBOARD: Calculated overall accuracy:', overallAccuracy);
      }
    }
  }

  // 4. Diagnostic progress - count unique completed sections (using parallelized data)
  const uniqueDiagnosticSections = [...new Set(diagnosticSections?.map(s => s.section_name) || [])];
  const totalDiagnosticSections = [...new Set(allDiagnosticSections?.map(s => s.section_name) || [])].length;

  // 5. Practice tests progress - check for FULLY completed practice tests (all sections done)
  // (using parallelized data from allPracticeTestSessions)
  
  // Filter for practice sessions only
  const practiceSessionsOnly = allPracticeTestSessions?.filter(s => 
    s.test_mode === 'practice' || s.test_mode?.startsWith('practice_')
  ) || [];
  
  console.log('📊 DASHBOARD: All practice sessions:', practiceSessionsOnly);
  console.log('📊 DASHBOARD: Raw ALL test sessions (first 10):', allPracticeTestSessions?.slice(0, 10).map(s => ({
    test_mode: s.test_mode,
    test_number: s.test_number,
    section_name: s.section_name,
    status: s.status,
    created_at: s.created_at
  })));
  
  console.log('📊 DASHBOARD: Filtered practice sessions only:', practiceSessionsOnly.map(s => ({
    test_mode: s.test_mode,
    test_number: s.test_number,
    section_name: s.section_name,
    status: s.status
  })));
  
  console.log('📊 DASHBOARD: User has sessions with these test identifiers:',
    [...new Set(practiceSessionsOnly.map(s =>
      s.test_mode?.startsWith('practice_') ? s.test_mode : s.test_number || 'practice_1'
    ))]
  );

  // Group by test mode to see section counts (using parallelized testStructureData)
  const testModeStructure = new Map<string, Set<string>>();
  testStructureData?.forEach(q => {
    if (q.test_mode?.startsWith('practice_') || q.test_mode === 'practice') {
      if (!testModeStructure.has(q.test_mode)) {
        testModeStructure.set(q.test_mode, new Set());
      }
      testModeStructure.get(q.test_mode)!.add(q.section_name);
    }
  });
  
  const structureForLogging = Object.fromEntries(Array.from(testModeStructure.entries()).map(([mode, sections]) => 
    [mode, Array.from(sections)]
  ));
  console.log('📊 DASHBOARD: Practice test structure by mode:', structureForLogging);
  console.log('📊 DASHBOARD: Available practice test modes in questions table:', Object.keys(structureForLogging));
  
  // Group user sessions by practice test identifier
  const practiceTestGroups = new Map<string, any[]>();
  
  practiceSessionsOnly.forEach(session => {
    const testId = session.test_mode?.startsWith('practice_') 
      ? session.test_mode 
      : session.test_number || 'practice_1';
    
    if (!practiceTestGroups.has(testId)) {
      practiceTestGroups.set(testId, []);
    }
    practiceTestGroups.get(testId)!.push(session);
  });
  
  // Count practice tests where ALL sections for that test mode are completed
  let completedPracticeTests = 0;
  
  // If no practice test structure exists in questions table, use a fallback approach
  const hasQuestionStructure = testModeStructure.size > 0;
  
  if (hasQuestionStructure) {
    // Use the questions table structure to validate completion
    for (const [testId, sessions] of practiceTestGroups) {
      const completedSections = sessions
        .filter(s => s.status === 'completed')
        .map(s => s.section_name);
      
      const requiredSectionsForThisTest = testModeStructure.get(testId);
      
      if (requiredSectionsForThisTest) {
        const hasAllSections = Array.from(requiredSectionsForThisTest).every(required => 
          completedSections.includes(required)
        );
        
        if (hasAllSections) {
          completedPracticeTests++;
        }
        
        console.log(`📊 DASHBOARD: Practice test ${testId}:`, {
          totalSessions: sessions.length,
          completedSections,
          requiredSections: Array.from(requiredSectionsForThisTest),
          hasAllSections
        });
      }
    }
  } else {
    // Fallback: No questions structure exists, so use default section requirements
    console.log('📊 DASHBOARD: No practice questions found in database, using fallback logic with default sections');
    
    // Default sections that practice tests typically have
    const defaultSections = ['Reading Comprehension', 'Mathematics', 'Writing', 'General Ability'];
    
    for (const [testId, sessions] of practiceTestGroups) {
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const completedSections = completedSessions.map(s => s.section_name);
      const uniqueCompletedSections = [...new Set(completedSections)];
      
      // For practice tests, we expect at least 3-4 main sections to be completed
      // Use a more conservative approach: require at least 3 different sections to be completed
      const hasMinimumSections = uniqueCompletedSections.length >= 3;
      
      console.log(`📊 DASHBOARD: Practice test ${testId} (fallback):`, {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        completedSections: uniqueCompletedSections,
        hasMinimumSections
      });
      
      // Only count as complete if multiple sections are finished (not just one)
      if (hasMinimumSections) {
        completedPracticeTests++;
        console.log(`📊 DASHBOARD: Counting practice test ${testId} as completed (fallback - ${uniqueCompletedSections.length} sections)`);
      }
    }
  }
  
  console.log('📊 DASHBOARD: Final practice test count:', completedPracticeTests);

  // PERFORMANCE OPTIMIZATION: Execute second batch of independent queries in parallel
  const [
    { data: allActiveSessions },
    { data: attemptedDrillSessions },
    { data: allSubSkills },
    { data: activeDrillSession },
    { data: testSessions },
    { data: drillSessions }
  ] = await Promise.all([
    // Check for active practice session
    supabase
      .from('user_test_sessions')
      .select('id, test_mode')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('status', 'active'),

    // 6. Drill progress - count attempted sub-skills
    supabase
      .from('drill_sessions')
      .select('question_ids')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .in('status', ['completed', 'active']),

    // Get total available sub-skills
    supabase
      .from(QUESTIONS_TABLE)
      .select('sub_skill')
      .eq('product_type', dbProductType)
      .eq('test_mode', 'drill')
      .not('sub_skill', 'is', null),

    // Check for active drill session
    supabase
      .from('drill_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('status', 'active')
      .limit(1)
      .single(),

    // 7. Count answers from test sessions (diagnostic + practice)
    supabase
      .from('user_test_sessions')
      .select('answers_data, text_answers_data')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('status', 'completed'),

    // Count answers from drill sessions
    supabase
      .from('drill_sessions')
      .select('answers_data')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('status', 'completed')
  ]);

  const activePracticeSession = allActiveSessions?.find(s =>
    s.test_mode === 'practice' || s.test_mode?.startsWith('practice_')
  ) || null;

  // Get sub-skill names from questions that were attempted in drill sessions
  const attemptedQuestionIds = new Set<string>();
  attemptedDrillSessions?.forEach(session => {
    if (session.question_ids && Array.isArray(session.question_ids)) {
      session.question_ids.forEach(id => attemptedQuestionIds.add(id));
    }
  });

  let uniqueAttemptedSubSkills = 0;
  if (attemptedQuestionIds.size > 0) {
    const { data: attemptedQuestions } = await supabase
      .from(QUESTIONS_TABLE)
      .select('sub_skill')
      .in('id', Array.from(attemptedQuestionIds))
      .not('sub_skill', 'is', null);

    uniqueAttemptedSubSkills = [...new Set(attemptedQuestions?.map(q => q.sub_skill) || [])].length;
  }

  const totalSubSkills = [...new Set(allSubSkills?.map(q => q.sub_skill) || [])].length;

  let testQuestionCount = 0;
  testSessions?.forEach(session => {
    const mcAnswers = session.answers_data ? Object.keys(session.answers_data).length : 0;
    const textAnswers = session.text_answers_data ? Object.keys(session.text_answers_data).length : 0;
    testQuestionCount += mcAnswers + textAnswers;
  });
  
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
      subSkillsCompleted: uniqueAttemptedSubSkills,
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