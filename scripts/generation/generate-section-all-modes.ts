/**
 * Section-First Universal Generator - V2 Engine
 *
 * Generates ALL test modes for a SINGLE section with cross-mode diversity checking.
 *
 * This is the recommended approach for generating questions as it ensures:
 * - Maximum diversity across all test modes
 * - Consistent quality within a section
 * - Efficient batch generation
 * - Better variety tracking across entire question bank
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
 *     --test="EduTest Scholarship (Year 7 Entry)" \
 *     --section="Verbal Reasoning" \
 *     --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
 *
 * Examples:
 *   # Generate all EduTest Verbal Reasoning (5 practice + 1 diagnostic)
 *   npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
 *     --test="EduTest Scholarship (Year 7 Entry)" \
 *     --section="Verbal Reasoning" \
 *     --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
 *
 *   # Generate all ACER Humanities (5 practice + 1 diagnostic)
 *   npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
 *     --test="ACER Scholarship (Year 7 Entry)" \
 *     --section="Humanities" \
 *     --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
 */

// IMPORTANT: Load environment variables BEFORE any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { generateSectionV2 } from '@/engines/questionGeneration/v2';
import { generateTestGapReport, printGapReport } from '@/engines/questionGeneration/v2/gapDetection';
import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';
import type { SubSkillStats } from '@/engines/questionGeneration/v2/sectionGenerator';

// ============================================================================
// COMMAND LINE ARGUMENTS
// ============================================================================

