/**
 * Drill Generator for Section - V2 Engine
 *
 * Generates skill drills for ALL sub-skills in a section with difficulty-based distribution.
 *
 * This script complements the section-first generation approach by generating
 * focused practice drills after the main practice tests and diagnostic are complete.
 *
 * DIFFICULTY RULES:
 *   - 3-level tests (ACER, EduTest, NSW, VIC): 10 questions per difficulty (1, 2, 3) = 30 total per sub-skill
 *   - 6-level tests (NAPLAN Year 5, Year 7): 5 questions per difficulty (1-6) = 30 total per sub-skill
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
 *     --test="EduTest Scholarship (Year 7 Entry)" \
 *     --section="Verbal Reasoning"
 *
 * Examples:
 *   # Generate drills for EduTest Verbal Reasoning (10 questions × 3 difficulties = 30 per sub-skill)
 *   npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
 *     --test="EduTest Scholarship (Year 7 Entry)" \
 *     --section="Verbal Reasoning"
 *
 *   # Generate drills for ACER Humanities (10 questions × 3 difficulties = 30 per sub-skill)
 *   npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
 *     --test="ACER Scholarship (Year 7 Entry)" \
 *     --section="Humanities"
 *
 *   # Generate drills for Year 5 NAPLAN Reading (5 questions × 6 difficulties = 30 per sub-skill)
 *   npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
 *     --test="Year 5 NAPLAN" \
 *     --section="Reading"
 */

// IMPORTANT: Load environment variables BEFORE any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import { generateQuestionV2 } from '@/engines/questionGeneration/v2';
import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';
import { getExistingQuestionsForSubSkill } from '@/engines/questionGeneration/v2/gapDetection';

// ============================================================================
// COMMAND LINE ARGUMENTS
// ============================================================================

function parseArguments(): { testType: string; sectionName: string } {
  const args = process.argv.slice(2);
  let testType = '';
  let sectionName = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--test=')) {
      testType = args[i].split('=')[1];
    } else if (args[i].startsWith('--section=')) {
      sectionName = args[i].split('=')[1];
    }
  }

  return { testType, sectionName };
}

// ============================================================================
// DIFFICULTY CONFIGURATION
// ============================================================================

/**
 * Determines difficulty configuration based on test type
 * - 3-level tests: 10 questions × 3 difficulties = 30 per sub-skill
 * - 6-level tests: 5 questions × 6 difficulties = 30 per sub-skill
 */
