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

// MOCK DATA MODE: Set to false to use real database queries
const USE_MOCK_DATA = true;

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
  sectionBreakdown: {
    sectionName: string;
    score: number;
    questionsCorrect: number;
    questionsTotal: number;
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
}

export interface PracticeTestResults {
  tests: {
    testNumber: number;
    score: number | null;
    status: 'not-started' | 'in-progress' | 'completed';
    completedAt: string | null;
    sectionScores: Record<string, number>;
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
      sectionBreakdown: [
        {
          sectionName: 'General Ability - Verbal',
          score: 82,
          questionsCorrect: 16,
          questionsTotal: 20,
          accuracy: 82,
        },
        {
          sectionName: 'General Ability - Quantitative',
          score: 78,
          questionsCorrect: 15,
          questionsTotal: 20,
          accuracy: 78,
        },
        {
          sectionName: 'Mathematics Reasoning',
          score: 71,
          questionsCorrect: 14,
          questionsTotal: 20,
          accuracy: 71,
        },
        {
          sectionName: 'Reading Reasoning',
          score: 85,
          questionsCorrect: 17,
          questionsTotal: 20,
          accuracy: 85,
        },
        {
          sectionName: 'Writing',
          score: 68,
          questionsCorrect: 7,
          questionsTotal: 10,
          accuracy: 68,
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
      // Get diagnostic test session
      const { data: diagnosticSessions, error: sessionError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('test_mode', 'diagnostic')
        .eq('status', 'completed');

      if (sessionError) {
        console.error('❌ Error fetching diagnostic session:', sessionError);
        throw sessionError;
      }

      if (!diagnosticSessions || diagnosticSessions.length === 0) {
        console.log('ℹ️ No completed diagnostic found');
        return null;
      }

      const diagnosticSession = diagnosticSessions[0]; // Take the most recent one

      // Get sub-skill performance for strengths/weaknesses  
      const { data: subSkillPerformance, error: skillError } = await supabase
        .from('user_sub_skill_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .gte('questions_attempted', 3); // Only include skills with meaningful data

      // Get sub-skill names separately
      let subSkillNames: Record<string, string> = {};
      if (subSkillPerformance && subSkillPerformance.length > 0) {
        const subSkillIds = subSkillPerformance.map(sp => sp.sub_skill_id);
        const { data: subSkills } = await supabase
          .from('sub_skills')
          .select('id, name')
          .in('id', subSkillIds);
        
        subSkillNames = subSkills?.reduce((acc, skill) => {
          acc[skill.id] = skill.name;
          return acc;
        }, {} as Record<string, string>) || {};
      }

      if (skillError) {
        console.error('❌ Error fetching sub-skill performance:', skillError);
        throw skillError;
      }

      // Process section breakdown from session data
      const sectionScores = diagnosticSession.section_scores as Record<string, number> || {};
      const sectionBreakdown = Object.entries(sectionScores).map(([sectionName, score]) => ({
        sectionName,
        score,
        questionsCorrect: Math.round(score * 10 / 100), // Estimate based on score
        questionsTotal: 10, // Typical section size
        accuracy: score,
      }));

      // Sort sub-skills by accuracy for strengths/weaknesses
      const sortedSkills = (subSkillPerformance || [])
        .map(skill => ({
          subSkill: subSkillNames[skill.sub_skill_id] || 'Unknown',
          accuracy: skill.accuracy_percentage || 0,
          questionsAttempted: skill.questions_attempted || 0,
        }))
        .sort((a, b) => b.accuracy - a.accuracy);

      const strengths = sortedSkills.slice(0, 5); // Top 5
      const weaknesses = sortedSkills.slice(-5).reverse(); // Bottom 5, reversed

      console.log('✅ Diagnostic results loaded successfully');

      return {
        overallScore: diagnosticSession.final_score || 0,
        sectionBreakdown,
        strengths,
        weaknesses,
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
      // Get all practice test sessions
      const { data: practiceSessions, error: sessionsError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('test_mode', 'practice')
        .order('test_number');

      if (sessionsError) {
        console.error('❌ Error fetching practice sessions:', sessionsError);
        throw sessionsError;
      }

      // Create test results for all 5 practice tests
      const tests = [];
      for (let i = 1; i <= 5; i++) {
        const session = practiceSessions?.find(s => s.test_number === i);
        tests.push({
          testNumber: i,
          score: session?.final_score || null,
          status: session ? (session.status === 'completed' ? 'completed' as const : 'in-progress' as const) : 'not-started' as const,
          completedAt: session?.completed_at || null,
          sectionScores: (session?.section_scores as Record<string, number>) || {},
        });
      }

      // Progress over time (only completed tests)
      const progressOverTime = practiceSessions
        ?.filter(s => s.status === 'completed' && s.final_score !== null)
        .map(s => ({
          testNumber: s.test_number || 0,
          score: s.final_score || 0,
          date: s.completed_at || s.updated_at,
        }))
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