function parseArguments(): { testType: string; sectionName: string; modes: string[] } {
  const args = process.argv.slice(2);
  let testType = '';
  let sectionName = '';
  let modes: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--test=')) {
      testType = args[i].split('=')[1];
    } else if (args[i].startsWith('--section=')) {
      sectionName = args[i].split('=')[1];
    } else if (args[i].startsWith('--modes=')) {
      modes = args[i].split('=')[1].split(',').map(m => m.trim());
    }
  }

  return { testType, sectionName, modes };
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateInputs(testType: string, sectionName: string, modes: string[]) {
  if (!testType) {
    throw new Error('Test type not specified. Use --test="<TEST_TYPE>"');
  }

  if (!sectionName) {
    throw new Error('Section name not specified. Use --section="<SECTION_NAME>"');
  }

  if (modes.length === 0) {
    throw new Error('No modes specified. Use --modes="practice_1,practice_2,..."');
  }

  const configKey = `${testType} - ${sectionName}`;
  if (!SECTION_CONFIGURATIONS[configKey]) {
    throw new Error(`No configuration found for: ${configKey}`);
  }
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

async function generateSectionAllModes(testType: string, sectionName: string, modes: string[]) {
  console.log('');
  console.log('━'.repeat(80));
  console.log('🎯 SECTION-FIRST UNIVERSAL GENERATOR - V2 ENGINE');
  console.log('━'.repeat(80));
  console.log('');
  console.log(`Test Type: ${testType}`);
  console.log(`Section: ${sectionName}`);
  console.log(`Modes: ${modes.join(', ')}`);
  console.log('');
  console.log('📊 STRATEGY: Generate all test modes for ONE section');
  console.log('   ✅ Cross-mode diversity checking');
  console.log('   ✅ Consistent quality across all modes');
  console.log('   ✅ Maximum variety in question bank');
  console.log('');

  // Load section configuration
  const configKey = `${testType} - ${sectionName}`;
  const sectionConfig = SECTION_CONFIGURATIONS[configKey];
  const { total_questions } = sectionConfig;

  console.log(`📋 Section Configuration:`);
  console.log(`   Questions per test: ${total_questions}`);
  console.log(`   Total modes: ${modes.length}`);
  console.log(`   Total questions to generate: ${total_questions * modes.length}`);
  console.log('');
  console.log('━'.repeat(80));
  console.log('');

  // Helper function to calculate target distribution (may vary by mode for writing prompts)
  function getTargetDistributionForMode(mode: string, modeIndex: number): { [subSkill: string]: number } {
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

      // Standalone questions: count per sub-skill is explicit
      hybrid.standalone_distribution.forEach(item => {
        targetDistribution[item.sub_skill] = item.count;
      });

      // Passage-based questions: distributed among sub-skills via rotation
      hybrid.passage_distribution.forEach(item => {
        const questionsPerPassage = Array.isArray(item.questions_per_passage)
          ? Math.floor((item.questions_per_passage[0] + item.questions_per_passage[1]) / 2)
          : item.questions_per_passage;

        const totalQuestionsForThisPassageType = item.count * questionsPerPassage;
        const numSubSkills = item.sub_skills.length;

        // Questions rotate through sub-skills, so distribute proportionally
        item.sub_skills.forEach((skill, index) => {
          const baseCount = Math.floor(totalQuestionsForThisPassageType / numSubSkills);
          const remainder = totalQuestionsForThisPassageType % numSubSkills;
          const skillCount = baseCount + (index < remainder ? 1 : 0);

          targetDistribution[skill] = (targetDistribution[skill] || 0) + skillCount;
        });
      });
    } else if (sectionConfig.section_structure.generation_strategy === 'passage_based') {
      const passages = sectionConfig.section_structure.passage_blueprint!;

      // For passage-based sections, questions are DISTRIBUTED among sub-skills, not multiplied per sub-skill
      // So we calculate the PROPORTION of questions each sub-skill gets based on rotation pattern
      passages.passage_distribution.forEach(item => {
        const questionsPerPassage = Array.isArray(item.questions_per_passage)
          ? Math.floor((item.questions_per_passage[0] + item.questions_per_passage[1]) / 2)
          : item.questions_per_passage;

        const totalQuestionsForThisPassageType = item.count * questionsPerPassage;
        const numSubSkills = item.sub_skills.length;

        // Questions rotate through sub-skills, so distribute proportionally
        item.sub_skills.forEach((skill, index) => {
          // Calculate how many times this sub-skill appears in the rotation
          // For questionsPerPassage=5 and numSubSkills=3: [0,1,2,0,1] → skill 0 and 1 get 2, skill 2 gets 1
          const baseCount = Math.floor(totalQuestionsForThisPassageType / numSubSkills);
          const remainder = totalQuestionsForThisPassageType % numSubSkills;
          const skillCount = baseCount + (index < remainder ? 1 : 0);

          targetDistribution[skill] = (targetDistribution[skill] || 0) + skillCount;
        });
      });
    } else if (sectionConfig.section_structure.generation_strategy === 'writing_prompt') {
      const writing = sectionConfig.section_structure.writing_blueprint!;

      // For writing prompts with choice, we need 1 prompt per type (student picks one)
      // For no choice, we generate just 1 prompt rotating through types
      if (writing.allow_choice) {
        // Generate all prompt types - student chooses which to answer
        writing.prompt_types.forEach(promptType => {
          targetDistribution[promptType] = 1;
        });
      } else {
        // Generate just 1 prompt per test mode (rotates through types across modes)
        const typeIndex = modeIndex % writing.prompt_types.length;
        const promptType = writing.prompt_types[typeIndex];
        targetDistribution[promptType] = 1;
      }
    }

    return targetDistribution;
  }

  // Step 1: Detect gaps for all modes
  console.log('🔍 Step 1: Detecting gaps across all test modes...');
  console.log('');

  const allGapReports = [];
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const targetDistribution = getTargetDistributionForMode(mode, i);

    const gapReport = await generateTestGapReport(
      testType,
      mode,
      [{ sectionName, targetDistribution }]
    );

    allGapReports.push({ mode, report: gapReport });

    console.log(`📊 ${mode}:`);
    console.log(`   Target: ${gapReport.totalQuestionsTarget} questions`);
    console.log(`   Existing: ${gapReport.totalQuestionsExisting} questions`);
    console.log(`   Gaps: ${gapReport.totalQuestionsNeeded} questions`);
    console.log('');
  }

  const totalTarget = allGapReports.reduce((sum, r) => sum + r.report.totalQuestionsTarget, 0);
  const totalExisting = allGapReports.reduce((sum, r) => sum + r.report.totalQuestionsExisting, 0);
  const totalGaps = allGapReports.reduce((sum, r) => sum + r.report.totalQuestionsNeeded, 0);

  console.log('📊 OVERALL SUMMARY:');
  console.log(`   Total Target: ${totalTarget} questions`);
  console.log(`   Total Existing: ${totalExisting} questions`);
  console.log(`   Total Gaps: ${totalGaps} questions`);
  console.log(`   Completion: ${((totalExisting / totalTarget) * 100).toFixed(1)}%`);
  console.log('');

  if (totalGaps === 0) {
    console.log('✅ All questions already generated! Nothing to do.');
    console.log('');
    return {
      success: true,
      message: 'All modes complete',
      questionsGenerated: 0
    };
  }

  console.log('━'.repeat(80));
  console.log('');

  // Step 2: Generate missing questions for each mode
  console.log('📝 Step 2: Generating missing questions (with cross-mode diversity)...');
  console.log('');

  const startTime = Date.now();
  const results: any[] = [];
  let totalGenerated = 0;
  let totalCost = 0;

  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const gapData = allGapReports.find(r => r.mode === mode);

    if (!gapData || gapData.report.sections[0].totalGaps === 0) {
      console.log(`━`.repeat(80));
      console.log(`📝 MODE ${i + 1}/${modes.length}: ${mode}`);
      console.log(`━`.repeat(80));
      console.log(`   ✅ Already complete! (${gapData?.report.sections[0].totalExisting}/${gapData?.report.sections[0].totalTarget} questions)`);
      console.log('');

      results.push({
        mode,
        questionsGenerated: 0,
        alreadyComplete: true
      });

      continue;
    }

    console.log(`━`.repeat(80));
    console.log(`📝 MODE ${i + 1}/${modes.length}: ${mode}`);
    console.log(`━`.repeat(80));
    console.log(`   Target: ${gapData.report.sections[0].totalTarget} questions`);
    console.log(`   Existing: ${gapData.report.sections[0].totalExisting} questions`);
    console.log(`   Gaps to fill: ${gapData.report.sections[0].totalGaps} questions`);
    console.log('');
    console.log(`   🔀 Cross-mode diversity: Loading questions from ALL modes for context`);
    console.log('');

    try {
      const result = await generateSectionV2({
        testType,
        sectionName,
        testMode: mode,
        difficultyStrategy: { type: 'balanced', difficulties: [1, 2, 3] },
        skipStorage: false,
        crossModeDiversity: true  // ⭐ KEY: Enable cross-mode diversity
      });

      if (result.success) {
        console.log('');
        console.log(`   ✅ Mode Complete!`);
        console.log(`   📊 Generated: ${result.metadata.total_questions_generated} questions`);
        if (result.metadata.total_passages > 0) {
          console.log(`   📖 Passages: ${result.metadata.total_passages}`);
        }
        if (result.metadata.totalFailed > 0) {
          console.log(`   ⚠️  Failures: ${result.metadata.totalFailed} | Reattempts: ${result.metadata.totalReattempts}`);
        }
        console.log(`   💰 Cost: $${result.metadata.total_cost.toFixed(4)}`);
        console.log('');

        results.push({
          mode,
          questionsGenerated: result.metadata.total_questions_generated,
          cost: result.metadata.total_cost,
          success: true,
          subSkillStats: result.metadata.subSkillStats,
          totalFailed: result.metadata.totalFailed,
          totalReattempts: result.metadata.totalReattempts
        });

        totalGenerated += result.metadata.total_questions_generated;
        totalCost += result.metadata.total_cost;
      } else {
        console.log('');
        console.log(`   ❌ Mode Failed: ${result.error}`);
        console.log('');

        results.push({
          mode,
          questionsGenerated: 0,
          success: false,
          error: result.error,
          subSkillStats: result.metadata.subSkillStats,
          totalFailed: result.metadata.totalFailed,
          totalReattempts: result.metadata.totalReattempts
        });
      }
    } catch (error: any) {
      console.log('');
      console.log(`   ❌ Error: ${error.message || error}`);
      console.log('');

      results.push({
        mode,
        questionsGenerated: 0,
        success: false,
        error: error.message || error,
        subSkillStats: {},
        totalFailed: 0,
        totalReattempts: 0
      });
    }
  }

  const totalTime = Date.now() - startTime;

  // Aggregate sub-skill stats across all modes
  const aggregatedSubSkillStats: Record<string, SubSkillStats & { modes: string[] }> = {};
  results.forEach(r => {
    if (!r.subSkillStats) return;
    Object.entries(r.subSkillStats as Record<string, SubSkillStats>).forEach(([subSkill, stats]) => {
      if (!aggregatedSubSkillStats[subSkill]) {
        aggregatedSubSkillStats[subSkill] = { target: 0, generated: 0, failed: 0, reattempts: 0, modes: [] };
      }
      aggregatedSubSkillStats[subSkill].target += stats.target;
      aggregatedSubSkillStats[subSkill].generated += stats.generated;
      aggregatedSubSkillStats[subSkill].failed += stats.failed;
      aggregatedSubSkillStats[subSkill].reattempts += stats.reattempts;
      aggregatedSubSkillStats[subSkill].modes.push(r.mode);
    });
  });

  const totalFailed = results.reduce((sum, r) => sum + (r.totalFailed || 0), 0);
  const totalReattempts = results.reduce((sum, r) => sum + (r.totalReattempts || 0), 0);

  // Post-generation gap check — re-query DB to see actual state
  console.log('');
  console.log('━'.repeat(80));
  console.log('🔍 POST-GENERATION GAP CHECK');
  console.log('━'.repeat(80));
  console.log('');

  const postGapReports: Array<{ mode: string; target: number; existing: number; gaps: number }> = [];
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const targetDistribution = getTargetDistributionForMode(mode, i);

    const gapReport = await generateTestGapReport(
      testType,
      mode,
      [{ sectionName, targetDistribution }]
    );
    postGapReports.push({
      mode,
      target: gapReport.totalQuestionsTarget,
      existing: gapReport.totalQuestionsExisting,
      gaps: gapReport.totalQuestionsNeeded
    });
    const status = gapReport.totalQuestionsNeeded === 0 ? '✅' : '⚠️ ';
    console.log(`   ${status} ${mode}: ${gapReport.totalQuestionsExisting}/${gapReport.totalQuestionsTarget} (${gapReport.totalQuestionsNeeded} still needed)`);
  }

  const postTotalTarget = postGapReports.reduce((sum, r) => sum + r.target, 0);
  const postTotalExisting = postGapReports.reduce((sum, r) => sum + r.existing, 0);
  const postTotalGaps = postGapReports.reduce((sum, r) => sum + r.gaps, 0);

  console.log('');
  console.log(`   Total: ${postTotalExisting}/${postTotalTarget} questions (${postTotalGaps} still needed)`);
  console.log(`   Completion: ${((postTotalExisting / postTotalTarget) * 100).toFixed(1)}%`);
  console.log('');

  // Final Summary
  console.log('━'.repeat(80));
  console.log('🎉 SECTION GENERATION COMPLETE');
  console.log('━'.repeat(80));
  console.log('');
  console.log('📊 Final Statistics:');
  console.log('');
  console.log('   By Mode:');
  results.forEach(r => {
    const status = r.success ? '✅' : r.alreadyComplete ? '✓' : '❌';
    const msg = r.alreadyComplete
      ? 'already complete'
      : r.success
      ? `${r.questionsGenerated} questions generated`
      : 'failed';
    const failInfo = (r.totalFailed || 0) > 0 ? ` [${r.totalFailed} failed, ${r.totalReattempts} reattempts]` : '';
    console.log(`   ${status} ${r.mode}: ${msg}${failInfo}`);
  });
  console.log('');
  console.log('   Overall Totals:');
  console.log(`   📝 Questions Generated: ${totalGenerated}`);
  console.log(`   ❌ Total Failures: ${totalFailed}`);
  console.log(`   🔄 Total Reattempts: ${totalReattempts}`);
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

  if (Object.keys(aggregatedSubSkillStats).length > 0) {
    console.log('   📋 By Sub-Skill (aggregated across all modes):');
    Object.entries(aggregatedSubSkillStats).forEach(([subSkill, stats]) => {
      const failInfo = stats.failed > 0 ? ` — ⚠️  ${stats.failed} failed` : '';
      const retryInfo = stats.reattempts > 0 ? `, ${stats.reattempts} reattempts` : '';
      console.log(`   ${stats.failed > 0 ? '⚠️ ' : '✅'} ${subSkill}: ${stats.generated}/${stats.target}${failInfo}${retryInfo}`);
    });
    console.log('');
  }

  console.log('━'.repeat(80));
  console.log('📋 Next Steps:');
  console.log('');
  if (postTotalGaps > 0) {
    console.log(`   ⚠️  ${postTotalGaps} questions still needed — re-run this script to fill gaps.`);
  } else {
    console.log('   ✅ All modes complete!');
  }
  console.log('   1. Review questions in database: questions_v2 table');
  console.log('   2. Check quality scores for any issues');
  console.log('   3. Generate drills for this section (if needed)');
  console.log('');
  console.log('   Database Query:');
  console.log(`   SELECT test_mode, sub_skill, COUNT(*) as count`);
  console.log(`   FROM questions_v2`);
  console.log(`   WHERE test_type = '${testType}'`);
  console.log(`   AND section_name = '${sectionName}'`);
  console.log(`   GROUP BY test_mode, sub_skill`);
  console.log(`   ORDER BY test_mode, sub_skill;`);
  console.log('');
  console.log('━'.repeat(80));
  console.log('');

  // Write post-generation markdown report
  await writePostGenerationReport({
    testType,
    sectionName,
    modes,
    results,
    aggregatedSubSkillStats,
    postGapReports,
    postTotalTarget,
    postTotalExisting,
    postTotalGaps,
    totalGenerated,
    totalFailed,
    totalReattempts,
    totalCost,
    totalTime
  });

  return {
    success: true,
    questionsGenerated: totalGenerated,
    totalCost,
    totalTime
  };
}

