/**
 * V2 Question Generation Engine - Example Distributor
 * Ensures balanced distribution of example question types within each sub-skill
 *
 * Created: 2026-02-09
 */

import type { SubSkillExample } from '@/data/curriculumData_v2/types';

/**
 * Distribution plan for generating questions based on example types
 */
export interface ExampleDistributionPlan {
  total_questions: number;
  total_examples: number;
  distribution: Array<{
    example_index: number;
    example_difficulty: number;
    example_characteristics: string[];
    use_count: number;
  }>;
}

/**
 * Creates a balanced distribution plan for generating questions
 * across all available example types within a sub-skill
 *
 * @example
 * // Sub-skill has 5 example questions, need to generate 8 questions
 * const plan = createExampleDistributionPlan(examples, 8);
 * // Result: Use examples [0,1,2,3,4,0,1,2] - cycles through all 5 evenly
 *
 * @example
 * // Sub-skill has 8 example questions, need to generate 5 questions
 * const plan = createExampleDistributionPlan(examples, 5);
 * // Result: Use examples [0,1,2,3,4] - takes first 5
 */
export function createExampleDistributionPlan(
  examples: SubSkillExample[],
  questionsToGenerate: number
): ExampleDistributionPlan {

  if (examples.length === 0) {
    throw new Error('Cannot create distribution plan: no examples provided');
  }

  if (questionsToGenerate === 0) {
    throw new Error('Cannot create distribution plan: questionsToGenerate must be > 0');
  }

  const totalExamples = examples.length;
  const baseCount = Math.floor(questionsToGenerate / totalExamples);
  const remainder = questionsToGenerate % totalExamples;

  // Create distribution array
  const distribution = examples.map((example, index) => ({
    example_index: index,
    example_difficulty: example.difficulty,
    example_characteristics: example.characteristics || [],
    use_count: baseCount + (index < remainder ? 1 : 0)
  }));

  return {
    total_questions: questionsToGenerate,
    total_examples: totalExamples,
    distribution
  };
}

/**
 * Generates a sequence of example indices to use for question generation
 * This ensures even cycling through all available examples
 *
 * @example
 * const sequence = generateExampleSequence(5, 8);
 * // Returns: [0, 1, 2, 3, 4, 0, 1, 2]
 * // Cycles through all 5 examples evenly
 *
 * @example
 * const sequence = generateExampleSequence(3, 10);
 * // Returns: [0, 0, 0, 0, 1, 1, 1, 2, 2, 2]
 * // 10 ÷ 3 = 3 each, with 1 remainder to first example
 */
export function generateExampleSequence(
  totalExamples: number,
  questionsToGenerate: number
): number[] {

  const plan = createExampleDistributionPlan(
    // Create dummy examples array just for the math
    Array(totalExamples).fill(null).map((_, i) => ({
      difficulty: 2,
      question_text: '',
      correct_answer: '',
      explanation: '',
      characteristics: []
    })),
    questionsToGenerate
  );

  // Build the actual sequence
  const sequence: number[] = [];

  for (const item of plan.distribution) {
    for (let i = 0; i < item.use_count; i++) {
      sequence.push(item.example_index);
    }
  }

  // Shuffle the sequence to avoid all questions of same type being together
  // But keep it deterministic for reproducibility
  return shuffleWithSeed(sequence, 42);
}

/**
 * Deterministic shuffle using seed
 * This ensures reproducible example distribution
 */
function shuffleWithSeed(array: number[], seed: number): number[] {
  const shuffled = [...array];
  let currentSeed = seed;

  // Simple seeded random number generator (LCG algorithm)
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  // Fisher-Yates shuffle with seeded random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Get the next example to use for generation
 * Uses round-robin distribution to cycle through all examples evenly
 */
export function getNextExample(
  examples: SubSkillExample[],
  currentIndex: number
): { example: SubSkillExample; nextIndex: number } {

  if (examples.length === 0) {
    throw new Error('No examples available');
  }

  const example = examples[currentIndex % examples.length];
  const nextIndex = (currentIndex + 1) % examples.length;

  return { example, nextIndex };
}

/**
 * Print distribution plan for debugging
 */
export function printDistributionPlan(
  plan: ExampleDistributionPlan,
  subSkillName: string
): void {
  console.log(`\n📊 Example Distribution Plan: ${subSkillName}`);
  console.log(`   Total questions to generate: ${plan.total_questions}`);
  console.log(`   Total example types available: ${plan.total_examples}`);
  console.log(`   Distribution:`);

  plan.distribution.forEach((item, i) => {
    console.log(`      Example ${i + 1} (Difficulty ${item.example_difficulty}): ${item.use_count}x`);
  });

  const sequence = generateExampleSequence(plan.total_examples, plan.total_questions);
  console.log(`   Sequence: [${sequence.map(i => i + 1).join(', ')}]`);
}

/**
 * Create balanced distribution for multiple sub-skills
 * Returns a map of sub-skill -> example sequence
 */
export function createMultiSubSkillDistribution(
  subSkills: Array<{
    name: string;
    examples: SubSkillExample[];
    questionCount: number;
  }>
): Map<string, number[]> {

  const distribution = new Map<string, number[]>();

  for (const subSkill of subSkills) {
    const sequence = generateExampleSequence(
      subSkill.examples.length,
      subSkill.questionCount
    );

    distribution.set(subSkill.name, sequence);

    if (process.env.LOG_DISTRIBUTION === 'true') {
      console.log(`\n📊 ${subSkill.name}:`);
      console.log(`   Examples: ${subSkill.examples.length}`);
      console.log(`   Questions: ${subSkill.questionCount}`);
      console.log(`   Sequence: [${sequence.map(i => i + 1).join(', ')}]`);
    }
  }

  return distribution;
}
