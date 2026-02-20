/**
 * Drill Recommendation Service
 *
 * Analyzes user performance from diagnostic and practice tests to recommend
 * specific sub-skills for targeted drill practice.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DrillRecommendation {
  subSkill: string;
  section: string;
  reason: string;
  priority: number; // Higher = more recommended (0-100)
  averageScore: number | null;
  attemptsCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SubSkillPerformance {
  subSkill: string;
  section: string;
  totalQuestions: number;
  correctAnswers: number;
  attemptsCount: number;
  averageScore: number;
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
 * Calculate recommendations based on diagnostic and practice test performance
 * Returns top 3 worst-performing sub-skills based on % correct across all completed tests
 */
export async function getDrillRecommendations(
  userId: string,
  productId: string,
  limit: number = 3
): Promise<DrillRecommendation[]> {
  const dbProductType = getDbProductType(productId);

  console.log('🎯 RECOMMENDATIONS: Fetching for user:', userId, 'product:', dbProductType);

  try {
    // 1. Get all completed diagnostic and practice test sessions
    const { data: completedSessions, error: sessionsError } = await supabase
      .from('user_test_sessions')
      .select('id, test_mode, section_name')
      .eq('user_id', userId)
      .eq('product_type', dbProductType)
      .eq('status', 'completed')
      .in('test_mode', ['diagnostic', 'practice', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5']);

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return [];
    }

    if (!completedSessions || completedSessions.length === 0) {
      console.log('📊 No completed diagnostic or practice tests found');
      return [];
    }

    console.log('📊 Found', completedSessions.length, 'completed sessions');

    // 2. Get question attempts for these sessions
    const sessionIds = completedSessions.map(s => s.id);
    const { data: questionAttempts, error: attemptsError } = await supabase
      .from('question_attempt_history')
      .select(`
        question_id,
        is_correct,
        session_id
      `)
      .eq('user_id', userId)
      .in('session_id', sessionIds);

    if (attemptsError) {
      console.error('❌ Error fetching question attempts:', attemptsError);
      return [];
    }

    if (!questionAttempts || questionAttempts.length === 0) {
      console.log('📊 No question attempts found for completed sessions');
      return [];
    }

    console.log('📊 Found', questionAttempts.length, 'question attempts');

    // 3. Get question details (sub_skill, section_name) for attempted questions
    const questionIds = [...new Set(questionAttempts.map(a => a.question_id))];
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, sub_skill, section_name, difficulty')
      .in('id', questionIds)
      .eq('product_type', dbProductType);

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return [];
    }

    console.log('📊 Found', questions?.length || 0, 'question details');

    // 4. Calculate performance by sub-skill
    const subSkillPerformanceMap = new Map<string, SubSkillPerformance>();

    questionAttempts.forEach(attempt => {
      const question = questions?.find(q => q.id === attempt.question_id);
      if (!question || !question.sub_skill) return;

      const key = `${question.section_name}:${question.sub_skill}`;

      if (!subSkillPerformanceMap.has(key)) {
        subSkillPerformanceMap.set(key, {
          subSkill: question.sub_skill,
          section: question.section_name,
          totalQuestions: 0,
          correctAnswers: 0,
          attemptsCount: 0,
          averageScore: 0
        });
      }

      const performance = subSkillPerformanceMap.get(key)!;
      performance.totalQuestions++;
      performance.attemptsCount++;
      if (attempt.is_correct) {
        performance.correctAnswers++;
      }
      performance.averageScore = Math.round((performance.correctAnswers / performance.totalQuestions) * 100);
    });

    console.log('📊 Analyzed performance for', subSkillPerformanceMap.size, 'sub-skills');

    // 5. Convert to recommendations - prioritize by lowest % correct
    const recommendations: DrillRecommendation[] = [];

    subSkillPerformanceMap.forEach((performance) => {
      // Skip if not enough data (require at least 3 questions for reliable metric)
      if (performance.totalQuestions < 3) return;

      // Priority = inverted score (lower score = higher priority)
      // Simple ranking: 100 - averageScore means lowest scores come first
      const priority = 100 - performance.averageScore;

      // Determine recommended difficulty based on score
      let difficulty: 'easy' | 'medium' | 'hard';
      if (performance.averageScore < 50) {
        difficulty = 'easy';
      } else if (performance.averageScore < 75) {
        difficulty = 'medium';
      } else {
        difficulty = 'hard';
      }

      // Generate reason based on score and attempts
      let reason: string;
      if (performance.averageScore < 40) {
        reason = `${performance.averageScore}% correct across ${performance.attemptsCount} questions - Focus needed`;
      } else if (performance.averageScore < 60) {
        reason = `${performance.averageScore}% correct - Below target`;
      } else if (performance.averageScore < 75) {
        reason = `${performance.averageScore}% correct - Room to improve`;
      } else {
        reason = `${performance.averageScore}% correct - Build mastery`;
      }

      recommendations.push({
        subSkill: performance.subSkill,
        section: performance.section,
        reason,
        priority,
        averageScore: performance.averageScore,
        attemptsCount: performance.attemptsCount,
        difficulty
      });
    });

    // 6. Sort by lowest % correct (highest priority) and return top 3
    const sortedRecommendations = recommendations
      .sort((a, b) => b.priority - a.priority) // Higher priority = lower score = worse performance
      .slice(0, limit);

    console.log('🎯 RECOMMENDATIONS: Analyzed', subSkillPerformanceMap.size, 'sub-skills');
    console.log('🎯 RECOMMENDATIONS: Returning top', sortedRecommendations.length, 'worst-performing areas');
    console.log('🎯 Top 3 recommendations (by % correct):', sortedRecommendations.map(r => ({
      subSkill: r.subSkill,
      section: r.section,
      percentCorrect: r.averageScore,
      totalQuestions: r.attemptsCount,
      suggestedDifficulty: r.difficulty
    })));

    return sortedRecommendations;
  } catch (error) {
    console.error('❌ Error calculating drill recommendations:', error);
    return [];
  }
}

/**
 * Check if recommendations need to be refreshed
 * Returns true if user has completed a new diagnostic or practice test since last check
 */
export async function shouldRefreshRecommendations(
  userId: string,
  productId: string,
  lastCheckTimestamp: string | null
): Promise<boolean> {
  const dbProductType = getDbProductType(productId);

  // If never checked, always refresh
  if (!lastCheckTimestamp) return true;

  const { data: recentSessions } = await supabase
    .from('user_test_sessions')
    .select('created_at')
    .eq('user_id', userId)
    .eq('product_type', dbProductType)
    .eq('status', 'completed')
    .in('test_mode', ['diagnostic', 'practice', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .gte('created_at', lastCheckTimestamp)
    .limit(1);

  return (recentSessions && recentSessions.length > 0) ?? false;
}