// ============================================================================
// POST-GENERATION REPORT WRITER
// ============================================================================

async function writePostGenerationReport(data: {
  testType: string;
  sectionName: string;
  modes: string[];
  results: any[];
  aggregatedSubSkillStats: Record<string, SubSkillStats & { modes: string[] }>;
  postGapReports: Array<{ mode: string; target: number; existing: number; gaps: number }>;
  postTotalTarget: number;
  postTotalExisting: number;
  postTotalGaps: number;
  totalGenerated: number;
  totalFailed: number;
  totalReattempts: number;
  totalCost: number;
  totalTime: number;
}): Promise<void> {
  const {
    testType, sectionName, modes, results, aggregatedSubSkillStats,
    postGapReports, postTotalTarget, postTotalExisting, postTotalGaps,
    totalGenerated, totalFailed, totalReattempts, totalCost, totalTime
  } = data;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const sectionSlug = sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const testSlug = testType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
  const filename = `post-generation-check-${testSlug}-${sectionSlug}-${timestamp}.md`;
  const reportsDir = path.resolve(process.cwd(), 'docs', 'generation-reports');

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filepath = path.join(reportsDir, filename);
  const runDate = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', dateStyle: 'full', timeStyle: 'short' });
  const completionPct = ((postTotalExisting / postTotalTarget) * 100).toFixed(1);
  const overallStatus = postTotalGaps === 0 ? '✅ COMPLETE' : `⚠️  INCOMPLETE (${postTotalGaps} still needed)`;

  const lines: string[] = [
    `# Post-Generation Check`,
    ``,
    `**Test Type:** ${testType}`,
    `**Section:** ${sectionName}`,
    `**Modes:** ${modes.join(', ')}`,
    `**Run Date:** ${runDate}`,
    `**Status:** ${overallStatus}`,
    ``,
    `---`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Questions Generated This Run | ${totalGenerated} |`,
    `| Total Failures (exhausted retries) | ${totalFailed} |`,
    `| Total Reattempts | ${totalReattempts} |`,
    `| Total Cost | $${totalCost.toFixed(4)} |`,
    `| Total Time | ${Math.round(totalTime / 1000 / 60)}m ${Math.round((totalTime / 1000) % 60)}s |`,
    totalGenerated > 0 ? `| Avg Cost per Question | $${(totalCost / totalGenerated).toFixed(4)} |` : '',
    totalGenerated > 0 ? `| Avg Time per Question | ${((totalTime / 1000) / totalGenerated).toFixed(1)}s |` : '',
    ``,
    `---`,
    ``,
    `## Post-Generation Gap Check (DB State)`,
    ``,
    `| Mode | Existing | Target | Still Needed | Status |`,
    `|------|----------|--------|-------------|--------|`,
    ...postGapReports.map(r => {
      const pct = ((r.existing / r.target) * 100).toFixed(0);
      const status = r.gaps === 0 ? '✅ Complete' : `⚠️  ${r.gaps} needed`;
      return `| ${r.mode} | ${r.existing} | ${r.target} | ${r.gaps} | ${status} (${pct}%) |`;
    }),
    `| **TOTAL** | **${postTotalExisting}** | **${postTotalTarget}** | **${postTotalGaps}** | **${completionPct}%** |`,
    ``,
    `---`,
    ``,
    `## Generation Results by Mode`,
    ``,
    `| Mode | Generated | Failures | Reattempts | Cost | Status |`,
    `|------|-----------|----------|-----------|------|--------|`,
    ...results.map(r => {
      if (r.alreadyComplete) {
        return `| ${r.mode} | — | — | — | — | ✓ Already complete |`;
      }
      const status = r.success ? '✅' : '❌ Failed';
      const failInfo = (r.totalFailed || 0) > 0 ? r.totalFailed : '0';
      const retryInfo = (r.totalReattempts || 0) > 0 ? r.totalReattempts : '0';
      const cost = r.cost ? `$${r.cost.toFixed(4)}` : '—';
      return `| ${r.mode} | ${r.questionsGenerated || 0} | ${failInfo} | ${retryInfo} | ${cost} | ${status} |`;
    }),
    ``,
  ];

  // Sub-skill breakdown (only if we have stats)
  if (Object.keys(aggregatedSubSkillStats).length > 0) {
    lines.push(`---`, ``);
    lines.push(`## Sub-Skill Breakdown (Aggregated Across All Modes)`, ``);
    lines.push(`| Sub-Skill | Generated | Target | Failures | Reattempts | Status |`);
    lines.push(`|-----------|-----------|--------|----------|-----------|--------|`);

    Object.entries(aggregatedSubSkillStats).forEach(([subSkill, stats]) => {
      const pct = stats.target > 0 ? ((stats.generated / stats.target) * 100).toFixed(0) : '0';
      const status = stats.failed === 0 ? `✅ ${pct}%` : `⚠️  ${pct}% (${stats.failed} failed)`;
      lines.push(`| ${subSkill} | ${stats.generated} | ${stats.target} | ${stats.failed} | ${stats.reattempts} | ${status} |`);
    });

    lines.push(``);
  }

  // Failures section — only if any failures occurred
  if (totalFailed > 0) {
    lines.push(`---`, ``);
    lines.push(`## ⚠️  Failures Requiring Attention`, ``);
    lines.push(`The following sub-skills had questions that failed all 3 generation attempts:`, ``);
    Object.entries(aggregatedSubSkillStats).forEach(([subSkill, stats]) => {
      if (stats.failed > 0) {
        lines.push(`- **${subSkill}**: ${stats.failed} failed across modes: ${stats.modes.join(', ')}`);
      }
    });
    lines.push(``);
    lines.push(`**Action required:** Re-run the generation script — gap detection will automatically retry these.`, ``);
  }

  // Next steps
  lines.push(`---`, ``);
  lines.push(`## Next Steps`, ``);
  if (postTotalGaps > 0) {
    lines.push(`1. **Re-run generation** — ${postTotalGaps} questions still needed:`);
    lines.push(`   \`\`\``);
    lines.push(`   npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \\`);
    lines.push(`     --test="${testType}" \\`);
    lines.push(`     --section="${sectionName}" \\`);
    lines.push(`     --modes="${modes.join(',')}"`);
    lines.push(`   \`\`\``);
    lines.push(``);
    lines.push(`2. Generate drills once complete:`);
  } else {
    lines.push(`1. Generate drills for this section:`);
  }
  lines.push(`   \`\`\``);
  lines.push(`   npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \\`);
  lines.push(`     --test="${testType}" \\`);
  lines.push(`     --section="${sectionName}" \\`);
  lines.push(`     --drills-per-subskill=20`);
  lines.push(`   \`\`\``);
  lines.push(``);
  lines.push(`---`);
  lines.push(`*Generated by V2 Engine — ${new Date().toISOString()}*`);

  const content = lines.filter(l => l !== null && l !== undefined).join('\n');
  fs.writeFileSync(filepath, content, 'utf8');

  console.log(`📄 Post-generation report written to:`);
  console.log(`   ${filepath}`);
  console.log('');
}

