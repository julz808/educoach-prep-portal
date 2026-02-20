/**
 * V2 Question Generation Engine - Difficulty Distributor
 * Handles difficulty level distribution across test sections
 *
 * Created: 2026-02-09
 */

/**
 * Difficulty distribution strategy
 */
export type DifficultyStrategy =
  | { type: 'single'; difficulty: 1 | 2 | 3 }  // All questions at one difficulty
  | { type: 'balanced'; difficulties: number[] }  // Even distribution across difficulties
  | { type: 'weighted'; weights: Record<number, number> }  // Custom weighted distribution
  | { type: 'progressive'; start: number; end: number };  // Progressive difficulty

/**
 * Difficulty distribution plan
 */
export interface DifficultyDistributionPlan {
  total_questions: number;
  strategy: string;
  distribution: Array<{
    difficulty: number;
    count: number;
    percentage: number;
  }>;
  sequence: number[];  // Ordered sequence of difficulties to use
}

/**
 * Create difficulty distribution plan based on strategy
 *
 * @example Single Difficulty
 * const plan = createDifficultyPlan(40, { type: 'single', difficulty: 2 });
 * // All 40 questions at difficulty 2
 *
 * @example Balanced Difficulty
 * const plan = createDifficultyPlan(40, { type: 'balanced', difficulties: [1, 2, 3] });
 * // ~13 questions at difficulty 1, ~13 at difficulty 2, ~14 at difficulty 3
 *
 * @example Weighted Difficulty
 * const plan = createDifficultyPlan(40, {
 *   type: 'weighted',
 *   weights: { 1: 1, 2: 2, 3: 1 }  // 25% easy, 50% medium, 25% hard
 * });
 */
export function createDifficultyPlan(
  totalQuestions: number,
  strategy: DifficultyStrategy
): DifficultyDistributionPlan {

  let distribution: Array<{ difficulty: number; count: number; percentage: number }>;
  let sequence: number[];

  switch (strategy.type) {
    case 'single':
      // All questions at same difficulty
      distribution = [{
        difficulty: strategy.difficulty,
        count: totalQuestions,
        percentage: 100
      }];
      sequence = Array(totalQuestions).fill(strategy.difficulty);
      break;

    case 'balanced':
      // Even distribution across specified difficulties
      distribution = createBalancedDistribution(totalQuestions, strategy.difficulties);
      sequence = createBalancedSequence(distribution);
      break;

    case 'weighted':
      // Custom weighted distribution
      distribution = createWeightedDistribution(totalQuestions, strategy.weights);
      sequence = createBalancedSequence(distribution);
      break;

    case 'progressive':
      // Progressive difficulty (easy to hard)
      distribution = createProgressiveDistribution(totalQuestions, strategy.start, strategy.end);
      sequence = createProgressiveSequence(distribution, strategy.start, strategy.end);
      break;

    default:
      throw new Error(`Unknown difficulty strategy: ${(strategy as any).type}`);
  }

  return {
    total_questions: totalQuestions,
    strategy: strategy.type,
    distribution,
    sequence
  };
}

/**
 * Create balanced distribution across difficulty levels
 */
function createBalancedDistribution(
  totalQuestions: number,
  difficulties: number[]
): Array<{ difficulty: number; count: number; percentage: number }> {

  const baseCount = Math.floor(totalQuestions / difficulties.length);
  const remainder = totalQuestions % difficulties.length;

  return difficulties.map((difficulty, index) => {
    const count = baseCount + (index < remainder ? 1 : 0);
    return {
      difficulty,
      count,
      percentage: Math.round((count / totalQuestions) * 100)
    };
  });
}

/**
 * Create weighted distribution based on custom weights
 */
