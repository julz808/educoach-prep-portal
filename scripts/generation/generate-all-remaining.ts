/**
 * Generate ALL Remaining Questions - V2 Engine
 *
 * This script generates ALL missing questions for ALL test types and ALL sections.
 * It loops through every test type, every section, and generates all modes (practice + diagnostic).
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts
 *
 * Optional flags:
 *   --test="<TEST_TYPE>"    # Only generate for specific test type
 *   --section="<SECTION>"   # Only generate for specific section
 *   --skip-drills           # Skip drill generation after completing sections
 *
 * Examples:
 *   # Generate everything
 *   npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts
 *
 *   # Generate only Year 7 NAPLAN
 *   npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts --test="Year 7 NAPLAN"
 *
 *   # Generate only Year 7 NAPLAN Reading
 *   npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts \
 *     --test="Year 7 NAPLAN" --section="Reading"
 */

// IMPORTANT: Load environment variables BEFORE any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import { generateSectionV2 } from '@/engines/questionGeneration/v2';
import { generateTestGapReport } from '@/engines/questionGeneration/v2/gapDetection';
import { TEST_STRUCTURES } from '@/data/curriculumData_v2/types';
import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';

// ============================================================================
// CONFIGURATION
// ============================================================================

const ALL_TEST_TYPES = Object.keys(TEST_STRUCTURES);

// Default modes for each section (5 practice tests + 1 diagnostic)
const DEFAULT_MODES = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];

// ============================================================================
// COMMAND LINE ARGUMENTS
// ============================================================================