function getDifficultyConfig(testType: string): {
  difficultyLevels: number[];
  questionsPerLevel: number;
  totalPerSubSkill: number;
} {
  const naplanTests = ['Year 5 NAPLAN', 'Year 7 NAPLAN'];

  if (naplanTests.includes(testType)) {
    // NAPLAN tests use 6 difficulty levels
    return {
      difficultyLevels: [1, 2, 3, 4, 5, 6],
      questionsPerLevel: 5,
      totalPerSubSkill: 30
    };
  } else {
    // All other tests (ACER, EduTest, NSW, VIC) use 3 difficulty levels
    return {
      difficultyLevels: [1, 2, 3],
      questionsPerLevel: 10,
      totalPerSubSkill: 30
    };
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateInputs(testType: string, sectionName: string) {
  if (!testType) {
    throw new Error('Test type not specified. Use --test="<TEST_TYPE>"');
  }

  if (!sectionName) {
    throw new Error('Section name not specified. Use --section="<SECTION_NAME>"');
  }

  const configKey = `${testType} - ${sectionName}`;
  if (!SECTION_CONFIGURATIONS[configKey]) {
    throw new Error(`No configuration found for: ${configKey}`);
  }
}

// ============================================================================
// DRILL GENERATION FUNCTION
// ============================================================================

async function generateDrillsForSection(
  testType: string,
  sectionName: string
) {
  // Get difficulty configuration for this test type
  const difficultyConfig = getDifficultyConfig(testType);

  console.log('');
  console.log('━'.repeat(80));
  console.log('🎯 DRILL GENERATOR - V2 ENGINE');
  console.log('━'.repeat(80));
  console.log('');
  console.log(`Test Type: ${testType}`);
  console.log(`Section: ${sectionName}`);
  console.log('');
  console.log('📊 DIFFICULTY CONFIGURATION:');
  console.log(`   Difficulty Levels: ${difficultyConfig.difficultyLevels.join(', ')}`);
  console.log(`   Questions per Level: ${difficultyConfig.questionsPerLevel}`);
  console.log(`   Total per Sub-Skill: ${difficultyConfig.totalPerSubSkill}`);
  console.log('');
  console.log('📊 STRATEGY: Generate skill drills by difficulty level');
  console.log('   ✅ Loads context from practice tests + diagnostic');
  console.log('   ✅ Separate questions for each difficulty level');
  console.log('   ✅ Ensures no repetition across entire question bank');
  console.log('');

  // Load section configuration
  const configKey = `${testType} - ${sectionName}`;
  const sectionConfig = SECTION_CONFIGURATIONS[configKey];

  // Extract sub-skills from configuration
  let subSkills: string[] = [];

  if (sectionConfig.section_structure.generation_strategy === 'balanced') {
    subSkills = sectionConfig.section_structure.balanced_distribution!.sub_skills;
  } else if (sectionConfig.section_structure.generation_strategy === 'hybrid') {
    const hybrid = sectionConfig.section_structure.hybrid_blueprint!;

    // Get sub-skills from standalone distribution
    hybrid.standalone_distribution.forEach(item => {
      if (!subSkills.includes(item.sub_skill)) {
        subSkills.push(item.sub_skill);
      }
    });

    // Get sub-skills from passage distribution
    hybrid.passage_distribution.forEach(item => {
      item.sub_skills.forEach(skill => {
        if (!subSkills.includes(skill)) {
          subSkills.push(skill);
        }
      });
    });
  } else if (sectionConfig.section_structure.generation_strategy === 'passage_based') {
    const passages = sectionConfig.section_structure.passage_blueprint!;

    passages.passage_distribution.forEach(item => {
      item.sub_skills.forEach(skill => {
        if (!subSkills.includes(skill)) {
          subSkills.push(skill);
        }
      });
    });
  }

  console.log(`📋 Section Configuration:`);
  console.log(`   Sub-skills: ${subSkills.length}`);
  console.log(`   Total questions per sub-skill: ${difficultyConfig.totalPerSubSkill}`);
  console.log(`   Total questions to generate: ${subSkills.length * difficultyConfig.totalPerSubSkill}`);
  console.log('');
  console.log('━'.repeat(80));
  console.log('');

  // Step 1: Detect gaps for each sub-skill by difficulty level
  console.log('🔍 Step 1: Detecting gaps for each sub-skill by difficulty level...');
  console.log('');

  const gapReport: Array<{
    subSkill: string;
    difficultyGaps: Map<number, { existing: number; target: number; needed: number }>;
    totalExisting: number;
    totalTarget: number;
    totalNeeded: number;
  }> = [];

  for (const subSkill of subSkills) {
    // Load all existing questions for this sub-skill
    const existingQuestions = await getExistingQuestionsForSubSkill(
      testType,
      sectionName,
      subSkill,
      null  // Load from ALL modes
    );

    // Count questions by difficulty level (only drill mode)
    const drillQuestions = existingQuestions.filter(q => q.test_mode === 'drill');
    const difficultyGaps = new Map<number, { existing: number; target: number; needed: number }>();

    for (const difficulty of difficultyConfig.difficultyLevels) {
      const existing = drillQuestions.filter(q => q.difficulty === difficulty).length;
      const target = difficultyConfig.questionsPerLevel;
      const needed = Math.max(0, target - existing);

      difficultyGaps.set(difficulty, { existing, target, needed });
    }

    const totalExisting = Array.from(difficultyGaps.values()).reduce((sum, d) => sum + d.existing, 0);
    const totalTarget = difficultyConfig.totalPerSubSkill;
    const totalNeeded = Array.from(difficultyGaps.values()).reduce((sum, d) => sum + d.needed, 0);

    gapReport.push({
      subSkill,
      difficultyGaps,
      totalExisting,
      totalTarget,
      totalNeeded
    });

    const status = totalNeeded === 0 ? '✅' : totalNeeded < totalTarget / 2 ? '🟡' : '🔴';
    console.log(`   ${status} ${subSkill}: ${totalExisting}/${totalTarget} questions`);

    // Show breakdown by difficulty
    for (const difficulty of difficultyConfig.difficultyLevels) {
      const gap = difficultyGaps.get(difficulty)!;
      const diffStatus = gap.needed === 0 ? '✓' : gap.needed < gap.target / 2 ? '○' : '×';
      console.log(`      ${diffStatus} Difficulty ${difficulty}: ${gap.existing}/${gap.target} (need ${gap.needed})`);
    }
  }

  console.log('');

  const totalTarget = gapReport.reduce((sum, r) => sum + r.totalTarget, 0);
  const totalExisting = gapReport.reduce((sum, r) => sum + r.totalExisting, 0);
  const totalGaps = gapReport.reduce((sum, r) => sum + r.totalNeeded, 0);

  console.log('📊 OVERALL SUMMARY:');
  console.log(`   Total Target: ${totalTarget} questions`);
  console.log(`   Total Existing: ${totalExisting} questions`);
  console.log(`   Total Gaps: ${totalGaps} questions`);
  console.log(`   Completion: ${((totalExisting / totalTarget) * 100).toFixed(1)}%`);
  console.log('');

  if (totalGaps === 0) {
    console.log('✅ All drill questions already generated! Nothing to do.');
    console.log('');
    return {
      success: true,
      message: 'All drills complete',
      questionsGenerated: 0
    };
  }

  console.log('━'.repeat(80));
  console.log('');

  // Step 2: Generate missing questions by difficulty level
  console.log('📝 Step 2: Generating missing questions by difficulty level (with cross-mode diversity)...');
  console.log('');

  const startTime = Date.now();
  const results: any[] = [];
  let totalGenerated = 0;
  let totalCost = 0;

  for (let i = 0; i < gapReport.length; i++) {
    const { subSkill, difficultyGaps, totalNeeded, totalTarget } = gapReport[i];

    if (totalNeeded === 0) {
      console.log(`━`.repeat(80));
      console.log(`📝 SUB-SKILL ${i + 1}/${gapReport.length}: ${subSkill}`);
      console.log(`━`.repeat(80));
      console.log(`   ✅ Already complete! (${totalTarget}/${totalTarget} questions)`);
      console.log('');

      results.push({
        subSkill,
        questionsGenerated: 0,
        alreadyComplete: true
      });

      continue;
    }

    console.log(`━`.repeat(80));
    console.log(`📝 SUB-SKILL ${i + 1}/${gapReport.length}: ${subSkill}`);
    console.log(`━`.repeat(80));
    console.log(`   Target: ${totalTarget} questions`);
    console.log(`   Gaps to fill: ${totalNeeded} questions`);
    console.log('');
    console.log(`   🔀 Cross-mode diversity: Loading questions from practice tests + diagnostic`);
    console.log('');

    let questionsGenerated = 0;
    let subSkillCost = 0;

    // Generate questions for each difficulty level
    for (const difficulty of difficultyConfig.difficultyLevels) {
      const gap = difficultyGaps.get(difficulty)!;

      if (gap.needed === 0) {
        console.log(`   ✅ Difficulty ${difficulty}: Already complete (${gap.existing}/${gap.target})`);
        continue;
      }

      console.log(`   🎯 Difficulty ${difficulty}: Generating ${gap.needed} questions (${gap.existing}/${gap.target} exist)...`);

      let difficultyQuestions = 0;
      let difficultyCost = 0;

      // Generate each missing question for this difficulty
      for (let q = 0; q < gap.needed; q++) {
        try {
          const result = await generateQuestionV2(
            {
              testType,
              section: sectionName,
              subSkill,
              difficulty,
              testMode: 'drill'  // All drill questions use 'drill' mode
            },
            {
              skipValidation: false,
              skipStorage: false,
              strictValidation: true,
              crossModeDiversity: true  // ⭐ KEY: Enable cross-mode diversity
            }
          );

          if (result.success) {
            difficultyQuestions++;
            questionsGenerated++;
            difficultyCost += result.metadata.generation_cost;
          } else {
            console.log(`      ⚠️  Question ${q + 1} failed: ${result.error}`);
          }
        } catch (error: any) {
          console.log(`      ⚠️  Question ${q + 1} error: ${error.message}`);
        }
      }

      subSkillCost += difficultyCost;
      const status = difficultyQuestions === gap.needed ? '✅' : difficultyQuestions > 0 ? '🟡' : '❌';
      console.log(`      ${status} Generated ${difficultyQuestions}/${gap.needed} questions ($${difficultyCost.toFixed(4)})`);
    }

    totalGenerated += questionsGenerated;
    totalCost += subSkillCost;

    console.log('');
    console.log(`   📊 Sub-skill Complete:`);
    console.log(`      Questions Generated: ${questionsGenerated}/${totalNeeded}`);
    console.log(`      Cost: $${subSkillCost.toFixed(4)}`);
    console.log('');

    results.push({
      subSkill,
      questionsGenerated,
      cost: subSkillCost,
      success: questionsGenerated > 0
    });
  }

  const totalTime = Date.now() - startTime;

  // Final Summary
  console.log('');
  console.log('━'.repeat(80));
  console.log('🎉 DRILL GENERATION COMPLETE');
  console.log('━'.repeat(80));
  console.log('');
  console.log('📊 Final Statistics:');
  console.log('');
  console.log('   By Sub-Skill:');
  results.forEach(r => {
    const status = r.success ? '✅' : r.alreadyComplete ? '✓' : '❌';
    const msg = r.alreadyComplete
      ? 'already complete'
      : r.success
      ? `${r.questionsGenerated} questions`
      : 'failed';
    console.log(`   ${status} ${r.subSkill}: ${msg}`);
  });
  console.log('');
  console.log('   Overall Totals:');
  console.log(`   📝 Questions Generated: ${totalGenerated}`);
  console.log(`   💰 Total Cost: $${totalCost.toFixed(2)}`);
  console.log(`   ⏱️  Total Time: ${Math.round(totalTime / 1000 / 60)}m ${Math.round((totalTime / 1000) % 60)}s`);
  console.log('');

  if (totalGenerated > 0) {
    const avgCost = totalCost / totalGenerated;
    const avgTime = (totalTime / 1000) / totalGenerated;
    console.log('   📈 Averages:');
    console.log(`   💵 Cost per question: $${avgCost.toFixed(4)}`);
    console.log(`   ⏰ Time per question: ${avgTime.toFixed(1)}s`);
    console.log('');
  }

  console.log('━'.repeat(80));
  console.log('📋 Next Steps:');
  console.log('');
  console.log('   1. Review drill questions in database: questions_v2 table');
  console.log('   2. Test drills in the application (each difficulty level)');
  console.log('   3. Generate drills for next section (if needed)');
  console.log('');
  console.log('   Database Query:');
  console.log(`   SELECT difficulty, sub_skill, COUNT(*) as count`);
  console.log(`   FROM questions_v2`);
  console.log(`   WHERE test_type = '${testType}'`);
  console.log(`   AND section_name = '${sectionName}'`);
  console.log(`   AND test_mode = 'drill'`);
  console.log(`   GROUP BY difficulty, sub_skill`);
  console.log(`   ORDER BY sub_skill, difficulty;`);
  console.log('');
  console.log('━'.repeat(80));
  console.log('');

  return {
    success: true,
    questionsGenerated: totalGenerated,
    totalCost,
    totalTime
  };
}

// ============================================================================
// RUN GENERATOR
// ============================================================================

const { testType, sectionName } = parseArguments();

if (!testType || !sectionName) {
  console.error('');
  console.error('❌ Error: Missing required arguments');
  console.error('');
  console.error('Usage:');
  console.error('  npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \\\\');
  console.error('    --test="<TEST_TYPE>" \\\\');
  console.error('    --section="<SECTION_NAME>"');
  console.error('');
  console.error('Difficulty Configuration (automatic):');
  console.error('  • 3-level tests (ACER, EduTest, NSW, VIC): 10 questions × 3 difficulties = 30 per sub-skill');
  console.error('  • 6-level tests (NAPLAN Year 5, Year 7): 5 questions × 6 difficulties = 30 per sub-skill');
  console.error('');
  console.error('Examples:');
  console.error('  # Generate drills for EduTest Verbal Reasoning');
  console.error('  npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \\\\');
  console.error('    --test="EduTest Scholarship (Year 7 Entry)" \\\\');
  console.error('    --section="Verbal Reasoning"');
  console.error('');
  console.error('  # Generate drills for ACER Humanities');
  console.error('  npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \\\\');
  console.error('    --test="ACER Scholarship (Year 7 Entry)" \\\\');
  console.error('    --section="Humanities"');
  console.error('');
  console.error('  # Generate drills for Year 5 NAPLAN Reading');
  console.error('  npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \\\\');
  console.error('    --test="Year 5 NAPLAN" \\\\');
  console.error('    --section="Reading"');
  console.error('');
  process.exit(1);
}

try {
  validateInputs(testType, sectionName);
} catch (error: any) {
  console.error('');
  console.error('❌ Validation Error:', error.message);
  console.error('');
  process.exit(1);
}

console.log('');
console.log('🚀 Starting Drill Generation...');

generateDrillsForSection(testType, sectionName)
  .then((result) => {
    if (result.success) {
      if (result.questionsGenerated === 0) {
        console.log('\n✅ SUCCESS! All drill questions already complete.\n');
      } else {
        console.log(`\n✅ SUCCESS! Generated ${result.questionsGenerated} questions.\n`);
      }
      process.exit(0);
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some questions may have failed.\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 FATAL ERROR:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  });