// ============================================================================
// RUN GENERATOR
// ============================================================================

const { testType, sectionName, modes } = parseArguments();

if (!testType || !sectionName || modes.length === 0) {
  console.error('');
  console.error('❌ Error: Missing required arguments');
  console.error('');
  console.error('Usage:');
  console.error('  npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \\');
  console.error('    --test="<TEST_TYPE>" \\');
  console.error('    --section="<SECTION_NAME>" \\');
  console.error('    --modes="<MODE1>,<MODE2>,..."');
  console.error('');
  console.error('Examples:');
  console.error('  # EduTest Verbal Reasoning (5 practice + 1 diagnostic)');
  console.error('  npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \\');
  console.error('    --test="EduTest Scholarship (Year 7 Entry)" \\');
  console.error('    --section="Verbal Reasoning" \\');
  console.error('    --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"');
  console.error('');
  console.error('  # ACER Humanities (5 practice + 1 diagnostic)');
  console.error('  npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \\');
  console.error('    --test="ACER Scholarship (Year 7 Entry)" \\');
  console.error('    --section="Humanities" \\');
  console.error('    --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"');
  console.error('');
  process.exit(1);
}

try {
  validateInputs(testType, sectionName, modes);
} catch (error: any) {
  console.error('');
  console.error('❌ Validation Error:', error.message);
  console.error('');
  process.exit(1);
}

console.log('');
console.log('🚀 Starting Section-First Generation...');

generateSectionAllModes(testType, sectionName, modes)
  .then((result) => {
    if (result.success) {
      if (result.questionsGenerated === 0) {
        console.log('\n✅ SUCCESS! All modes already complete.\n');
      } else {
        console.log(`\n✅ SUCCESS! Generated ${result.questionsGenerated} questions across ${modes.length} modes.\n`);
      }
      process.exit(0);
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some modes may have failed.\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 FATAL ERROR:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  });