function createWeightedDistribution(
  totalQuestions: number,
  weights: Record<number, number>
): Array<{ difficulty: number; count: number; percentage: number }> {

  const difficulties = Object.keys(weights).map(Number).sort();
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  let assigned = 0;
  const distribution = difficulties.map((difficulty, index) => {
    const weight = weights[difficulty];
    const targetCount = Math.round((weight / totalWeight) * totalQuestions);

    // For last difficulty, assign remaining questions to avoid rounding errors
    const count = (index === difficulties.length - 1)
      ? totalQuestions - assigned
      : targetCount;

    assigned += count;

    return {
      difficulty,
      count,
      percentage: Math.round((count / totalQuestions) * 100)
    };
  });

  return distribution;
}

/**
 * Create progressive distribution (gradual increase in difficulty)
 */
function createProgressiveDistribution(
  totalQuestions: number,
  start: number,
  end: number
): Array<{ difficulty: number; count: number; percentage: number }> {

  const difficulties = [];
  for (let d = start; d <= end; d++) {
    difficulties.push(d);
  }

  // For progressive, give more weight to middle difficulties
  const weights: Record<number, number> = {};
  difficulties.forEach((d, i) => {
    weights[d] = i + 1;  // Increasing weight
  });

  return createWeightedDistribution(totalQuestions, weights);
}

/**
 * Create balanced sequence (shuffled to avoid clustering)
 */
function createBalancedSequence(
  distribution: Array<{ difficulty: number; count: number }>
): number[] {

  const sequence: number[] = [];

  // Create array with all difficulties
  for (const item of distribution) {
    for (let i = 0; i < item.count; i++) {
      sequence.push(item.difficulty);
    }
  }

  // Shuffle to avoid clustering
  return shuffleWithSeed(sequence, 123);
}

/**
 * Create progressive sequence (gradually increasing)
 */
function createProgressiveSequence(
  distribution: Array<{ difficulty: number; count: number }>,
  start: number,
  end: number
): number[] {

  const sequence: number[] = [];

  // Add difficulties in progressive order
  for (const item of distribution) {
    for (let i = 0; i < item.count; i++) {
      sequence.push(item.difficulty);
    }
  }

  // Don't shuffle - keep progressive order
  return sequence;
}

/**
 * Deterministic shuffle using seed
 */
function shuffleWithSeed(array: number[], seed: number): number[] {
  const shuffled = [...array];
  let currentSeed = seed;

  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Print difficulty distribution plan
 */
export function printDifficultyPlan(plan: DifficultyDistributionPlan): void {
  console.log(`\n📊 Difficulty Distribution Plan`);
  console.log(`   Strategy: ${plan.strategy}`);
  console.log(`   Total questions: ${plan.total_questions}`);
  console.log(`   Distribution:`);

  plan.distribution.forEach(item => {
    const bar = '█'.repeat(Math.round(item.percentage / 5));
    console.log(`      Difficulty ${item.difficulty}: ${item.count} questions (${item.percentage}%) ${bar}`);
  });

  console.log(`   Sequence: [${plan.sequence.slice(0, 20).join(', ')}${plan.sequence.length > 20 ? ', ...' : ''}]`);
}

/**
 * Get difficulty for specific question index
 */
export function getDifficultyForQuestion(
  plan: DifficultyDistributionPlan,
  questionIndex: number
): number {
  if (questionIndex >= plan.sequence.length) {
    throw new Error(`Question index ${questionIndex} out of range (max: ${plan.sequence.length - 1})`);
  }
  return plan.sequence[questionIndex];
}

/**
 * Create difficulty plan for sub-skill based on section strategy
 *
 * @param subSkillQuestionCount - Number of questions for this sub-skill
 * @param sectionStrategy - Overall section difficulty strategy
 * @returns Difficulty plan for this specific sub-skill
 */
export function createSubSkillDifficultyPlan(
  subSkillQuestionCount: number,
  sectionStrategy: DifficultyStrategy
): DifficultyDistributionPlan {

  return createDifficultyPlan(subSkillQuestionCount, sectionStrategy);
}
