import { supabase } from '@/integrations/supabase/client';

// Map frontend product IDs to database product types
const PRODUCT_ID_TO_TYPE: Record<string, string> = {
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-year-7': 'ACER Scholarship (Year 7 Entry)',
  'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
  'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
  'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
};

// Get real test data using unified approach for all test types (diagnostic, practice, drill)
async function getRealTestData(userId: string, productType: string, sessionId: string, testType: string = 'practice', testNumber?: number) {
  console.log(`\n🔄 ${testType.toUpperCase()} INSIGHTS: Getting real data for session ${sessionId}`);
  console.log(`🔄 ${testType.toUpperCase()} INSIGHTS: Function called with:`, {
    userId,
    productType,
    sessionId,
    testType,
    testNumber
  });
  
  try {
    console.log(`📊 ${testType} test details:`, {
      sessionId,
      testType,
      testNumber
    });
    
    // Get ALL question attempts for this specific session
    console.log(`🔍 Querying question_attempt_history for:`, {
      userId,
      sessionId,
      sessionIdType: typeof sessionId,
      testType
    });
    
    let { data: questionAttempts, error: attemptsError } = await supabase
      .from('question_attempt_history')
      .select(`
        question_id,
        user_answer,
        is_correct,
        time_spent_seconds,
        session_id,
        user_id
      `)
      .eq('user_id', userId)
      .eq('session_id', sessionId);
    
    if (attemptsError) {
      console.error('❌ Error fetching question attempts:', attemptsError);
      return null;
    }
    
    console.log(`📊 Question attempts query result:`, {
      found: questionAttempts?.length || 0,
      sessionId,
      userId,
      error: attemptsError,
      sampleAttempt: questionAttempts?.[0]
    });
    
    if (!questionAttempts || questionAttempts.length === 0) {
      console.log(`⚠️ No question attempts found for session ${sessionId}`);
      console.log(`🔄 No granular insights available for ${testType} - session may be from before individual recording was implemented`);
      
      // Return null for old sessions without individual question attempts
      return null;
    }
    
    console.log(`📊 Found ${questionAttempts.length} question attempts for session ${sessionId}`);
    
    // Get question details for all attempted questions
    const questionIds = questionAttempts.map(attempt => attempt.question_id);
    console.log(`🔍 Getting question details for ${questionIds.length} questions`);
    
    let { data: questionDetails, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        section_name,
        sub_skill,
        test_mode,
        max_points
      `)
      .in('id', questionIds);
    
    if (questionsError) {
      console.error('❌ Error fetching question details:', questionsError);
      return null;
    }
    
    console.log(`📊 Got details for ${questionDetails?.length || 0} questions`);
    
    // Create a map for quick lookup
    const questionDetailsMap = new Map();
    questionDetails?.forEach(q => {
      questionDetailsMap.set(q.id, q);
    });
    
    // Group question attempts by sub-skill for analysis
    const subSkillStats = new Map();
    const sectionStats = new Map();
    
    let totalQuestionsAttempted = 0;
    let totalQuestionsCorrect = 0;
    let totalMaxPoints = 0;
    let totalEarnedPoints = 0;
    
    questionAttempts.forEach(attempt => {
      const question = questionDetailsMap.get(attempt.question_id);
      if (!question) {
        console.warn(`⚠️ No question details found for question ${attempt.question_id}`);
        return;
      }
      
      const subSkillName = question.sub_skill || 'Unknown Sub-skill';
      const sectionName = question.section_name || 'Unknown Section';
      const maxPoints = question.max_points || 1;
      const earnedPoints = attempt.is_correct ? maxPoints : 0;
      
      // Track overall totals
      totalQuestionsAttempted++;
      totalMaxPoints += maxPoints;
      totalEarnedPoints += earnedPoints;
      if (attempt.is_correct) {
        totalQuestionsCorrect++;
      }
      
      // Track by sub-skill
      if (!subSkillStats.has(subSkillName)) {
        subSkillStats.set(subSkillName, {
          subSkillName,
          sectionName,
          questionsTotal: 0,
          questionsAttempted: 0,
          questionsCorrect: 0,
          maxPoints: 0,
          earnedPoints: 0
        });
      }
      
      const subSkillData = subSkillStats.get(subSkillName);
      subSkillData.questionsTotal++;
      subSkillData.questionsAttempted++;
      subSkillData.maxPoints += maxPoints;
      subSkillData.earnedPoints += earnedPoints;
      if (attempt.is_correct) {
        subSkillData.questionsCorrect++;
      }
      
      // Track by section
      if (!sectionStats.has(sectionName)) {
        sectionStats.set(sectionName, {
          sectionName,
          questionsTotal: 0,
          questionsAttempted: 0,
          questionsCorrect: 0,
          maxPoints: 0,
          earnedPoints: 0
        });
      }
      
      const sectionData = sectionStats.get(sectionName);
      sectionData.questionsTotal++;
      sectionData.questionsAttempted++;
      sectionData.maxPoints += maxPoints;
      sectionData.earnedPoints += earnedPoints;
      if (attempt.is_correct) {
        sectionData.questionsCorrect++;
      }
    });
    
    // Build section breakdown
    const sectionBreakdown = Array.from(sectionStats.values()).map(section => ({
      sectionName: section.sectionName,
      score: section.maxPoints > 0 ? Math.round((section.earnedPoints / section.maxPoints) * 100) : 0,
      accuracy: section.questionsAttempted > 0 ? Math.round((section.questionsCorrect / section.questionsAttempted) * 100) : 0,
      questionsCorrect: section.questionsCorrect, // Use actual correct question count for display
      questionsTotal: section.questionsTotal, // Use actual total question count for display
      questionsAttempted: section.questionsAttempted
    }));
    
    // Build sub-skill breakdown
    const subSkillBreakdown = Array.from(subSkillStats.values()).map(subSkill => ({
      sectionName: subSkill.sectionName,
      subSkillName: subSkill.subSkillName,
      score: subSkill.maxPoints > 0 ? Math.round((subSkill.earnedPoints / subSkill.maxPoints) * 100) : 0,
      accuracy: subSkill.questionsAttempted > 0 ? Math.round((subSkill.questionsCorrect / subSkill.questionsAttempted) * 100) : 0,
      questionsCorrect: subSkill.questionsCorrect, // Use actual correct question count for display
      questionsTotal: subSkill.questionsTotal, // Use actual total question count for display
      questionsAttempted: subSkill.questionsAttempted
    }));
    
    // Build section scores map
    const sectionScores = Object.fromEntries(
      sectionBreakdown.map(section => [section.sectionName, section.score])
    );
    
    // Calculate overall scores using question counts for consistency with display
    const overallScore = totalMaxPoints > 0 ? Math.round((totalEarnedPoints / totalMaxPoints) * 100) : 0;
    const overallAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100) : 0;
    
    console.log(`📊 Overall calculation details:`, {
      totalMaxPoints,
      totalEarnedPoints,
      totalQuestionsAttempted,
      totalQuestionsCorrect,
      overallScore,
      overallAccuracy
    });
    
    console.log(`🎯 ${testType.toUpperCase()} RESULTS:`, {
      sessionId,
      totalMaxPoints,
      totalEarnedPoints,
      totalQuestionsAttempted,
      totalQuestionsCorrect,
      overallScore,
      overallAccuracy,
      sectionCount: sectionBreakdown.length,
      subSkillCount: subSkillBreakdown.length
    });
    
    console.log(`📊 Section breakdown:`, sectionBreakdown.map(s => 
      `${s.sectionName}: ${s.questionsCorrect}/${s.questionsTotal} = ${s.score}%`
    ));
    
    return {
      totalQuestions: totalQuestionsAttempted,
      questionsAttempted: totalQuestionsAttempted,
      questionsCorrect: totalQuestionsCorrect,
      totalMaxPoints,
      totalEarnedPoints,
      overallScore,
      overallAccuracy,
      sectionScores,
      sectionBreakdown,
      subSkillBreakdown,
    };
    
  } catch (error) {
    console.error(`❌ Error in getRealTestData for ${testType}:`, error);
    console.error(`❌ Error details:`, {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return null;
  }
}

// Fallback function to get practice test data from session data when no question attempts exist
async function getSessionBasedPracticeData(userId: string, productType: string, testNumber: number, session: any) {
  console.log(`🔄 SESSION-BASED APPROACH: Getting data from session for test ${testNumber}`);
  
  try {
    const practiceTestMode = `practice_${testNumber}`;
    
    // Get the questions for this practice test mode to have structure info
    let { data: practiceQuestions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        section_name,
        sub_skill,
        test_mode,
        format,
        max_points,
        correct_answer,
        sub_skills!inner(
          name,
          test_sections!inner(section_name)
        )
      `)
      .eq('product_type', productType)
      .eq('test_mode', practiceTestMode);
    
    if (questionsError || !practiceQuestions || practiceQuestions.length === 0) {
      console.error('❌ Error fetching practice questions:', questionsError);
      // Fallback to generic practice mode
      const { data: genericQuestions, error: genericError } = await supabase
        .from('questions')
        .select(`
          id,
          section_name,
          sub_skill,
          test_mode,
          format,
          max_points,
          correct_answer,
          sub_skills!inner(
            name,
            test_sections!inner(section_name)
          )
        `)
        .eq('product_type', productType)
        .eq('test_mode', 'practice');
      
      if (genericError || !genericQuestions || genericQuestions.length === 0) {
        console.error('❌ No practice questions found at all');
        return null;
      }
      
      practiceQuestions = genericQuestions;
    }
    
    console.log(`📊 Found ${practiceQuestions.length} practice questions for structure`);
    
    // Use session data for calculations
    const questionOrder = session.question_order || [];
    const answersData = session.answers_data || {};
    const totalQuestions = session.total_questions || questionOrder.length || practiceQuestions.length;
    const questionsAnswered = session.questions_answered || Object.keys(answersData).length;
    const correctAnswers = session.correct_answers || 0;
    const finalScore = session.final_score || 0;
    
    // For existing sessions without detailed data, use the practice questions structure
    const totalMaxPoints = practiceQuestions.reduce((sum, q) => sum + (q.max_points || 1), 0);
    const estimatedCorrectPoints = Math.round((finalScore / 100) * totalMaxPoints);
    
    console.log(`📊 Session data summary:`, {
      totalQuestions,
      questionsAnswered,
      correctAnswers,
      finalScore,
      questionOrderLength: questionOrder.length,
      answersDataKeys: Object.keys(answersData).length
    });
    
    // Create section breakdown using available questions and session score
    const sectionStats = new Map();
    
    // Group questions by section
    practiceQuestions.forEach(question => {
      const sectionName = question.section_name || question.sub_skills?.test_sections?.section_name || 'Unknown Section';
      const maxPoints = question.max_points || 1;
      
      if (!sectionStats.has(sectionName)) {
        sectionStats.set(sectionName, {
          sectionName,
          totalQuestions: 0,
          maxPoints: 0,
          questionIds: []
        });
      }
      
      const stats = sectionStats.get(sectionName);
      stats.totalQuestions++;
      stats.maxPoints += maxPoints;
      stats.questionIds.push(question.id);
    });
    
    // Distribute the session's performance across sections proportionally
    const sectionBreakdown = Array.from(sectionStats.values()).map(section => {
      const sectionProportion = section.maxPoints / totalMaxPoints;
      const sectionCorrectPoints = Math.round(estimatedCorrectPoints * sectionProportion);
      const estimatedAttempted = Math.round(questionsAnswered * sectionProportion);
      const score = section.maxPoints > 0 ? Math.round((sectionCorrectPoints / section.maxPoints) * 100) : 0;
      const accuracy = estimatedAttempted > 0 ? Math.round((sectionCorrectPoints / estimatedAttempted) * 100) : 0;
      
      return {
        sectionName: section.sectionName,
        score,
        accuracy,
        questionsCorrect: sectionCorrectPoints,
        questionsTotal: section.maxPoints,
        questionsAttempted: estimatedAttempted
      };
    });
    
    // Create sub-skill breakdown
    const subSkillStats = new Map();
    
    practiceQuestions.forEach(question => {
      const subSkillName = question.sub_skills?.name || question.sub_skill || 'Unknown Sub-skill';
      const sectionName = question.section_name || question.sub_skills?.test_sections?.section_name || 'Unknown Section';
      const maxPoints = question.max_points || 1;
      
      if (!subSkillStats.has(subSkillName)) {
        subSkillStats.set(subSkillName, {
          subSkillName,
          sectionName,
          totalQuestions: 0,
          maxPoints: 0
        });
      }
      
      const stats = subSkillStats.get(subSkillName);
      stats.totalQuestions++;
      stats.maxPoints += maxPoints;
    });
    
    const subSkillBreakdown = Array.from(subSkillStats.values()).map(subSkill => {
      const subSkillProportion = subSkill.maxPoints / totalMaxPoints;
      const subSkillCorrectPoints = Math.round(estimatedCorrectPoints * subSkillProportion);
      const estimatedAttempted = Math.round(questionsAnswered * subSkillProportion);
      const score = subSkill.maxPoints > 0 ? Math.round((subSkillCorrectPoints / subSkill.maxPoints) * 100) : 0;
      const accuracy = estimatedAttempted > 0 ? Math.round((subSkillCorrectPoints / estimatedAttempted) * 100) : 0;
      
      return {
        sectionName: subSkill.sectionName,
        subSkillName: subSkill.subSkillName,
        score,
        accuracy,
        questionsCorrect: subSkillCorrectPoints,
        questionsTotal: subSkill.maxPoints,
        questionsAttempted: estimatedAttempted
      };
    });
    
    const sectionScores = Object.fromEntries(
      sectionBreakdown.map(section => [section.sectionName, section.score])
    );
    
    const overallAccuracy = questionsAnswered > 0 ? Math.round((estimatedCorrectPoints / questionsAnswered) * 100) : 0;
    
    console.log(`🎯 SESSION-BASED RESULTS for test ${testNumber}:`, {
      totalMaxPoints,
      estimatedCorrectPoints,
      questionsAnswered,
      correctAnswers,
      finalScore,
      overallAccuracy,
      sectionCount: sectionBreakdown.length,
      subSkillCount: subSkillBreakdown.length
    });
    
    return {
      totalQuestions: totalMaxPoints,
      questionsAttempted: questionsAnswered,
      questionsCorrect: estimatedCorrectPoints,
      overallScore: finalScore,
      overallAccuracy,
      sectionScores,
      sectionBreakdown,
      subSkillBreakdown,
    };
    
  } catch (error) {
    console.error(`❌ Error in session-based approach for test ${testNumber}:`, error);
    return null;
  }
}