function parseArguments(): {
  specificTest?: string;
  specificSection?: string;
  skipDrills: boolean;
} {
  const args = process.argv.slice(2);
  let specificTest: string | undefined;
  let specificSection: string | undefined;
  let skipDrills = false;

  for (const arg of args) {
    if (arg.startsWith('--test=')) {
      specificTest = arg.split('=')[1];
    } else if (arg.startsWith('--section=')) {
      specificSection = arg.split('=')[1];
    } else if (arg === '--skip-drills') {
      skipDrills = true;
    }
  }

  return { specificTest, specificSection, skipDrills };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTargetDistributionForMode(
  configKey: string,
  mode: string,
  modeIndex: number
): { [subSkill: string]: number } {
  const sectionConfig = SECTION_CONFIGURATIONS[configKey];
  if (!sectionConfig) return {};

  const targetDistribution: { [subSkill: string]: number } = {};

  if (sectionConfig.section_structure.generation_strategy === 'balanced') {
    const dist = sectionConfig.section_structure.balanced_distribution!;
    const questionsPerSkill = Math.floor(dist.total_questions / dist.sub_skills.length);
    const remainder = dist.total_questions % dist.sub_skills.length;

    dist.sub_skills.forEach((skill, index) => {
      targetDistribution[skill] = questionsPerSkill + (index < remainder ? 1 : 0);
    });
  } else if (sectionConfig.section_structure.generation_strategy === 'hybrid') {
    const hybrid = sectionConfig.section_structure.hybrid_blueprint!;

    hybrid.standalone_distribution.forEach(item => {
      targetDistribution[item.sub_skill] = item.count;
    });

    hybrid.passage_distribution.forEach(item => {
      const questionsPerPassage = Array.isArray(item.questions_per_passage)
        ? Math.floor((item.questions_per_passage[0] + item.questions_per_passage[1]) / 2)
        : item.questions_per_passage;

      const totalQuestionsForThisPassageType = item.count * questionsPerPassage;
      const numSubSkills = item.sub_skills.length;

      item.sub_skills.forEach((skill, index) => {
        const baseCount = Math.floor(totalQuestionsForThisPassageType / numSubSkills);
        const remainder = totalQuestionsForThisPassageType % numSubSkills;
        const skillCount = baseCount + (index < remainder ? 1 : 0);

        targetDistribution[skill] = (targetDistribution[skill] || 0) + skillCount;
      });
    });
  } else if (sectionConfig.section_structure.generation_strategy === 'passage_based') {
    const passages = sectionConfig.section_structure.passage_blueprint!;

    passages.passage_distribution.forEach(item => {
      const questionsPerPassage = Array.isArray(item.questions_per_passage)
        ? Math.floor((item.questions_per_passage[0] + item.questions_per_passage[1]) / 2)
        : item.questions_per_passage;

      const totalQuestionsForThisPassageType = item.count * questionsPerPassage;
      const numSubSkills = item.sub_skills.length;

      item.sub_skills.forEach((skill, index) => {
        const baseCount = Math.floor(totalQuestionsForThisPassageType / numSubSkills);
        const remainder = totalQuestionsForThisPassageType % numSubSkills;
        const skillCount = baseCount + (index < remainder ? 1 : 0);

        targetDistribution[skill] = (targetDistribution[skill] || 0) + skillCount;
      });
    });
  } else if (sectionConfig.section_structure.generation_strategy === 'writing_prompt') {
    const writing = sectionConfig.section_structure.writing_blueprint!;

    if (writing.allow_choice) {
      writing.prompt_types.forEach(promptType => {
        targetDistribution[promptType] = 1;
      });
    } else {
      const typeIndex = modeIndex % writing.prompt_types.length;
      const promptType = writing.prompt_types[typeIndex];
      targetDistribution[promptType] = 1;
    }
  }

  return targetDistribution;
}

// ============================================================================
// SECTION GENERATION
// ============================================================================

async function generateSection(
  testType: string,
  sectionName: string,
  modes: string[]
): Promise<{
  success: boolean;
  questionsGenerated: number;
  totalCost: number;
  totalTime: number;
  gapsRemaining: number;
}> {
  console.log('');
  console.log('  ┌─' + '─'.repeat(76) + '─┐');
  console.log(`  │ 📂 ${testType} - ${sectionName}`.padEnd(78) + '│');
  console.log('  └─' + '─'.repeat(76) + '─┘');
  console.log('');

  const configKey = `${testType} - ${sectionName}`;
  const sectionConfig = SECTION_CONFIGURATIONS[configKey];

  if (!sectionConfig) {
    console.log(`  ⚠️  No configuration found for: ${configKey}`);
    console.log(`  ⏭️  Skipping...`);
    return { success: false, questionsGenerated: 0, totalCost: 0, totalTime: 0, gapsRemaining: 0 };
  }

  // Check gaps for all modes
  const allGapReports = [];
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const targetDistribution = getTargetDistributionForMode(configKey, mode, i);

    const gapReport = await generateTestGapReport(
      testType,
      mode,
      [{ sectionName, targetDistribution }]
    );

    allGapReports.push({ mode, report: gapReport });
  }

  const totalTarget = allGapReports.reduce((sum, r) => sum + r.report.totalQuestionsTarget, 0);
  const totalExisting = allGapReports.reduce((sum, r) => sum + r.report.totalQuestionsExisting, 0);
  const totalGaps = allGapReports.reduce((sum, r) => sum + r.report.totalQuestionsNeeded, 0);

  console.log(`  📊 Status: ${totalExisting}/${totalTarget} questions (${((totalExisting / totalTarget) * 100).toFixed(1)}%)`);

  if (totalGaps === 0) {
    console.log(`  ✅ Already complete! Skipping...`);
    return { success: true, questionsGenerated: 0, totalCost: 0, totalTime: 0, gapsRemaining: 0 };
  }

  console.log(`  🎯 Generating ${totalGaps} missing questions...`);
  console.log('');

  const startTime = Date.now();
  let totalGenerated = 0;
  let totalCost = 0;

  // Generate for each mode
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const gapData = allGapReports.find(r => r.mode === mode);

    if (!gapData || gapData.report.sections[0].totalGaps === 0) {
      console.log(`    ✓ ${mode}: Already complete`);
      continue;
    }

    console.log(`    ⚙️  ${mode}: Generating ${gapData.report.sections[0].totalGaps} questions...`);

    try {
      const result = await generateSectionV2({
        testType,
        sectionName,
        testMode: mode,
        difficultyStrategy: { type: 'balanced', difficulties: [1, 2, 3] },
        skipStorage: false,
        crossModeDiversity: true
      });

      if (result.success) {
        console.log(`    ✅ ${mode}: Generated ${result.metadata.total_questions_generated} questions ($${result.metadata.total_cost.toFixed(4)})`);
        totalGenerated += result.metadata.total_questions_generated;
        totalCost += result.metadata.total_cost;
      } else {
        console.log(`    ❌ ${mode}: Failed - ${result.error}`);
      }
    } catch (error: any) {
      console.log(`    ❌ ${mode}: Error - ${error.message}`);
    }
  }

  const totalTime = Date.now() - startTime;

  // Post-generation gap check
  const postGapReports = [];
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const targetDistribution = getTargetDistributionForMode(configKey, mode, i);

    const gapReport = await generateTestGapReport(
      testType,
      mode,
      [{ sectionName, targetDistribution }]
    );

    postGapReports.push({
      mode,
      gaps: gapReport.totalQuestionsNeeded
    });
  }

  const gapsRemaining = postGapReports.reduce((sum, r) => sum + r.gaps, 0);

  console.log('');
  console.log(`  📊 Section Summary:`);
  console.log(`     Generated: ${totalGenerated} questions`);
  console.log(`     Cost: $${totalCost.toFixed(4)}`);
  console.log(`     Time: ${Math.round(totalTime / 1000)}s`);
  console.log(`     Remaining gaps: ${gapsRemaining}`);

  return {
    success: true,
    questionsGenerated: totalGenerated,
    totalCost,
    totalTime,
    gapsRemaining
  };
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

