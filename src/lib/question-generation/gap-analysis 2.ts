/**
 * Gap Analysis - Determine how many questions need to be generated
 * Queries database to find gaps between current questions and target quotas
 */

import { createClient } from '@supabase/supabase-js';
import type { GenerationRequest } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Define quotas for each product/section/sub-skill/difficulty
 * This represents the target number of questions we want in the database
 */
export interface QuotaDefinition {
  testType: string;
  section: string;
  subSkill: string;
  difficulty: number;
  targetCount: number;
  yearLevel: number;
}

/**
 * Result of gap analysis - what needs to be generated
 */
export interface Gap {
  request: GenerationRequest;
  current: number;
  target: number;
  needed: number;
}

/**
 * EduTest Verbal Reasoning quotas
 * Based on 8 question types with balanced distribution across difficulties
 */
export const EDUTEST_VERBAL_QUOTAS: QuotaDefinition[] = [
  // Vocabulary - Synonyms (15% of questions)
  { testType: 'edutest', section: 'verbal', subSkill: 'vocabulary-synonyms', difficulty: 1, targetCount: 50, yearLevel: 7 },
  { testType: 'edutest', section: 'verbal', subSkill: 'vocabulary-synonyms', difficulty: 2, targetCount: 50, yearLevel: 8 },
  { testType: 'edutest', section: 'verbal', subSkill: 'vocabulary-synonyms', difficulty: 3, targetCount: 50, yearLevel: 9 },

  // Vocabulary - Antonyms (10% of questions)
  { testType: 'edutest', section: 'verbal', subSkill: 'vocabulary-antonyms', difficulty: 1, targetCount: 35, yearLevel: 7 },
  { testType: 'edutest', section: 'verbal', subSkill: 'vocabulary-antonyms', difficulty: 2, targetCount: 35, yearLevel: 8 },
  { testType: 'edutest', section: 'verbal', subSkill: 'vocabulary-antonyms', difficulty: 3, targetCount: 35, yearLevel: 9 },

  // Word Relationships - Analogies (20% of questions)
  { testType: 'edutest', section: 'verbal', subSkill: 'word-relationships-analogies', difficulty: 1, targetCount: 70, yearLevel: 7 },
  { testType: 'edutest', section: 'verbal', subSkill: 'word-relationships-analogies', difficulty: 2, targetCount: 70, yearLevel: 8 },
  { testType: 'edutest', section: 'verbal', subSkill: 'word-relationships-analogies', difficulty: 3, targetCount: 70, yearLevel: 9 },

  // Pattern Recognition - Foreign Language (15% of questions)
  { testType: 'edutest', section: 'verbal', subSkill: 'pattern-recognition-foreign-language', difficulty: 1, targetCount: 50, yearLevel: 7 },
  { testType: 'edutest', section: 'verbal', subSkill: 'pattern-recognition-foreign-language', difficulty: 2, targetCount: 50, yearLevel: 8 },
  { testType: 'edutest', section: 'verbal', subSkill: 'pattern-recognition-foreign-language', difficulty: 3, targetCount: 50, yearLevel: 9 },

  // Logical Reasoning - Deduction (15% of questions)
  { testType: 'edutest', section: 'verbal', subSkill: 'logical-reasoning-deduction', difficulty: 1, targetCount: 50, yearLevel: 7 },
  { testType: 'edutest', section: 'verbal', subSkill: 'logical-reasoning-deduction', difficulty: 2, targetCount: 50, yearLevel: 8 },
  { testType: 'edutest', section: 'verbal', subSkill: 'logical-reasoning-deduction', difficulty: 3, targetCount: 50, yearLevel: 9 },

  // TODO: Add quotas for:
  // - Classification - Odd One Out (10%)
  // - Letter Manipulation - Anagrams (10%)
  // - Logical Reasoning - Sequencing (5%)
];

/**
 * Get current count of questions in database for a specific sub-skill/difficulty
 */
export async function getCurrentQuestionCount(
  testType: string,
  section: string,
  subSkill: string,
  difficulty: number
): Promise<number> {
  const { count, error } = await supabase
    .from('drill_questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_type', testType)
    .eq('section', section)
    .eq('sub_skill', subSkill)
    .eq('difficulty', difficulty);

  if (error) {
    console.error('Error counting questions:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Analyze gaps between current questions and target quotas
 */
export async function analyzeGaps(quotas: QuotaDefinition[]): Promise<Gap[]> {
  const gaps: Gap[] = [];

  console.log('\n📊 Analyzing question gaps...\n');

  for (const quota of quotas) {
    const current = await getCurrentQuestionCount(
      quota.testType,
      quota.section,
      quota.subSkill,
      quota.difficulty
    );

    const needed = Math.max(0, quota.targetCount - current);

    if (needed > 0) {
      gaps.push({
        request: {
          testType: quota.testType,
          section: quota.section,
          subSkill: quota.subSkill,
          difficulty: quota.difficulty,
          yearLevel: quota.yearLevel
        },
        current,
        target: quota.targetCount,
        needed
      });

      console.log(`  ${quota.subSkill} (difficulty ${quota.difficulty}): ${current}/${quota.targetCount} → Need ${needed} more`);
    } else {
      console.log(`  ${quota.subSkill} (difficulty ${quota.difficulty}): ${current}/${quota.targetCount} ✓ Complete`);
    }
  }

  const totalNeeded = gaps.reduce((sum, gap) => sum + gap.needed, 0);
  console.log(`\n  Total questions needed: ${totalNeeded}\n`);

  return gaps;
}

/**
 * Get priority gaps (most urgent to fill)
 * Prioritizes: 1) Completely empty sub-skills, 2) Lowest fill percentage
 */
export function prioritizeGaps(gaps: Gap[]): Gap[] {
  return [...gaps].sort((a, b) => {
    // Completely empty sub-skills first
    if (a.current === 0 && b.current > 0) return -1;
    if (a.current > 0 && b.current === 0) return 1;

    // Then sort by fill percentage (lowest first)
    const aPercent = a.current / a.target;
    const bPercent = b.current / b.target;
    return aPercent - bPercent;
  });
}

/**
 * Generate batch plan - how many questions to generate in one batch
 */
export interface BatchPlan {
  gaps: Gap[];
  totalQuestions: number;
  estimatedCost: number;
  estimatedTimeMinutes: number;
}

export function createBatchPlan(
  gaps: Gap[],
  maxQuestionsPerBatch: number = 100,
  costPerQuestion: number = 0.020,
  secondsPerQuestion: number = 8
): BatchPlan {
  const prioritized = prioritizeGaps(gaps);

  // Take up to maxQuestionsPerBatch, distributed across gaps
  const batchGaps: Gap[] = [];
  let totalQuestions = 0;

  for (const gap of prioritized) {
    if (totalQuestions >= maxQuestionsPerBatch) break;

    const questionsToGenerate = Math.min(
      gap.needed,
      maxQuestionsPerBatch - totalQuestions
    );

    if (questionsToGenerate > 0) {
      batchGaps.push({
        ...gap,
        needed: questionsToGenerate
      });
      totalQuestions += questionsToGenerate;
    }
  }

  return {
    gaps: batchGaps,
    totalQuestions,
    estimatedCost: totalQuestions * costPerQuestion,
    estimatedTimeMinutes: (totalQuestions * secondsPerQuestion) / 60
  };
}