// MOCK DATA MODE: Set to false to use real database queries
const USE_MOCK_DATA = false;

export interface OverallPerformance {
  questionsCompleted: number;
  questionsAttempted: number;
  questionsCorrect: number;
  overallAccuracy: number;
  studyTimeHours: number;
  averageTestScore: number | null;
  diagnosticCompleted: boolean;
  practiceTestsCompleted: number[];
}

export interface DiagnosticResults {
  overallScore: number;
  totalQuestionsCorrect: number;
  totalQuestions: number;
  totalQuestionsAttempted: number;
  overallAccuracy: number;
  sectionBreakdown: {
    sectionName: string;
    score: number;
    questionsCorrect: number;
    questionsTotal: number;
    questionsAttempted: number;
    accuracy: number;
  }[];
  strengths: {
    subSkill: string;
    accuracy: number;
    questionsAttempted: number;
  }[];
  weaknesses: {
    subSkill: string;
    accuracy: number;
    questionsAttempted: number;
  }[];
  allSubSkills: {
    subSkill: string;
    accuracy: number;
    questionsAttempted: number;
    questionsTotal: number;
    questionsCorrect: number;
    sectionName: string;
  }[];
}

export interface PracticeTestResults {
  tests: {
    testNumber: number;
    score: number | null;
    status: 'not-started' | 'in-progress' | 'completed';
    completedAt: string | null;
    sectionScores: Record<string, number>;
    // Real data fields for practice test insights
    totalQuestions?: number | null;
    questionsAttempted?: number | null;
    questionsCorrect?: number | null;
    sectionBreakdown?: {
      sectionName: string;
      score: number;
      questionsCorrect: number;
      questionsTotal: number;
      questionsAttempted: number;
      accuracy: number;
    }[];
    subSkillBreakdown?: {
      sectionName: string;
      subSkillName: string;
      score: number;
      questionsCorrect: number;
      questionsTotal: number;
      questionsAttempted: number;
      accuracy: number;
    }[];
  }[];
  progressOverTime: {
    testNumber: number;
    score: number;
    date: string;
  }[];
  sectionAnalysis: {
    sectionName: string;
    averageScore: number;
    bestScore: number;
    improvementTrend: number; // positive = improving, negative = declining
  }[];
}