async function generateAllRemaining() {
  const { specificTest, specificSection, skipDrills } = parseArguments();

  console.log('');
  console.log('━'.repeat(80));
  console.log('🚀 GENERATE ALL REMAINING QUESTIONS - V2 ENGINE');
  console.log('━'.repeat(80));
  console.log('');

  if (specificTest) {
    console.log(`🎯 Target: ${specificTest}${specificSection ? ` - ${specificSection}` : ''}`);
  } else {
    console.log(`🎯 Target: ALL test types and sections`);
  }
  console.log('');

  // Determine which test types to process
  const testTypesToProcess = specificTest
    ? [specificTest]
    : ALL_TEST_TYPES;

  const overallResults: Array<{
    testType: string;
    sectionName: string;
    questionsGenerated: number;
    cost: number;
    time: number;
    gapsRemaining: number;
  }> = [];

  const overallStartTime = Date.now();

  // Process each test type
  for (const testType of testTypesToProcess) {
    console.log('');
    console.log('═'.repeat(80));
    console.log(`📚 ${testType}`);
    console.log('═'.repeat(80));

    const sections = Object.keys(TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES] || {});

    // Determine which sections to process
    const sectionsToProcess = specificSection
      ? sections.filter(s => s === specificSection)
      : sections;

    if (sectionsToProcess.length === 0) {
      console.log(`⚠️  No matching sections found. Skipping...`);
      continue;
    }

    // Process each section
    for (const sectionName of sectionsToProcess) {
      const result = await generateSection(testType, sectionName, DEFAULT_MODES);

      overallResults.push({
        testType,
        sectionName,
        questionsGenerated: result.questionsGenerated,
        cost: result.totalCost,
        time: result.totalTime,
        gapsRemaining: result.gapsRemaining
      });
    }
  }

  const overallTotalTime = Date.now() - overallStartTime;

  // Final Summary
  console.log('');
  console.log('');
  console.log('━'.repeat(80));
  console.log('🎉 ALL GENERATION COMPLETE');
  console.log('━'.repeat(80));
  console.log('');

  const totalGenerated = overallResults.reduce((sum, r) => sum + r.questionsGenerated, 0);
  const totalCost = overallResults.reduce((sum, r) => sum + r.cost, 0);
  const totalGapsRemaining = overallResults.reduce((sum, r) => sum + r.gapsRemaining, 0);
  const completeSections = overallResults.filter(r => r.gapsRemaining === 0).length;
  const incompleteSections = overallResults.filter(r => r.gapsRemaining > 0).length;

  console.log('📊 Overall Summary:');
  console.log('');
  console.log(`   Sections Processed: ${overallResults.length}`);
  console.log(`   ✅ Complete: ${completeSections}`);
  console.log(`   ⚠️  Incomplete: ${incompleteSections}`);
  console.log('');
  console.log(`   📝 Total Questions Generated: ${totalGenerated}`);
  console.log(`   💰 Total Cost: $${totalCost.toFixed(2)}`);
  console.log(`   ⏱️  Total Time: ${Math.round(overallTotalTime / 1000 / 60)}m ${Math.round((overallTotalTime / 1000) % 60)}s`);
  console.log('');

  if (totalGenerated > 0) {
    console.log('   📈 Averages:');
    console.log(`   💵 Cost per question: $${(totalCost / totalGenerated).toFixed(4)}`);
    console.log(`   ⏰ Time per question: ${((overallTotalTime / 1000) / totalGenerated).toFixed(1)}s`);
    console.log('');
  }

  // Show incomplete sections
  if (incompleteSections > 0) {
    console.log('');
    console.log('⚠️  Sections Still Needing Questions:');
    console.log('');
    overallResults
      .filter(r => r.gapsRemaining > 0)
      .forEach(r => {
        console.log(`   • ${r.testType} - ${r.sectionName}: ${r.gapsRemaining} gaps remaining`);
      });
    console.log('');
  }

  // Show complete sections
  if (completeSections > 0) {
    console.log('');
    console.log('✅ Complete Sections:');
    console.log('');
    overallResults
      .filter(r => r.gapsRemaining === 0)
      .forEach(r => {
        console.log(`   • ${r.testType} - ${r.sectionName}`);
      });
    console.log('');
  }

  console.log('━'.repeat(80));
  console.log('');

  if (totalGapsRemaining > 0) {
    console.log('📋 Next Steps:');
    console.log('');
    console.log(`   1. Re-run this script to fill remaining ${totalGapsRemaining} gaps`);
    console.log(`   2. Or generate specific sections with:`);
    console.log(`      npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \\`);
    console.log(`        --test="<TEST_TYPE>" \\`);
    console.log(`        --section="<SECTION_NAME>" \\`);
    console.log(`        --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"`);
    console.log('');
  } else {
    console.log('🎉 All sections complete!');
    console.log('');
    if (!skipDrills) {
      console.log('📋 Next Steps:');
      console.log('');
      console.log('   Generate drills for all sections:');
      console.log(`      npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \\`);
      console.log(`        --test="<TEST_TYPE>" \\`);
      console.log(`        --section="<SECTION_NAME>" \\`);
      console.log(`        --drills-per-subskill=20`);
      console.log('');
    }
  }

  console.log('━'.repeat(80));
  console.log('');
}

// ============================================================================
// RUN GENERATOR
// ============================================================================

console.log('');
console.log('🚀 Starting comprehensive question generation...');

generateAllRemaining()
  .then(() => {
    console.log('\n✅ Process complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 FATAL ERROR:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  });
