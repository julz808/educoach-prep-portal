/**
 * V2 Question Generation Engine - Section Generator
 * Orchestrates generation of complete test sections based on section blueprints
 *
 * Created: 2026-02-09
 */

import type { QuestionV2, PassageV2 } from './types';
import { getSectionConfig, calculateBalancedDistribution, SUB_SKILL_EXAMPLES } from '@/data/curriculumData_v2';
import type { WritingBlueprint } from '@/data/curriculumData_v2/types';
import { generateQuestionV2 } from './generator';
import { generatePassageWithQuestions, generateMultiplePassagesWithQuestions } from './passageGenerator';
import { generateExampleSequence, printDistributionPlan, createExampleDistributionPlan } from './exampleDistributor';
import {
  createDifficultyPlan,
  createSubSkillDifficultyPlan,
  printDifficultyPlan,
  getDifficultyForQuestion,
  type DifficultyStrategy
} from './difficultyDistributor';
import { getExistingQuestionCounts, detectSectionGaps, printSectionGapSummary } from './gapDetection';
import { getExistingPassageCountsByType } from './supabaseStorage';
import { createClient } from '@supabase/supabase-js';

// Create supabase client for direct queries
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// SECTION GENERATION RESULT
// ============================================================================

export interface SubSkillStats {
  target: number;
  generated: number;
  failed: number;       // questions that exhausted all retries and were skipped
  reattempts: number;   // extra generation attempts (beyond the first) across all questions
}

export interface SectionGenerationResult {
  success: boolean;
  testType: string;
  sectionName: string;
  questions: QuestionV2[];
  passages: PassageV2[];
  metadata: {
    total_questions_requested: number;
    total_questions_generated: number;
    generation_strategy: "balanced" | "passage_based" | "hybrid";
    total_passages: number;
    total_cost: number;
    total_time_ms: number;
    breakdown: {
      standalone_questions?: number;
      passage_based_questions?: number;
      passages_generated?: number;
    };
    // Per-sub-skill failure/reattempt tracking
    subSkillStats: Record<string, SubSkillStats>;
    totalFailed: number;
    totalReattempts: number;
  };
  error?: string;
}

// ============================================================================
// MAIN SECTION GENERATOR
// ============================================================================

/**
 * Generate an entire test section based on its configuration
 *
 * This is the main entry point for section-level generation.
 * It reads the section configuration and dispatches to the appropriate strategy.
 *
 * @example
 * // Generate NSW Selective Reading section (passage-based)
 * const result = await generateSectionV2({
 *   testType: "NSW Selective Entry (Year 7 Entry)",
 *   sectionName: "Reading",
 *   difficulty: 2,
 *   testMode: "practice_1"
 * });
 *
 * @example
 * // Generate EduTest Verbal Reasoning section (balanced)
 * const result = await generateSectionV2({
 *   testType: "EduTest Scholarship (Year 7 Entry)",
 *   sectionName: "Verbal Reasoning",
 *   difficulty: 2,
 *   testMode: "practice_1"
 * });
 */