export interface DrillResults {
  totalQuestions: number;
  overallAccuracy: number;
  subSkillBreakdown: {
    sectionName: string;
    subSkills: {
      subSkillName: string;
      questionsCompleted: number;
      accuracy: number;
      difficulty1Accuracy: number;
      difficulty2Accuracy: number;
      difficulty3Accuracy: number;
      recommendedLevel: 1 | 2 | 3;
    }[];
  }[];
  recentActivity: {
    subSkillName: string;
    difficulty: number;
    accuracy: number;
    completedAt: string;
  }[];
}

export class AnalyticsService {
  static async getOverallPerformance(userId: string, productId: string): Promise<OverallPerformance> {
    const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
    console.log('📊 Analytics: Fetching overall performance for', userId, productType, `(mapped from ${productId})`);

    // Return mock data for demo purposes if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Returning mock overall performance data');
      return {
        questionsCompleted: 847,
        questionsAttempted: 892,
        questionsCorrect: 634,
        overallAccuracy: 75,
        studyTimeHours: 18.5,
        averageTestScore: 78,
        diagnosticCompleted: true,
        practiceTestsCompleted: [1, 2, 3],
      };
    }

    try {
      // Get user progress data
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .single();

      if (progressError) {
        console.error('❌ Error fetching user progress:', progressError);
        // If no progress record exists, create a default one
        if (progressError.code === 'PGRST116') {
          console.log('📝 No progress record found, returning default values');
          return {
            questionsCompleted: 0,
            questionsAttempted: 0,
            questionsCorrect: 0,
            overallAccuracy: 0,
            studyTimeHours: 0,
            averageTestScore: null,
            diagnosticCompleted: false,
            practiceTestsCompleted: [],
          };
        }
        throw progressError;
      }

      // Get average test score (diagnostic + practice tests)
      const { data: testSessions, error: testError } = await supabase
        .from('user_test_sessions')
        .select('final_score, test_mode')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('status', 'completed')
        .in('test_mode', ['diagnostic', 'practice']);

      if (testError) {
        console.error('❌ Error fetching test sessions:', testError);
        throw testError;
      }

      const averageTestScore = testSessions && testSessions.length > 0
        ? Math.round(testSessions.reduce((sum, test) => sum + (test.final_score || 0), 0) / testSessions.length)
        : null;

      console.log('✅ Overall performance data loaded successfully');

      return {
        questionsCompleted: progressData?.total_questions_completed || 0,
        questionsAttempted: progressData?.total_questions_attempted || 0,
        questionsCorrect: progressData?.total_questions_correct || 0,
        overallAccuracy: progressData?.overall_accuracy || 0,
        studyTimeHours: Math.round((progressData?.total_study_time_seconds || 0) / 3600 * 2) / 2,
        averageTestScore,
        diagnosticCompleted: progressData?.diagnostic_completed || false,
        practiceTestsCompleted: progressData?.practice_tests_completed || [],
      };

    } catch (error) {
      console.error('❌ Error in getOverallPerformance:', error);
      throw error;
    }
  }

  static async getDiagnosticResults(userId: string, productId: string): Promise<DiagnosticResults | null> {
    const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
    console.log('🎯 Analytics: Fetching diagnostic results for', userId, productType, `(mapped from ${productId})`);

    // Return mock diagnostic data for demo purposes if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Returning mock diagnostic results data');
      return {
      overallScore: 76,
      totalQuestionsCorrect: 76,
      totalQuestions: 100,
      totalQuestionsAttempted: 85,
      overallAccuracy: 89,
      sectionBreakdown: [
        {
          sectionName: 'General Ability - Verbal',
          score: 82,
          questionsCorrect: 16,
          questionsTotal: 20,
          questionsAttempted: 19,
          accuracy: 84,
        },
        {
          sectionName: 'General Ability - Quantitative',
          score: 78,
          questionsCorrect: 15,
          questionsTotal: 20,
          questionsAttempted: 18,
          accuracy: 83,
        },
        {
          sectionName: 'Mathematics Reasoning',
          score: 71,
          questionsCorrect: 14,
          questionsTotal: 20,
          questionsAttempted: 17,
          accuracy: 82,
        },
        {
          sectionName: 'Reading Reasoning',
          score: 85,
          questionsCorrect: 17,
          questionsTotal: 20,
          questionsAttempted: 20,
          accuracy: 85,
        },
        {
          sectionName: 'Writing',
          score: 68,
          questionsCorrect: 7,
          questionsTotal: 10,
          questionsAttempted: 8,
          accuracy: 87,
        },
      ],
      strengths: [
        { subSkill: 'Vocabulary in Context', accuracy: 92, questionsAttempted: 12 },
        { subSkill: 'Inferential Reasoning', accuracy: 89, questionsAttempted: 9 },
        { subSkill: 'Logical Reasoning & Deduction', accuracy: 87, questionsAttempted: 15 },
        { subSkill: 'Pattern Recognition & Sequences', accuracy: 85, questionsAttempted: 11 },
        { subSkill: 'Critical Thinking & Problem-Solving', accuracy: 84, questionsAttempted: 18 },
      ],
      weaknesses: [
        { subSkill: 'Creative Writing', accuracy: 45, questionsAttempted: 4 },
        { subSkill: 'Persuasive Writing', accuracy: 52, questionsAttempted: 6 },
        { subSkill: 'Algebraic Reasoning', accuracy: 58, questionsAttempted: 12 },
        { subSkill: 'Data Interpretation and Statistics', accuracy: 61, questionsAttempted: 13 },
        { subSkill: 'Geometric & Spatial Reasoning', accuracy: 64, questionsAttempted: 14 },
      ],
    };
    }

    try {
      // Get all diagnostic test sessions (multiple sections)
      const { data: diagnosticSessions, error: sessionError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('test_mode', 'diagnostic')
        .eq('status', 'completed');

      if (sessionError) {
        console.error('❌ Error fetching diagnostic sessions:', sessionError);
        throw sessionError;
      }

      if (!diagnosticSessions || diagnosticSessions.length === 0) {
        console.log('ℹ️ No completed diagnostic sessions found');
        return null;
      }

      console.log(`📊 Found ${diagnosticSessions.length} completed diagnostic sections`);
      console.log('🔍 Diagnostic sessions details:', diagnosticSessions.map(s => ({
        id: s.id,
        section: s.section_name,
        score: s.final_score,
        correct_answers: s.correct_answers,
        total_questions: s.total_questions,
        questions_answered: s.questions_answered,
        status: s.status,
        created: s.created_at
      })));
      
      // For now, allow any completed diagnostic sections to show results
      // We can adjust this threshold later based on actual usage
      if (diagnosticSessions.length === 0) {
        console.log('ℹ️ No completed diagnostic sections found');
        return null;
      }

      // COMPLETELY REBUILD sub-skill performance calculation
      console.log('📊 Rebuilding sub-skill performance from database...');
      
      // Step 1: Get ALL sub-skills for this product type
      const { data: subSkillsData, error: subSkillsError } = await supabase
        .from('sub_skills')
        .select(`
          id,
          name,
          product_type,
          test_sections!inner(section_name)
        `)
        .eq('product_type', productType);

      if (subSkillsError) {
        console.error('❌ Error fetching sub-skills:', subSkillsError);
        throw subSkillsError;
      }

      console.log(`📊 Found ${subSkillsData?.length || 0} sub-skills for ${productType}`);

      // Step 2: For each sub-skill, get all diagnostic questions
      const subSkillPerformance = [];
      
      for (const subSkill of subSkillsData || []) {
        // Get all diagnostic questions for this sub-skill
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, section_name')
          .eq('sub_skill_id', subSkill.id)
          .eq('test_mode', 'diagnostic')
          .eq('product_type', productType);

        if (questionsError) {
          console.error(`❌ Error fetching questions for sub-skill ${subSkill.name}:`, questionsError);
          continue;
        }

        // Check if this is a writing sub-skill first
        const isWritingSubSkill = subSkill.name.toLowerCase().includes('writing') || 
                                  subSkill.test_sections?.section_name?.toLowerCase().includes('writing');
        
        let totalQuestions = questions?.length || 0;
        
        if (totalQuestions === 0) {
          console.log(`⚠️ Sub-skill "${subSkill.name}" has no diagnostic questions`);
          continue;
        }
        
        // For writing sub-skills, convert total questions to weighted points
        if (isWritingSubSkill) {
          const pointsPerTask = 30; // VIC selective: 30 points per writing task
          totalQuestions = totalQuestions * pointsPerTask;
          console.log(`✍️ Writing sub-skill "${subSkill.name}" total converted to weighted: ${totalQuestions} points (${questions?.length} tasks × ${pointsPerTask} points)`);
        }

        // Get user responses for these questions
        const questionIds = questions?.map(q => q.id) || [];
        
        const { data: responses, error: responsesError } = await supabase
          .from('question_attempt_history')
          .select('question_id, is_correct, user_answer')
          .eq('user_id', userId)
          .eq('session_type', 'diagnostic')
          .in('question_id', questionIds);

        if (responsesError) {
          console.error(`❌ Error fetching responses for sub-skill ${subSkill.name}:`, responsesError);
          continue;
        }
        
        let questionsAttempted = 0;
        let questionsCorrect = 0;
        
        if (isWritingSubSkill) {
          console.log(`✍️ Processing writing sub-skill: ${subSkill.name}`);
          
          // For writing questions, we need to get scores from writing_assessments table
          const { data: writingAssessments, error: writingError } = await supabase
            .from('writing_assessments')
            .select('question_id, total_score, max_possible_score, percentage_score')
            .eq('user_id', userId)
            .in('question_id', questionIds);
          
          if (writingError) {
            console.error(`❌ Error fetching writing assessments for ${subSkill.name}:`, writingError);
          }
          
          // For writing sub-skills, use weighted scoring based on actual points
          if (writingAssessments && writingAssessments.length > 0) {
            // Use actual point values for writing assessments
            const totalPossiblePoints = writingAssessments.reduce((sum, w) => sum + (w.max_possible_score || 0), 0);
            const totalEarnedPoints = writingAssessments.reduce((sum, w) => sum + (w.total_score || 0), 0);
            
            questionsAttempted = totalPossiblePoints;  // Use total possible points as "questions attempted"
            questionsCorrect = totalEarnedPoints;      // Use earned points as "questions correct"
            
            console.log(`✍️ Writing sub-skill ${subSkill.name} WEIGHTED:`, {
              earnedPoints: totalEarnedPoints,
              possiblePoints: totalPossiblePoints,
              percentage: totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 0,
              numAssessments: writingAssessments.length
            });
          } else {
            // Fallback: Use responses but apply weighted scoring for writing
            const responseCount = responses?.length || 0;
            const correctResponses = responses?.filter(r => r.is_correct).length || 0;
            
            // Convert to weighted points (assume 30 points per writing task for VIC selective)
            const pointsPerTask = 30;
            questionsAttempted = responseCount * pointsPerTask;
            questionsCorrect = correctResponses * pointsPerTask;
            
            console.log(`✍️ Writing sub-skill ${subSkill.name} FALLBACK WEIGHTED:`, {
              originalResponses: responseCount,
              originalCorrect: correctResponses,
              weightedAttempted: questionsAttempted,
              weightedCorrect: questionsCorrect
            });
          }
        } else {
          // Non-writing questions use standard calculation
          questionsAttempted = responses?.length || 0;
          questionsCorrect = responses?.filter(r => r.is_correct).length || 0;
        }
        
        const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;

        // Get section name (use first question's section, they should all be the same)
        const sectionName = questions?.[0]?.section_name || subSkill.test_sections?.section_name || 'Unknown';

        subSkillPerformance.push({
          subSkill: subSkill.name,
          subSkillId: subSkill.id,
          questionsTotal: totalQuestions,
          questionsAttempted,
          questionsCorrect,
          accuracy,
          sectionName
        });

        console.log(`📊 Sub-skill "${subSkill.name}": ${questionsCorrect}/${questionsAttempted}/${totalQuestions} (${accuracy}%) in ${sectionName}`);
      }

      console.log(`📊 Calculated performance for ${subSkillPerformance.length} sub-skills with questions`);

      // Create a map for easy lookup in debugging
      const subSkillStats = new Map(
        subSkillPerformance.map(skill => [skill.subSkill, {
          subSkillName: skill.subSkill,
          questionsTotal: skill.questionsTotal,
          questionsAttempted: skill.questionsAttempted,
          questionsCorrect: skill.questionsCorrect,
          sectionName: skill.sectionName
        }])
      );

      // Debug: Show question count breakdown by section
      const sectionQuestionCounts = new Map<string, number>();
      const sectionSubSkillCounts = new Map<string, number>();
      const sectionCorrectCounts = new Map<string, number>();
      const sectionAttemptedCounts = new Map<string, number>();
      
      subSkillPerformance.forEach(skill => {
        const section = skill.sectionName;
        
        const currentCount = sectionQuestionCounts.get(section) || 0;
        sectionQuestionCounts.set(section, currentCount + skill.questionsTotal);
        
        const currentSubSkills = sectionSubSkillCounts.get(section) || 0;
        sectionSubSkillCounts.set(section, currentSubSkills + 1);
        
        const currentCorrect = sectionCorrectCounts.get(section) || 0;
        sectionCorrectCounts.set(section, currentCorrect + skill.questionsCorrect);
        
        const currentAttempted = sectionAttemptedCounts.get(section) || 0;
        sectionAttemptedCounts.set(section, currentAttempted + skill.questionsAttempted);
      });
      
      console.log('📊 Sub-skills analysis by section:', 
        Array.from(sectionQuestionCounts.entries()).map(([section, count]) => ({
          section,
          subSkillQuestionTotal: count,
          numSubSkills: sectionSubSkillCounts.get(section) || 0,
          subSkillCorrectTotal: sectionCorrectCounts.get(section) || 0,
          subSkillAttemptedTotal: sectionAttemptedCounts.get(section) || 0
        }))
      );

      // Process section breakdown from multiple sessions using REAL-TIME calculation
      // This matches the exact calculation used in TestTaking.tsx View Results
      const sectionBreakdownPromises = diagnosticSessions.map(async session => {
        const sessionId = session.id;
        
        console.log(`📊 Processing section ${session.section_name}:`, {
          sessionId: session.id,
          dbTotalQuestions: session.total_questions,
          questionOrder: session.question_order?.length || 'null',
          questionsAnswered: session.questions_answered,
          correctAnswers: session.correct_answers,
          finalScore: session.final_score
        });
        
        // USE THE EXACT SAME CALCULATION AS VIEW RESULTS PAGE
        // View Results uses: questions.filter((q, index) => answers[index] === q.correctAnswer).length / questions.length
        
        let actualTotalQuestions = 0;
        let questionsCorrect = 0;
        let questionsAttempted = 0;
        
        try {
          // Check if this is a writing section and needs special handling
          const isWritingSection = session.section_name?.toLowerCase().includes('writing');
          
          if (isWritingSection) {
            console.log(`✍️ Processing writing section: ${session.section_name}`);
            
            // Get writing assessments for this session
            const { data: writingAssessments, error: writingError } = await supabase
              .from('writing_assessments')
              .select('total_score, max_possible_score, percentage_score')
              .eq('session_id', sessionId);
            
            if (!writingError && writingAssessments && writingAssessments.length > 0) {
              // For writing sections, use the actual point values instead of treating as individual questions
              const totalPossibleScore = writingAssessments.reduce((sum, a) => sum + (a.max_possible_score || 0), 0);
              const totalEarnedScore = writingAssessments.reduce((sum, a) => sum + (a.total_score || 0), 0);
              
              // Use the actual point totals for writing sections (e.g., 60 points for VIC selective)
              actualTotalQuestions = totalPossibleScore;
              questionsAttempted = totalPossibleScore; // All questions were attempted if assessments exist
              questionsCorrect = totalEarnedScore;
              
              console.log(`✍️ Writing section ${session.section_name} WEIGHTED scores:`, {
                totalEarnedScore,
                totalPossibleScore,
                questionsCorrect,
                actualTotalQuestions,
                calculatedPercentage: totalPossibleScore > 0 ? Math.round((totalEarnedScore / totalPossibleScore) * 100) : 0,
                numAssessments: writingAssessments.length
              });
            } else {
              // Fallback to stored session data for writing sections without assessments
              console.log(`⚠️ No writing assessments found for section ${session.section_name}, using session data`);
              
              // For VIC Selective writing, assume 60 points total (2 tasks × 30 points)
              // This is a fallback when no assessments are available yet
              const standardWritingTotal = 60;
              const storedCorrectAnswers = session.correct_answers || 0;
              const storedQuestionsAnswered = session.questions_answered || 0;
              
              if (session.question_order && Array.isArray(session.question_order) && session.question_order.length > 0) {
                // Convert from task count to points (each task worth 30 points for VIC selective)
                const taskCount = session.question_order.length;
                actualTotalQuestions = taskCount * 30; // e.g., 2 tasks × 30 points = 60 points
                questionsAttempted = storedQuestionsAnswered * 30; // answered tasks × 30 points
                questionsCorrect = storedCorrectAnswers * 30; // correct answers × 30 points (approximate)
              } else {
                actualTotalQuestions = standardWritingTotal;
                questionsAttempted = standardWritingTotal;
                questionsCorrect = Math.round((storedCorrectAnswers / Math.max(storedQuestionsAnswered, 1)) * standardWritingTotal);
              }
              
              console.log(`✍️ Writing section ${session.section_name} FALLBACK to weighted scoring:`, {
                originalCorrect: storedCorrectAnswers,
                originalTotal: session.question_order?.length || session.total_questions,
                weightedCorrect: questionsCorrect,
                weightedTotal: actualTotalQuestions
              });
            }
          } else {
            // Non-writing sections use standard calculation
            console.log(`📊 Section ${session.section_name} - Using stored session data:`, {
              storedCorrectAnswers: session.correct_answers,
              storedTotalQuestions: session.total_questions,
              storedQuestionsAnswered: session.questions_answered,
              questionOrderLength: session.question_order?.length
            });
            
            // Use stored values which are already correct
            questionsCorrect = session.correct_answers || 0;
            questionsAttempted = session.questions_answered || 0;
          }
          
          // For total questions, prioritize question_order length, then stored total_questions
          // BUT only for non-writing sections (writing sections already have weighted totals calculated)
          if (!isWritingSection) {
            if (session.question_order && Array.isArray(session.question_order) && session.question_order.length > 0) {
              actualTotalQuestions = session.question_order.length;
            } else {
              actualTotalQuestions = session.total_questions || 0;
            }
          }
          // For writing sections, actualTotalQuestions is already set to weighted values above
          
          // If for some reason answers_data exists but questions_answered is 0, count answers_data
          if (questionsAttempted === 0 && session.answers_data && typeof session.answers_data === 'object') {
            questionsAttempted = Object.keys(session.answers_data).length;
          }
          
          console.log(`📊 Section ${session.section_name} - FINAL VALUES:`, {
            actualTotalQuestions,
            questionsCorrect,
            questionsAttempted
          });
        } catch (error) {
          console.error('Error in VIEW RESULTS calculation:', error);
          
          // Final fallback
          if (actualTotalQuestions === 0) {
            if (session.question_order && Array.isArray(session.question_order)) {
              actualTotalQuestions = session.question_order.length;
            } else {
              actualTotalQuestions = session.total_questions || 0;
            }
          }
          
          questionsCorrect = session.correct_answers || session.questions_correct || 0;
          questionsAttempted = session.questions_answered || actualTotalQuestions;
        }
        
        // Final safety check - ensure we have a valid total
        if (!actualTotalQuestions || actualTotalQuestions === 0) {
          console.log(`⚠️ Section ${session.section_name}: No valid total found, defaulting to standard test sizes`);
          // Use standard test sizes based on section name
          // For writing sections, use weighted point totals (60 points for VIC selective)
          const standardSizes: Record<string, number> = {
            'Reading Reasoning': 24,
            'General Ability - Verbal': 15,
            'General Ability - Quantitative': 15,
            'Mathematics Reasoning': 18,
            'Writing': 60,        // 2 tasks × 30 points each
            'Written Expression': 60  // 2 tasks × 30 points each
          };
          actualTotalQuestions = standardSizes[session.section_name] || 20;
        }
        
        // Calculate final scores
        const score = actualTotalQuestions > 0 ? Math.round((questionsCorrect / actualTotalQuestions) * 100) : 0;
        const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;
        
        console.log(`📊 Section ${session.section_name} FINAL RESULT:`, {
          actualTotalQuestions,
          questionsCorrect,
          questionsAttempted,
          score: score + '%',
          accuracy: accuracy + '%',
          calculation: `${questionsCorrect}/${actualTotalQuestions} = ${score}%`,
          dbTotalQuestions: session.total_questions,
          questionOrderLength: session.question_order?.length
        });
        
        return {
          sectionName: session.section_name || 'Unknown Section',
          score, // Score based on total questions (for Score view)
          questionsCorrect,
          questionsTotal: actualTotalQuestions, // Use actual total, not DB value
          questionsAttempted,
          accuracy, // Accuracy based on attempted questions (for Accuracy view)
        };
      });
      
      const sectionBreakdown = await Promise.all(sectionBreakdownPromises);

      // Debug: Compare section totals with sub-skill totals
      console.log('📊 COMPARISON - Section Results vs Sub-Skills:');
      sectionBreakdown.forEach(section => {
        const subSkillTotal = sectionQuestionCounts.get(section.sectionName) || 0;
        const subSkillCorrect = sectionCorrectCounts.get(section.sectionName) || 0;
        const subSkillAttempted = sectionAttemptedCounts.get(section.sectionName) || 0;
        console.log(`📊 ${section.sectionName}:`, {
          sectionResultTotal: section.questionsTotal,
          sectionResultCorrect: section.questionsCorrect,
          sectionResultAttempted: section.questionsAttempted,
          subSkillsTotal: subSkillTotal,
          subSkillsCorrect: subSkillCorrect,
          subSkillsAttempted: subSkillAttempted,
          questionsDifference: section.questionsTotal - subSkillTotal,
          correctDifference: section.questionsCorrect - subSkillCorrect,
          attemptedDifference: section.questionsAttempted - subSkillAttempted
        });
      });

      // Calculate overall score from all completed sections
      const totalQuestions = sectionBreakdown.reduce((sum, section) => sum + section.questionsTotal, 0);
      const totalCorrect = sectionBreakdown.reduce((sum, section) => sum + section.questionsCorrect, 0);
      const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // Calculate total questions attempted from section breakdown (ensures consistency with weighted scores)
      let totalQuestionsAttempted = sectionBreakdown.reduce((sum, section) => sum + section.questionsAttempted, 0);
      
      console.log('📊 Calculated totalQuestionsAttempted from sectionBreakdown:', {
        sectionBreakdown: sectionBreakdown.map(s => ({ 
          section: s.sectionName, 
          attempted: s.questionsAttempted,
          total: s.questionsTotal,
          correct: s.questionsCorrect
        })),
        totalAttempted: totalQuestionsAttempted
      });

      // If still 0, use total questions as attempted (all questions were attempted)
      if (totalQuestionsAttempted === 0 && totalQuestions > 0) {
        console.log('⚠️ No attempted questions found, using total questions as fallback');
        totalQuestionsAttempted = totalQuestions;
      }

      // Calculate overall accuracy based on attempted questions (excludes skipped/timed-out questions)
      const overallAccuracy = totalQuestionsAttempted > 0 
        ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) 
        : 0;

      console.log('📊 Diagnostic totals:', {
        totalQuestions,
        totalCorrect,
        totalQuestionsAttempted,
        overallScore,
        overallAccuracy
      });

      // Sort sub-skills by accuracy and prepare for return
      const sortedSkills = subSkillPerformance
        .filter(skill => skill.questionsTotal >= 1) // Include all sub-skills that have questions
        .sort((a, b) => b.accuracy - a.accuracy);

      console.log('📊 Sub-skill performance sorted:', sortedSkills);

      // Keep strengths and weaknesses for backwards compatibility, but also return all skills
      const strengths = sortedSkills.slice(0, 5); // Top 5 performing sub-skills
      const weaknesses = sortedSkills.slice(-5).reverse(); // Bottom 5 performing sub-skills, reversed to show worst first
      const allSubSkills = sortedSkills; // All sub-skills for comprehensive display

      console.log('✅ Diagnostic results aggregated from multiple sections successfully');

      return {
        overallScore,
        totalQuestionsCorrect: totalCorrect,
        totalQuestions,
        totalQuestionsAttempted,
        overallAccuracy,
        sectionBreakdown,
        strengths,
        weaknesses,
        allSubSkills, // Include all sub-skills for comprehensive display
      };

    } catch (error) {
      console.error('❌ Error in getDiagnosticResults:', error);
      throw error;
    }
  }

  static async getPracticeTestResults(userId: string, productId: string): Promise<PracticeTestResults> {
    const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
    console.log('📚 Analytics: Fetching practice test results for', userId, productType, `(mapped from ${productId})`);

    // Return mock practice test data for demo purposes if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Returning mock practice test results data');
      return {
      tests: [
        {
          testNumber: 1,
          score: 72,
          status: 'completed',
          completedAt: '2024-06-10T14:30:00Z',
          sectionScores: {
            'General Ability - Verbal': 75,
            'General Ability - Quantitative': 68,
            'Mathematics Reasoning': 70,
            'Reading Reasoning': 78,
            'Writing': 69,
          },
        },
        {
          testNumber: 2,
          score: 78,
          status: 'completed',
          completedAt: '2024-06-12T16:15:00Z',
          sectionScores: {
            'General Ability - Verbal': 82,
            'General Ability - Quantitative': 74,
            'Mathematics Reasoning': 76,
            'Reading Reasoning': 81,
            'Writing': 75,
          },
        },
        {
          testNumber: 3,
          score: 81,
          status: 'completed',
          completedAt: '2024-06-15T10:45:00Z',
          sectionScores: {
            'General Ability - Verbal': 85,
            'General Ability - Quantitative': 79,
            'Mathematics Reasoning': 78,
            'Reading Reasoning': 84,
            'Writing': 79,
          },
        },
        {
          testNumber: 4,
          score: null,
          status: 'in-progress',
          completedAt: null,
          sectionScores: {},
        },
        {
          testNumber: 5,
          score: null,
          status: 'not-started',
          completedAt: null,
          sectionScores: {},
        },
      ],
      progressOverTime: [
        { testNumber: 1, score: 72, date: '2024-06-10T14:30:00Z' },
        { testNumber: 2, score: 78, date: '2024-06-12T16:15:00Z' },
        { testNumber: 3, score: 81, date: '2024-06-15T10:45:00Z' },
      ],
      sectionAnalysis: [
        {
          sectionName: 'General Ability - Verbal',
          averageScore: 81,
          bestScore: 85,
          improvementTrend: 3.3,
        },
        {
          sectionName: 'General Ability - Quantitative',
          averageScore: 74,
          bestScore: 79,
          improvementTrend: 3.7,
        },
        {
          sectionName: 'Mathematics Reasoning',
          averageScore: 75,
          bestScore: 78,
          improvementTrend: 2.7,
        },
        {
          sectionName: 'Reading Reasoning',
          averageScore: 81,
          bestScore: 84,
          improvementTrend: 2.0,
        },
        {
          sectionName: 'Writing',
          averageScore: 74,
          bestScore: 79,
          improvementTrend: 3.3,
        },
      ],
    };
    }

    try {
      // Get practice test sessions - check both specific modes and generic 'practice'
      const { data: practiceSessions, error: sessionsError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .in('test_mode', ['practice', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
        .order('created_at');

      if (sessionsError) {
        console.error('❌ Error fetching practice sessions:', sessionsError);
        throw sessionsError;
      }

      console.log(`📊 Found ${practiceSessions?.length || 0} practice test sessions`);
      console.log('🔍 Practice sessions details:', practiceSessions?.map(s => ({
        id: s.id,
        testMode: s.test_mode,
        testNumber: s.test_number,
        score: s.final_score,
        status: s.status,
        completedAt: s.completed_at,
        created: s.created_at
      })));

      // Separate sessions by test_mode type
      const specificModeSessions = practiceSessions?.filter(s => s.test_mode?.startsWith('practice_')) || [];
      const genericModeSessions = practiceSessions?.filter(s => s.test_mode === 'practice') || [];
      
      console.log(`🔍 Found ${specificModeSessions.length} specific mode sessions, ${genericModeSessions.length} generic mode sessions`);

      // Create test results for practice tests 1, 2, 3 only (VIC Selective) with REAL data
      const tests = [];
      
      // Sort generic sessions by creation date to ensure consistent assignment
      const sortedGenericSessions = genericModeSessions.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      console.log(`📊 Sorted generic sessions by creation date:`, sortedGenericSessions.map((s, idx) => ({
        index: idx,
        testMode: s.test_mode,
        score: s.final_score,
        status: s.status,
        created: s.created_at
      })));
      
      for (let i = 1; i <= 5; i++) {
        // Find ALL sessions for this practice test number (since we now create per-section sessions)
        const testMode = `practice_${i}`;
        const testSessions = specificModeSessions.filter(s => 
          s.test_mode === testMode && s.status === 'completed'
        );
        
        console.log(`🔍 Test ${i}: found ${testSessions.length} sessions with test_mode=${testMode}`);
        
        let aggregatedTestData = null;
        
        if (testSessions.length > 0) {
          console.log(`📊 Aggregating data from ${testSessions.length} sessions for Test ${i}...`);
          
          // Aggregate data from all sections for this practice test
          const allSectionBreakdowns = [];
          const allSubSkillBreakdowns = [];
          const allSectionScores = {};
          let totalQuestions = 0;
          let totalQuestionsAttempted = 0;
          let totalQuestionsCorrect = 0;
          let totalMaxPoints = 0;
          let totalEarnedPoints = 0;
          
          for (const session of testSessions) {
            try {
              const sectionData = await getRealTestData(userId, productType, session.id, 'practice', i);
              if (sectionData) {
                allSectionBreakdowns.push(...sectionData.sectionBreakdown);
                allSubSkillBreakdowns.push(...sectionData.subSkillBreakdown);
                Object.assign(allSectionScores, sectionData.sectionScores);
                totalQuestions += sectionData.totalQuestions || 0;
                totalQuestionsAttempted += sectionData.questionsAttempted || 0;
                totalQuestionsCorrect += sectionData.questionsCorrect || 0;
                totalMaxPoints += sectionData.totalMaxPoints || 0;
                totalEarnedPoints += sectionData.totalEarnedPoints || 0;
              }
            } catch (error) {
              console.error(`❌ Error getting data for session ${session.id}:`, error);
            }
          }
          
          // Calculate overall scores using earned points for score, questions for accuracy
          const overallScore = totalMaxPoints > 0 ? Math.round((totalEarnedPoints / totalMaxPoints) * 100) : 0;
          const overallAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100) : 0;
          
          aggregatedTestData = {
            testNumber: i,
            score: overallScore,
            status: 'completed',
            completedAt: testSessions[testSessions.length - 1]?.completed_at,
            sectionScores: allSectionScores,
            sectionBreakdown: allSectionBreakdowns,
            subSkillBreakdown: allSubSkillBreakdowns,
            totalQuestions: totalQuestions,
            questionsAttempted: totalQuestionsAttempted,
            questionsCorrect: totalQuestionsCorrect,
            overallAccuracy: overallAccuracy
          };
          
          console.log(`📊 Aggregated Test ${i} data:`, {
            totalSessions: testSessions.length,
            totalQuestions,
            overallScore,
            sectionCount: allSectionBreakdowns.length
          });
        } else {
          // No completed sessions found for this test
          aggregatedTestData = {
            testNumber: i,
            score: null,
            status: 'not-started',
            completedAt: null,
            sectionScores: {},
            sectionBreakdown: [],
            subSkillBreakdown: [],
            totalQuestions: null,
            questionsAttempted: null,
            questionsCorrect: null
          };
        }
        
        console.log(`📊 Final test data for Test ${i}:`, aggregatedTestData);
        tests.push(aggregatedTestData);
      }

      // Progress over time (only completed tests)
      const progressOverTime = practiceSessions
        ?.filter(s => s.status === 'completed' && s.final_score !== null)
        .map(s => {
          // Extract test number from test_mode (practice_1 -> 1, practice_2 -> 2, etc.)
          const testNumber = s.test_mode?.startsWith('practice_') ? 
            parseInt(s.test_mode.split('_')[1]) : 0;
          return {
            testNumber,
            score: s.final_score || 0,
            date: s.completed_at || s.updated_at,
          };
        })
        .sort((a, b) => a.testNumber - b.testNumber) || [];

      // Section analysis
      const sectionAnalysis: Record<string, number[]> = {};
      practiceSessions?.forEach(session => {
        if (session.status === 'completed' && session.section_scores) {
          const scores = session.section_scores as Record<string, number>;
          Object.entries(scores).forEach(([sectionName, score]) => {
            if (!sectionAnalysis[sectionName]) {
              sectionAnalysis[sectionName] = [];
            }
            sectionAnalysis[sectionName].push(score);
          });
        }
      });

      const sectionAnalysisResult = Object.entries(sectionAnalysis).map(([sectionName, scores]) => {
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const bestScore = Math.max(...scores);
        
        // Calculate improvement trend (simple linear regression slope)
        let improvementTrend = 0;
        if (scores.length > 1) {
          const n = scores.length;
          const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
          const sumY = scores.reduce((sum, score) => sum + score, 0);
          const sumXY = scores.reduce((sum, score, index) => sum + score * index, 0);
          const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²
          
          improvementTrend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        }

        return {
          sectionName,
          averageScore: Math.round(averageScore),
          bestScore,
          improvementTrend: Math.round(improvementTrend * 100) / 100,
        };
      });

      console.log('✅ Practice test results loaded successfully');

      return {
        tests,
        progressOverTime,
        sectionAnalysis: sectionAnalysisResult,
      };

    } catch (error) {
      console.error('❌ Error in getPracticeTestResults:', error);
      throw error;
    }
  }

  static async getDrillResults(userId: string, productId: string): Promise<DrillResults> {
    const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
    console.log('🔧 Analytics: Fetching drill results for', userId, productType, `(mapped from ${productId})`);

    // Return mock drill data for demo purposes if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Returning mock drill results data');
      return {
      totalQuestions: 420,
      overallAccuracy: 73,
      subSkillBreakdown: [
        {
          sectionName: 'General Ability - Verbal',
          subSkills: [
            {
              subSkillName: 'Vocabulary in Context',
              questionsCompleted: 45,
              accuracy: 82,
              difficulty1Accuracy: 91,
              difficulty2Accuracy: 78,
              difficulty3Accuracy: 72,
              recommendedLevel: 3,
            },
            {
              subSkillName: 'Logical Reasoning & Deduction',
              questionsCompleted: 38,
              accuracy: 76,
              difficulty1Accuracy: 85,
              difficulty2Accuracy: 74,
              difficulty3Accuracy: 68,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Verbal Reasoning & Analogies',
              questionsCompleted: 42,
              accuracy: 71,
              difficulty1Accuracy: 83,
              difficulty2Accuracy: 67,
              difficulty3Accuracy: 62,
              recommendedLevel: 2,
            },
          ],
        },
        {
          sectionName: 'General Ability - Quantitative',
          subSkills: [
            {
              subSkillName: 'Pattern Recognition & Sequences',
              questionsCompleted: 36,
              accuracy: 79,
              difficulty1Accuracy: 89,
              difficulty2Accuracy: 75,
              difficulty3Accuracy: 71,
              recommendedLevel: 3,
            },
            {
              subSkillName: 'Spatial Reasoning (2D & 3D)',
              questionsCompleted: 33,
              accuracy: 68,
              difficulty1Accuracy: 78,
              difficulty2Accuracy: 65,
              difficulty3Accuracy: 58,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Critical Thinking & Problem-Solving',
              questionsCompleted: 41,
              accuracy: 75,
              difficulty1Accuracy: 84,
              difficulty2Accuracy: 72,
              difficulty3Accuracy: 67,
              recommendedLevel: 2,
            },
          ],
        },
        {
          sectionName: 'Mathematics Reasoning',
          subSkills: [
            {
              subSkillName: 'Algebraic Reasoning',
              questionsCompleted: 35,
              accuracy: 64,
              difficulty1Accuracy: 74,
              difficulty2Accuracy: 61,
              difficulty3Accuracy: 54,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Geometric & Spatial Reasoning',
              questionsCompleted: 38,
              accuracy: 69,
              difficulty1Accuracy: 79,
              difficulty2Accuracy: 66,
              difficulty3Accuracy: 59,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Data Interpretation and Statistics',
              questionsCompleted: 32,
              accuracy: 72,
              difficulty1Accuracy: 81,
              difficulty2Accuracy: 69,
              difficulty3Accuracy: 65,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Numerical Operations',
              questionsCompleted: 40,
              accuracy: 77,
              difficulty1Accuracy: 86,
              difficulty2Accuracy: 74,
              difficulty3Accuracy: 70,
              recommendedLevel: 3,
            },
          ],
        },
        {
          sectionName: 'Reading Reasoning',
          subSkills: [
            {
              subSkillName: 'Inferential Reasoning',
              questionsCompleted: 28,
              accuracy: 81,
              difficulty1Accuracy: 89,
              difficulty2Accuracy: 78,
              difficulty3Accuracy: 74,
              recommendedLevel: 3,
            },
            {
              subSkillName: 'Character Analysis',
              questionsCompleted: 25,
              accuracy: 74,
              difficulty1Accuracy: 84,
              difficulty2Accuracy: 71,
              difficulty3Accuracy: 65,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Theme & Message Analysis',
              questionsCompleted: 22,
              accuracy: 69,
              difficulty1Accuracy: 77,
              difficulty2Accuracy: 66,
              difficulty3Accuracy: 61,
              recommendedLevel: 2,
            },
          ],
        },
      ],
      recentActivity: [
        {
          subSkillName: 'Vocabulary in Context',
          difficulty: 3,
          accuracy: 80,
          completedAt: '2024-06-16T15:30:00Z',
        },
        {
          subSkillName: 'Numerical Operations',
          difficulty: 2,
          accuracy: 85,
          completedAt: '2024-06-16T14:15:00Z',
        },
        {
          subSkillName: 'Pattern Recognition & Sequences',
          difficulty: 3,
          accuracy: 75,
          completedAt: '2024-06-16T11:45:00Z',
        },
        {
          subSkillName: 'Inferential Reasoning',
          difficulty: 2,
          accuracy: 90,
          completedAt: '2024-06-15T18:20:00Z',
        },
        {
          subSkillName: 'Algebraic Reasoning',
          difficulty: 1,
          accuracy: 70,
          completedAt: '2024-06-15T16:10:00Z',
        },
      ],
    };
    }

    try {
      // Get all completed drill sessions
      const { data: drillSessions, error: drillsError } = await supabase
        .from('drill_sessions')
        .select(`
          *,
          sub_skills!inner(
            name,
            test_sections!inner(section_name)
          )
        `)
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('status', 'completed');

      if (drillsError) {
        console.error('❌ Error fetching drill sessions:', drillsError);
        throw drillsError;
      }

      console.log(`📊 Found ${drillSessions?.length || 0} completed drill sessions`);
      console.log('🔍 Drill sessions details:', drillSessions?.map(s => ({
        id: s.id,
        subSkill: s.sub_skills?.name,
        section: s.sub_skills?.test_sections?.section_name,
        difficulty: s.difficulty,
        questions: s.questions_answered,
        correct: s.questions_correct,
        status: s.status
      })));

      // Calculate totals
      const totalQuestions = drillSessions?.reduce((sum, session) => sum + (session.questions_answered || 0), 0) || 0;
      const totalCorrect = drillSessions?.reduce((sum, session) => sum + (session.questions_correct || 0), 0) || 0;
      const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // Group by section and sub-skill
      const sectionMap = new Map<string, Map<string, {
        sessions: Array<typeof drillSessions[0]>;
        totalQuestions: number;
        totalCorrect: number;
        difficultyStats: Record<number, { questions: number; correct: number }>;
      }>>();

      drillSessions?.forEach(session => {
        const sectionName = session.sub_skills?.test_sections?.section_name || 'Unknown';
        const subSkillName = session.sub_skills?.name || 'Unknown';
        const difficulty = session.difficulty || 1;

        if (!sectionMap.has(sectionName)) {
          sectionMap.set(sectionName, new Map());
        }

        const subSkillMap = sectionMap.get(sectionName)!;
        if (!subSkillMap.has(subSkillName)) {
          subSkillMap.set(subSkillName, {
            sessions: [],
            totalQuestions: 0,
            totalCorrect: 0,
            difficultyStats: { 1: { questions: 0, correct: 0 }, 2: { questions: 0, correct: 0 }, 3: { questions: 0, correct: 0 } },
          });
        }

        const subSkillData = subSkillMap.get(subSkillName)!;
        subSkillData.sessions.push(session);
        subSkillData.totalQuestions += session.questions_answered || 0;
        subSkillData.totalCorrect += session.questions_correct || 0;
        subSkillData.difficultyStats[difficulty].questions += session.questions_answered || 0;
        subSkillData.difficultyStats[difficulty].correct += session.questions_correct || 0;
      });

      // Transform to expected format
      const subSkillBreakdown = Array.from(sectionMap.entries()).map(([sectionName, subSkillMap]) => ({
        sectionName,
        subSkills: Array.from(subSkillMap.entries()).map(([subSkillName, data]) => {
          const accuracy = data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0;
          
          const difficulty1Accuracy = data.difficultyStats[1].questions > 0 
            ? Math.round((data.difficultyStats[1].correct / data.difficultyStats[1].questions) * 100) 
            : 0;
          const difficulty2Accuracy = data.difficultyStats[2].questions > 0 
            ? Math.round((data.difficultyStats[2].correct / data.difficultyStats[2].questions) * 100) 
            : 0;
          const difficulty3Accuracy = data.difficultyStats[3].questions > 0 
            ? Math.round((data.difficultyStats[3].correct / data.difficultyStats[3].questions) * 100) 
            : 0;

          // Recommend next difficulty level
          let recommendedLevel: 1 | 2 | 3 = 1;
          if (difficulty1Accuracy >= 80 && difficulty2Accuracy >= 80) {
            recommendedLevel = 3;
          } else if (difficulty1Accuracy >= 80) {
            recommendedLevel = 2;
          }

          return {
            subSkillName,
            questionsCompleted: data.totalQuestions,
            accuracy,
            difficulty1Accuracy,
            difficulty2Accuracy,
            difficulty3Accuracy,
            recommendedLevel,
          };
        }),
      }));

      // Recent activity (last 10 drill sessions)
      const recentActivity = (drillSessions || [])
        .sort((a, b) => new Date(b.completed_at || b.started_at).getTime() - new Date(a.completed_at || a.started_at).getTime())
        .slice(0, 10)
        .map(session => ({
          subSkillName: session.sub_skills?.name || 'Unknown',
          difficulty: session.difficulty || 1,
          accuracy: session.questions_answered > 0 
            ? Math.round((session.questions_correct / session.questions_answered) * 100) 
            : 0,
          completedAt: session.completed_at || session.started_at,
        }));

      console.log('✅ Drill results loaded successfully');

      return {
        totalQuestions,
        overallAccuracy,
        subSkillBreakdown,
        recentActivity,
      };

    } catch (error) {
      console.error('❌ Error in getDrillResults:', error);
      throw error;
    }
  }
}