export async function generateSectionV2(params: {
  testType: string;
  sectionName: string;
  difficultyStrategy: DifficultyStrategy;
  testMode: string;
  skipStorage?: boolean;
  crossModeDiversity?: boolean;  // Enable cross-mode diversity checking
}): Promise<SectionGenerationResult> {

  const { testType, sectionName, difficultyStrategy, testMode, skipStorage = false, crossModeDiversity = false } = params;
  const startTime = Date.now();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 SECTION GENERATION - V2 ENGINE`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Test Type: ${testType}`);
  console.log(`Section: ${sectionName}`);
  console.log(`Difficulty Strategy: ${difficultyStrategy.type}`);
  console.log(`Test Mode: ${testMode}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Step 1: Load section configuration
    const sectionConfig = getSectionConfig(testType, sectionName);

    if (!sectionConfig) {
      throw new Error(`No configuration found for ${testType} - ${sectionName}`);
    }

    const { section_structure, total_questions } = sectionConfig;
    const strategy = section_structure.generation_strategy;

    console.log(`📋 Section Configuration:`);
    console.log(`   Strategy: ${strategy}`);
    console.log(`   Total Questions: ${total_questions}`);
    console.log(`${'='.repeat(80)}\n`);

    // Create difficulty distribution plan
    const difficultyPlan = createDifficultyPlan(total_questions, difficultyStrategy);
    printDifficultyPlan(difficultyPlan);

    let questions: QuestionV2[] = [];
    let passages: PassageV2[] = [];
    let totalCost = 0;
    let subSkillStats: Record<string, SubSkillStats> = {};

    // Step 2: Generate based on strategy
    if (strategy === "balanced") {
      const result = await generateBalancedSection({
        testType,
        sectionName,
        config: section_structure.balanced_distribution!,
        difficultyPlan,
        testMode,
        skipStorage,
        crossModeDiversity
      });

      questions = result.questions;
      totalCost = result.totalCost;
      subSkillStats = result.subSkillStats;
    }
    else if (strategy === "passage_based") {
      const result = await generatePassageBasedSection({
        testType,
        sectionName,
        config: section_structure.passage_blueprint!,
        difficultyPlan,
        testMode,
        skipStorage
      });

      questions = result.questions;
      passages = result.passages;
      totalCost = result.totalCost;
      subSkillStats = result.subSkillStats;
    }
    else if (strategy === "hybrid") {
      const result = await generateHybridSection({
        testType,
        sectionName,
        config: section_structure.hybrid_blueprint!,
        difficultyPlan,
        testMode,
        skipStorage
      });

      questions = result.questions;
      passages = result.passages;
      totalCost = result.totalCost;
      subSkillStats = result.subSkillStats;
    }
    else if (strategy === "writing_prompt") {
      const result = await generateWritingPromptSection({
        testType,
        sectionName,
        config: section_structure.writing_blueprint!,
        difficultyPlan,
        testMode,
        skipStorage,
        crossModeDiversity
      });

      questions = result.questions;
      totalCost = result.totalCost;
      subSkillStats = result.subSkillStats;
    }
    else {
      throw new Error(`Unknown generation strategy: ${strategy}`);
    }

    const totalTime = Date.now() - startTime;
    const totalFailed = Object.values(subSkillStats).reduce((sum, s) => sum + s.failed, 0);
    const totalReattempts = Object.values(subSkillStats).reduce((sum, s) => sum + s.reattempts, 0);

    // Step 3: Return results
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ SECTION GENERATION COMPLETE`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📝 Questions generated: ${questions.length}/${total_questions}`);
    console.log(`📖 Passages generated: ${passages.length}`);
    console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(1)}s`);
    if (totalFailed > 0 || totalReattempts > 0) {
      console.log(`⚠️  Failures: ${totalFailed} | Reattempts: ${totalReattempts}`);
    }
    console.log(`${'='.repeat(80)}\n`);

    return {
      success: true,
      testType,
      sectionName,
      questions,
      passages,
      metadata: {
        total_questions_requested: total_questions,
        total_questions_generated: questions.length,
        generation_strategy: strategy,
        total_passages: passages.length,
        total_cost: totalCost,
        total_time_ms: totalTime,
        breakdown: {
          standalone_questions: strategy === "hybrid" ? questions.filter(q => !q.passage_id).length : undefined,
          passage_based_questions: passages.length > 0 ? questions.filter(q => q.passage_id).length : undefined,
          passages_generated: passages.length
        },
        subSkillStats,
        totalFailed,
        totalReattempts
      }
    };

  } catch (error) {
    const totalTime = Date.now() - startTime;

    console.error(`\n❌ SECTION GENERATION FAILED`);
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`Time elapsed: ${(totalTime / 1000).toFixed(1)}s\n`);

    return {
      success: false,
      testType,
      sectionName,
      questions: [],
      passages: [],
      metadata: {
        total_questions_requested: 0,
        total_questions_generated: 0,
        generation_strategy: "balanced",
        total_passages: 0,
        total_cost: 0,
        total_time_ms: totalTime,
        breakdown: {},
        subSkillStats: {},
        totalFailed: 0,
        totalReattempts: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// STRATEGY: BALANCED DISTRIBUTION
// ============================================================================

async function generateBalancedSection(params: {
  testType: string;
  sectionName: string;
  config: any;
  difficultyPlan: DifficultyDistributionPlan;
  testMode: string;
  skipStorage: boolean;
  crossModeDiversity?: boolean;
}): Promise<{ questions: QuestionV2[]; totalCost: number; subSkillStats: Record<string, SubSkillStats> }> {

  const { testType, sectionName, config, difficultyPlan, testMode, skipStorage, crossModeDiversity = false } = params;
  const { total_questions, sub_skills, distribution_strategy } = config;

  console.log(`📊 BALANCED DISTRIBUTION`);
  console.log(`   Total questions: ${total_questions}`);
  console.log(`   Sub-skills: ${sub_skills.length}`);
  console.log(`   Strategy: ${distribution_strategy}\n`);

  // Calculate distribution across sub-skills
  const distribution = calculateBalancedDistribution(total_questions, sub_skills);

  console.log(`   Distribution:`);
  Object.entries(distribution).forEach(([subSkill, count]) => {
    console.log(`   - ${subSkill}: ${count} questions`);
  });
  console.log();

  // Gap detection: Check existing questions and only generate what's missing
  console.log(`🔍 Checking for existing questions...`);
  const existingCounts = await getExistingQuestionCounts(testType, sectionName, testMode);
  const sectionGap = detectSectionGaps(distribution, existingCounts, sectionName);

  printSectionGapSummary(sectionGap);

  if (sectionGap.totalGaps === 0) {
    console.log(`   ✅ All questions already exist! Nothing to generate.\n`);
    return { questions: [], totalCost: 0 };
  }

  // Update distribution to only generate gaps
  const gapDistribution: { [subSkill: string]: number } = {};
  for (const [subSkill, gap] of Object.entries(sectionGap.subSkillGaps)) {
    if (gap.needed > 0) {
      gapDistribution[subSkill] = gap.needed;
    }
  }

  console.log(`\n📝 Generating missing questions only:\n`);

  // Load sub-skill data to get examples
  const testSectionKey = `${testType} - ${sectionName}`;
  const subSkillDatabase = SUB_SKILL_EXAMPLES[testSectionKey];

  if (!subSkillDatabase) {
    throw new Error(`Sub-skill database not found for: ${testSectionKey}`);
  }

  const questions: QuestionV2[] = [];
  let totalCost = 0;
  let globalQuestionIndex = 0;  // Track global question index for difficulty plan
  const subSkillStats: Record<string, SubSkillStats> = {};

  // Generate questions for each sub-skill with balanced example distribution
  for (const [subSkill, count] of Object.entries(gapDistribution)) {
    console.log(`📝 Generating ${count} missing questions for: ${subSkill}`);

    // Initialise stats for this sub-skill
    subSkillStats[subSkill] = { target: count, generated: 0, failed: 0, reattempts: 0 };

    // Get sub-skill examples
    const subSkillData = subSkillDatabase[subSkill];
    if (!subSkillData || !subSkillData.examples || subSkillData.examples.length === 0) {
      console.warn(`   ⚠️  No examples found for sub-skill: ${subSkill}. Skipping.`);
      subSkillStats[subSkill].failed = count;
      continue;
    }

    // Create example distribution plan
    const plan = createExampleDistributionPlan(subSkillData.examples, count);
    printDistributionPlan(plan, subSkill);

    // Generate example sequence
    const exampleSequence = generateExampleSequence(subSkillData.examples.length, count);

    // Generate questions following the example sequence
    for (let i = 0; i < count; i++) {
      const exampleIndex = exampleSequence[i];
      const targetExample = subSkillData.examples[exampleIndex];

      // Get difficulty from the plan based on global question index
      const questionDifficulty = getDifficultyForQuestion(difficultyPlan, globalQuestionIndex);
      globalQuestionIndex++;

      console.log(`   Q${i + 1}/${count}: Using example type ${exampleIndex + 1} (Example diff: ${targetExample.difficulty}, Assigned diff: ${questionDifficulty})...`);

      try {
        const result = await generateQuestionV2(
          {
            testType,
            section: sectionName,
            subSkill,
            difficulty: questionDifficulty,  // Use difficulty from plan
            testMode
          },
          {
            skipValidation: false,
            skipStorage,
            strictValidation: true,
            crossModeDiversity  // Pass through cross-mode diversity option
          }
        );

        // Track reattempts: any attempt beyond the first counts
        if (result.attempts > 1) {
          subSkillStats[subSkill].reattempts += result.attempts - 1;
        }

        if (result.success && result.question) {
          questions.push(result.question);
          totalCost += result.cost;
          subSkillStats[subSkill].generated++;
          console.log(`      ✅ Generated (${result.validationResult?.qualityScore}/100 quality)`);
        } else {
          subSkillStats[subSkill].failed++;
          console.log(`      ❌ Failed: ${result.error}`);
        }
      } catch (error) {
        subSkillStats[subSkill].failed++;
        console.log(`      ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    console.log();
  }

  return { questions, totalCost, subSkillStats };
}

// ============================================================================
// STRATEGY: PASSAGE-BASED
// ============================================================================

async function generatePassageBasedSection(params: {
  testType: string;
  sectionName: string;
  config: any;
  difficultyPlan: DifficultyDistributionPlan;
  testMode: string;
  skipStorage: boolean;
}): Promise<{ questions: QuestionV2[]; passages: PassageV2[]; totalCost: number; subSkillStats: Record<string, SubSkillStats> }> {

  const { testType, sectionName, config, difficultyPlan, testMode, skipStorage } = params;
  const { total_passages, passage_distribution } = config;

  console.log(`📖 PASSAGE-BASED GENERATION`);
  console.log(`   Total passages: ${total_passages}`);
  console.log(`   Passage types: ${passage_distribution.length}\n`);

  // Gap detection: Check how many passages of each type already exist for this test_mode
  console.log(`🔍 Checking for existing passages...`);
  const existingPassageCounts = await getExistingPassageCountsByType(testType, sectionName, testMode);
  console.log(`   Existing passages by type:`, existingPassageCounts);

  // Filter passage_distribution to only include specs where passages are still needed
  const specsNeeded: typeof passage_distribution = [];
  for (const spec of passage_distribution) {
    const existing = existingPassageCounts[spec.passage_type] || 0;
    const needed = Math.max(0, spec.count - existing);
    if (needed > 0) {
      specsNeeded.push({ ...spec, count: needed });
      console.log(`   ${spec.passage_type}: ${existing} existing, ${needed} needed`);
    } else {
      console.log(`   ${spec.passage_type}: ${existing} existing — ✅ complete, skipping`);
    }
  }

  // If no new passages are needed, we still need to check if QUESTIONS exist for this test mode
  // Passages are reusable across modes, but questions are mode-specific
  if (specsNeeded.length === 0) {
    console.log(`\n   ✅ All passages already exist!\n`);

    // Check if questions already exist for this test mode
    const existingQuestionCount = await getExistingQuestionCount(testType, sectionName, testMode);
    const targetQuestionCount = config.total_questions || 30;

    if (existingQuestionCount >= targetQuestionCount) {
      console.log(`   ✅ ${existingQuestionCount}/${targetQuestionCount} questions already exist for ${testMode}. Skipping.\n`);
      return { questions: [], passages: [], totalCost: 0, subSkillStats: {} };
    }

    console.log(`   📝 Generating questions from existing passages for ${testMode}...`);
    console.log(`   Target: ${targetQuestionCount} questions, Existing: ${existingQuestionCount}, Needed: ${targetQuestionCount - existingQuestionCount}\n`);

    // Generate questions from existing passages
    const result = await generateQuestionsFromExistingPassages({
      testType,
      sectionName,
      testMode,
      targetQuestionCount,
      existingQuestionCount,
      difficultyPlan,
      skipStorage
    });

    return {
      questions: result.questions,
      passages: [],
      totalCost: result.totalCost,
      subSkillStats: result.subSkillStats || {}
    };
  }

  // Use the primary difficulty from the plan for passages
  const primaryDifficulty = difficultyPlan.distribution.reduce((max, d) =>
    d.count > max.count ? d : max
  ).difficulty;

  const result = await generateMultiplePassagesWithQuestions({
    testType,
    sectionName,
    passageSpecs: specsNeeded,
    difficulty: primaryDifficulty,
    testMode,
    skipStorage
  });

  return {
    questions: result.questions,
    passages: result.passages,
    totalCost: result.metadata.total_cost,
    subSkillStats: {}
  };
}

// ============================================================================
// STRATEGY: HYBRID
// ============================================================================

async function generateHybridSection(params: {
  testType: string;
  sectionName: string;
  config: any;
  difficultyPlan: DifficultyDistributionPlan;
  testMode: string;
  skipStorage: boolean;
}): Promise<{ questions: QuestionV2[]; passages: PassageV2[]; totalCost: number; subSkillStats: Record<string, SubSkillStats> }> {

  const { testType, sectionName, config, difficultyPlan, testMode, skipStorage } = params;
  const {
    standalone_count,
    standalone_distribution,
    passage_based_count,
    passage_distribution,
    interleaving_strategy
  } = config;

  console.log(`🔀 HYBRID GENERATION`);
  console.log(`   Standalone questions: ${standalone_count}`);
  console.log(`   Passage-based questions: ${passage_based_count}`);
  console.log(`   Interleaving: ${interleaving_strategy}\n`);

  // Gap detection for standalone questions: check existing counts at sub-skill level
  console.log(`🔍 Checking for existing standalone questions...`);
  const standaloneDistributionMap: { [subSkill: string]: number } = {};
  for (const spec of standalone_distribution) {
    standaloneDistributionMap[spec.sub_skill] = spec.count;
  }
  const existingStandaloneCounts = await getExistingQuestionCounts(testType, sectionName, testMode);
  const standaloneGap = detectSectionGaps(standaloneDistributionMap, existingStandaloneCounts, sectionName);
  printSectionGapSummary(standaloneGap);

  // Gap detection for passages: check existing passage counts by type
  console.log(`🔍 Checking for existing passages...`);
  const existingPassageCounts = await getExistingPassageCountsByType(testType, sectionName, testMode);

  const standaloneQuestions: QuestionV2[] = [];
  const passageQuestions: QuestionV2[] = [];
  const passages: PassageV2[] = [];
  let totalCost = 0;
  let globalQuestionIndex = 0;  // Track global question index for difficulty plan
  const subSkillStats: Record<string, SubSkillStats> = {};

  // Step 1: Generate standalone questions (gap-aware)
  console.log(`📝 STANDALONE QUESTIONS (${standalone_count})`);
  console.log(`${'='.repeat(80)}\n`);

  for (const spec of standalone_distribution) {
    const existingCount = existingStandaloneCounts[spec.sub_skill] || 0;
    const neededCount = Math.max(0, spec.count - existingCount);

    if (neededCount === 0) {
      console.log(`   ${spec.sub_skill}: ${existingCount} existing — ✅ complete, skipping`);
      continue;
    }

    console.log(`   Generating ${neededCount} missing questions for: ${spec.sub_skill}`);
    subSkillStats[spec.sub_skill] = { target: neededCount, generated: 0, failed: 0, reattempts: 0 };

    for (let i = 0; i < neededCount; i++) {
      // Get difficulty from the plan based on global question index
      const questionDifficulty = getDifficultyForQuestion(difficultyPlan, globalQuestionIndex);
      globalQuestionIndex++;

      try {
        const result = await generateQuestionV2(
          {
            testType,
            section: sectionName,
            subSkill: spec.sub_skill,
            difficulty: questionDifficulty,  // Use difficulty from plan
            testMode
          },
          {
            skipValidation: false,
            skipStorage,
            strictValidation: true
          }
        );

        if (result.attempts > 1) {
          subSkillStats[spec.sub_skill].reattempts += result.attempts - 1;
        }

        if (result.success && result.question) {
          standaloneQuestions.push(result.question);
          totalCost += result.cost;
          subSkillStats[spec.sub_skill].generated++;
          console.log(`      ✅ Q${i + 1}/${neededCount} generated`);
        } else {
          subSkillStats[spec.sub_skill].failed++;
          console.log(`      ❌ Q${i + 1}/${neededCount} failed: ${result.error}`);
        }
      } catch (error) {
        subSkillStats[spec.sub_skill].failed++;
        console.log(`      ❌ Q${i + 1}/${neededCount} error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
  }

  // Step 2: Generate passage-based questions (gap-aware)
  console.log(`\n📖 PASSAGE-BASED QUESTIONS (${passage_based_count})`);
  console.log(`${'='.repeat(80)}\n`);

  // Filter passage_distribution to only include specs with missing passages
  const passageSpecsNeeded: typeof passage_distribution = [];
  for (const spec of passage_distribution) {
    const existing = existingPassageCounts[spec.passage_type] || 0;
    const needed = Math.max(0, spec.count - existing);
    if (needed > 0) {
      passageSpecsNeeded.push({ ...spec, count: needed });
      console.log(`   ${spec.passage_type}: ${existing} existing, ${needed} needed`);
    } else {
      console.log(`   ${spec.passage_type}: ${existing} existing — ✅ complete, skipping`);
    }
  }

  // If no new passages are needed, check if we still need more QUESTIONS from existing passages
  if (passageSpecsNeeded.length === 0) {
    console.log(`\n   ✅ All passages already exist!\n`);

    // Count total passage-based questions for this test mode
    const { data: existingPassageQuestions, error } = await supabase
      .from('questions_v2')
      .select('id')
      .eq('test_type', testType)
      .eq('section_name', sectionName)
      .eq('test_mode', testMode)
      .not('passage_id', 'is', null);

    if (error) {
      console.error(`   ❌ Error checking passage questions:`, error);
    }

    const existingPassageQuestionCount = existingPassageQuestions?.length || 0;
    const targetPassageQuestionCount = passage_based_count;

    if (existingPassageQuestionCount >= targetPassageQuestionCount) {
      console.log(`   ✅ ${existingPassageQuestionCount}/${targetPassageQuestionCount} passage-based questions already exist for ${testMode}. Skipping.\n`);
    } else {
      // Need to generate more questions from existing passages
      const questionsNeeded = targetPassageQuestionCount - existingPassageQuestionCount;
      console.log(`   📝 Need ${questionsNeeded} more passage-based questions for ${testMode}...`);
      console.log(`   Generating questions from existing passages...\n`);

      // Get existing passages for this test mode
      const { data: existingQuestions, error: qError } = await supabase
        .from('questions_v2')
        .select('passage_id')
        .eq('test_type', testType)
        .eq('section_name', sectionName)
        .eq('test_mode', testMode)
        .not('passage_id', 'is', null);

      if (qError) {
        console.error(`   ❌ Error fetching passage links:`, qError);
      }

      const passageIds = [...new Set((existingQuestions || []).map(q => q.passage_id as string))];

      if (passageIds.length === 0) {
        console.log(`   ⚠️  No passages linked to ${testMode}. Cannot generate questions.\n`);
      } else {
        // Fetch the actual passages
        const { data: existingPassages, error: pError } = await supabase
          .from('passages_v2')
          .select('*')
          .in('id', passageIds);

        if (pError) {
          console.error(`   ❌ Error fetching passages:`, pError);
        }

        if (existingPassages && existingPassages.length > 0) {
          // Count questions per passage
          const questionCountsByPassage = new Map<string, number>();
          (existingQuestions || []).forEach(q => {
            const pid = q.passage_id as string;
            questionCountsByPassage.set(pid, (questionCountsByPassage.get(pid) || 0) + 1);
          });

          // Sort passages by question count (fewest first) to distribute evenly
          const passagesSorted = existingPassages.sort((a, b) => {
            const countA = questionCountsByPassage.get(a.id) || 0;
            const countB = questionCountsByPassage.get(b.id) || 0;
            return countA - countB;
          });

          console.log(`   📊 Distributing ${questionsNeeded} questions across ${passagesSorted.length} passages...\n`);

          // Use the primary difficulty from the plan for passages
          const primaryDifficulty = difficultyPlan.distribution.reduce((max, d) =>
            d.count > max.count ? d : max
          ).difficulty;

          // Get the passage-based sub-skill from config
          const passageSubSkill = passage_distribution[0]?.sub_skills?.[0] || passage.sub_skill || 'Passage Comprehension & Inference';

          // Generate questions for each passage until we reach the target
          let generatedCount = 0;
          for (const passage of passagesSorted) {
            if (generatedCount >= questionsNeeded) break;

            const currentCount = questionCountsByPassage.get(passage.id) || 0;
            console.log(`   📝 Generating question for passage: "${passage.title}" (currently has ${currentCount} questions)`);

            try {
              const result = await generateQuestionV2(
                {
                  testType,
                  section: sectionName,
                  subSkill: passageSubSkill,
                  difficulty: primaryDifficulty,
                  testMode,
                  passageId: passage.id,
                  passageText: passage.content
                },
                {
                  skipValidation: false,
                  skipStorage,
                  strictValidation: true
                }
              );

              if (result.success && result.question) {
                passageQuestions.push(result.question);
                totalCost += result.cost;
                generatedCount++;
                console.log(`      ✅ Question ${generatedCount}/${questionsNeeded} generated\n`);
              } else {
                console.log(`      ❌ Failed: ${result.error}\n`);
              }
            } catch (error) {
              console.log(`      ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
            }
          }

          console.log(`   ✅ Generated ${generatedCount} questions from existing passages\n`);
        }
      }
    }
  } else {
    // Generate new passages with questions
    const primaryDifficulty = difficultyPlan.distribution.reduce((max, d) =>
      d.count > max.count ? d : max
    ).difficulty;

    const passageResult = await generateMultiplePassagesWithQuestions({
      testType,
      sectionName,
      passageSpecs: passageSpecsNeeded,
      difficulty: primaryDifficulty,
      testMode,
      skipStorage
    });

    passageQuestions.push(...passageResult.questions);
    passages.push(...passageResult.passages);
    totalCost += passageResult.metadata.total_cost;
  }

  // Step 3: Interleave questions based on strategy
  let finalQuestions: QuestionV2[] = [];

  if (interleaving_strategy === "passages_first") {
    finalQuestions = [...standaloneQuestions, ...passageQuestions];
  }
  else if (interleaving_strategy === "passages_last") {
    finalQuestions = [...passageQuestions, ...standaloneQuestions];
  }
  else if (interleaving_strategy === "mixed") {
    // Interleave questions (simple alternating)
    finalQuestions = interleaveQuestions(standaloneQuestions, passageQuestions);
  }
  else {
    // Default: blocks
    finalQuestions = [...standaloneQuestions, ...passageQuestions];
  }

  console.log(`\n✅ Hybrid section complete:`);
  console.log(`   Standalone: ${standaloneQuestions.length}`);
  console.log(`   Passage-based: ${passageQuestions.length}`);
  console.log(`   Total: ${finalQuestions.length}\n`);

  return {
    questions: finalQuestions,
    passages,
    totalCost,
    subSkillStats
  };
}

// ============================================================================
// HELPER: INTERLEAVE QUESTIONS
// ============================================================================

function interleaveQuestions(standalone: QuestionV2[], passageBased: QuestionV2[]): QuestionV2[] {
  const result: QuestionV2[] = [];
  const maxLength = Math.max(standalone.length, passageBased.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < standalone.length) {
      result.push(standalone[i]);
    }
    if (i < passageBased.length) {
      result.push(passageBased[i]);
    }
  }

  return result;
}

// ============================================================================
// HELPER: Get existing question count for a test mode
// ============================================================================

async function getExistingQuestionCount(
  testType: string,
  sectionName: string,
  testMode: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType)
      .eq('section_name', sectionName)
      .eq('test_mode', testMode);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.warn(`⚠️  Error counting existing questions:`, error);
    return 0;
  }
}

// ============================================================================
// HELPER: Generate questions from existing passages
// ============================================================================

async function generateQuestionsFromExistingPassages(params: {
  testType: string;
  sectionName: string;
  testMode: string;
  targetQuestionCount: number;
  existingQuestionCount: number;
  difficultyPlan: DifficultyDistributionPlan;
  skipStorage: boolean;
}): Promise<{
  questions: QuestionV2[];
  totalCost: number;
  subSkillStats: Record<string, SubSkillStats>;
}> {
  const { testType, sectionName, testMode, targetQuestionCount, existingQuestionCount, difficultyPlan, skipStorage } = params;

  // Get passages that are ALREADY LINKED to this test mode via existing questions
  const { data: existingQuestions, error: qError } = await supabase
    .from('questions_v2')
    .select('passage_id')
    .eq('test_type', testType)
    .eq('section_name', sectionName)
    .eq('test_mode', testMode)
    .not('passage_id', 'is', null);

  if (qError) throw new Error(`Failed to query existing questions: ${qError.message}`);

  const passageIds = [...new Set((existingQuestions || []).map(q => q.passage_id as string))];

  if (passageIds.length === 0) {
    throw new Error(`No passages linked to ${testMode} yet. Need to generate passages first.`);
  }

  // Fetch the full passage data
  const { data: passages, error: pError } = await supabase
    .from('passages_v2')
    .select('*')
    .in('id', passageIds)
    .order('created_at', { ascending: false });

  if (pError || !passages || passages.length === 0) {
    throw new Error(`Failed to fetch passages for ${testMode}: ${pError?.message}`);
  }

  console.log(`   📖 Found ${passages.length} existing passages for ${testMode}\n`);

  // Count how many questions each passage currently has
  const questionCountsByPassage = new Map<string, number>();
  (existingQuestions || []).forEach(q => {
    if (q.passage_id) {
      questionCountsByPassage.set(q.passage_id, (questionCountsByPassage.get(q.passage_id) || 0) + 1);
    }
  });

  const questions: QuestionV2[] = [];
  let totalCost = 0;
  const subSkillStats: Record<string, SubSkillStats> = {};

  const questionsNeeded = targetQuestionCount - existingQuestionCount;
  const targetQuestionsPerPassage = Math.ceil(targetQuestionCount / passages.length);

  console.log(`   🎯 Target: ~${targetQuestionsPerPassage} questions per passage\n`);

  // Sort passages by how many questions they have (fewest first)
  const passagesSortedByQuestionCount = passages.sort((a, b) => {
    const countA = questionCountsByPassage.get(a.id) || 0;
    const countB = questionCountsByPassage.get(b.id) || 0;
    return countA - countB;
  });

  // Generate questions from passages that need more questions
  for (let i = 0; i < passagesSortedByQuestionCount.length && questions.length < questionsNeeded; i++) {
    const passage = passagesSortedByQuestionCount[i];
    const currentQuestionCount = questionCountsByPassage.get(passage.id) || 0;
    const questionsNeededForPassage = Math.max(0, targetQuestionsPerPassage - currentQuestionCount);
    const questionsToGenerate = Math.min(questionsNeededForPassage, questionsNeeded - questions.length);

    if (questionsToGenerate === 0) {
      console.log(`   ✅ Passage ${i + 1}: "${passage.title}" already has ${currentQuestionCount} questions, skipping`);
      continue;
    }

    console.log(`   📄 Passage ${i + 1}/${passages.length}: "${passage.title}" (${passage.word_count} words)`);
    console.log(`      Current: ${currentQuestionCount} questions, Generating: ${questionsToGenerate} more...`);

    // Get the difficulty for these questions from the plan
    const startIndex = existingQuestionCount + questions.length;

    for (let q = 0; q < questionsToGenerate; q++) {
      const questionIndex = startIndex + q;
      const difficulty = difficultyPlan.sequence[questionIndex % difficultyPlan.sequence.length];

      // Get the sub-skill for this passage type (from section config)
      const subSkill = getSubSkillForPassageType(passage.passage_type);

      try {
        const result = await generateQuestionV2(
          {
            testType,
            section: sectionName,
            subSkill,
            difficulty,
            testMode,
            passageId: passage.id
          },
          { skipStorage, crossModeDiversity: true }
        );

        if (result.success && result.question) {
          questions.push(result.question);
          totalCost += result.cost || 0;

          // Update stats
          if (!subSkillStats[subSkill]) {
            subSkillStats[subSkill] = { generated: 0, failed: 0, reattempts: 0 };
          }
          subSkillStats[subSkill].generated++;
          subSkillStats[subSkill].reattempts += (result.attempts || 1) - 1;

          console.log(`      ✅ Q${q + 1}/${questionsToGenerate} generated`);
        } else {
          subSkillStats[subSkill] = subSkillStats[subSkill] || { generated: 0, failed: 0, reattempts: 0 };
          subSkillStats[subSkill].failed++;
          console.log(`      ❌ Q${q + 1}/${questionsToGenerate} failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`      ❌ Error generating question:`, error);
      }
    }
  }

  return { questions, totalCost, subSkillStats };
}

// Helper to map passage type to sub-skill
function getSubSkillForPassageType(passageType: string): string {
  const mapping: Record<string, string> = {
    'narrative': 'Understanding Story Structure',
    'informational': 'Identifying Main Ideas',
    'poetry': 'Poetry Analysis',
    'visual': 'Visual Text Interpretation'
  };
  return mapping[passageType] || 'Identifying Main Ideas';
}

// ============================================================================
// WRITING PROMPT STRATEGY
// ============================================================================

async function generateWritingPromptSection(params: {
  testType: string;
  sectionName: string;
  config: WritingBlueprint;
  difficultyPlan: DifficultyPlan;
  testMode: string;
  skipStorage: boolean;
  crossModeDiversity: boolean;
}): Promise<{
  questions: QuestionV2[];
  totalCost: number;
  subSkillStats: Record<string, SubSkillStats>;
}> {
  const { testType, sectionName, config, difficultyPlan, testMode, skipStorage, crossModeDiversity } = params;

  console.log(`\n📝 Generating Writing Prompt Section:`);
  console.log(`   Total Prompts: ${config.total_prompts}`);
  console.log(`   Prompt Types: ${config.prompt_types.join(', ')}`);
  console.log(`   Allow Choice: ${config.allow_choice ? 'Yes' : 'No'}`);
  console.log('');

  const questions: QuestionV2[] = [];
  let totalCost = 0;
  const subSkillStats: Record<string, SubSkillStats> = {};

  // Get primary difficulty (usually 2 for writing prompts)
  const primaryDifficulty = difficultyPlan.distribution.reduce((max, d) =>
    d.count > max.count ? d : max
  ).difficulty;

  // Generate prompt(s)
  for (let i = 0; i < config.total_prompts; i++) {
    // Rotate through prompt types
    const subSkill = config.prompt_types[i % config.prompt_types.length];

    console.log(`   📄 Generating writing prompt ${i + 1}/${config.total_prompts}: ${subSkill}...`);

    try {
      const result = await generateQuestionV2(
        {
          testType,
          section: sectionName,
          subSkill,
          difficulty: primaryDifficulty,
          testMode,
          questionOrder: i + 1
        },
        {
          skipValidation: false,
          skipStorage,
          strictValidation: false, // Less strict for extended response
          crossModeDiversity
        }
      );

      if (result.success && result.question) {
        questions.push(result.question);
        totalCost += result.cost;

        // Track stats
        if (!subSkillStats[subSkill]) {
          subSkillStats[subSkill] = { generated: 0, failed: 0, reattempts: 0 };
        }
        subSkillStats[subSkill].generated++;

        console.log(`      ✅ Writing prompt generated (${result.validationResult?.qualityScore || 'N/A'}/100 quality)`);
      } else {
        console.log(`      ❌ Failed: ${result.error}`);
        if (!subSkillStats[subSkill]) {
          subSkillStats[subSkill] = { generated: 0, failed: 0, reattempts: 0 };
        }
        subSkillStats[subSkill].failed++;
      }
    } catch (error) {
      console.log(`      ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      if (!subSkillStats[subSkill]) {
        subSkillStats[subSkill] = { generated: 0, failed: 0, reattempts: 0 };
      }
      subSkillStats[subSkill].failed++;
    }
  }

  console.log(`\n✅ Writing prompt section complete: ${questions.length}/${config.total_prompts} generated\n`);

  return {
    questions,
    totalCost,
    subSkillStats
  };
}
