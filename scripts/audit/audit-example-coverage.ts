/**
 * Example Coverage Audit Script
 *
 * Audits all test products to check if they have complete example coverage
 * for every sub-skill × difficulty level combination.
 *
 * This is critical for LLM calibration during question generation.
 */

import { ACER_SUB_SKILLS } from '../../src/data/curriculumData_v2/acer';
import { EDUTEST_SUB_SKILLS } from '../../src/data/curriculumData_v2/edutest';
import { NSW_SELECTIVE_SUB_SKILLS } from '../../src/data/curriculumData_v2/nsw-selective';
import { VIC_SELECTIVE_SUB_SKILLS } from '../../src/data/curriculumData_v2/vic-selective';
import type { SubSkillExamplesDatabase } from '../../src/data/curriculumData_v2/types';

interface AuditResult {
  testName: string;
  totalSubSkills: number;
  difficultyLevels: number[];
  missingExamples: {
    section: string;
    subSkill: string;
    missingDifficulties: number[];
  }[];
  completionStatus: '✅ 100%' | '❌ Incomplete';
  completionPercentage: number;
}

function auditSubSkillDatabase(testName: string, database: SubSkillExamplesDatabase): AuditResult {
  const missingExamples: AuditResult['missingExamples'] = [];
  let totalSubSkills = 0;
  let allDifficultyLevels = new Set<number>();
  let totalExpectedExamples = 0;
  let totalActualExamples = 0;

  // Iterate through all sections
  for (const [sectionName, section] of Object.entries(database)) {
    // Iterate through all sub-skills in this section
    for (const [subSkillName, subSkill] of Object.entries(section)) {
      totalSubSkills++;

      // Get the difficulty range for this sub-skill
      const difficultyRange = subSkill.difficulty_range || [1, 2, 3];
      difficultyRange.forEach(d => allDifficultyLevels.add(d));

      // Check which difficulty levels have examples
      const examplesMap = new Map<number, number>();

      if (subSkill.examples && Array.isArray(subSkill.examples)) {
        subSkill.examples.forEach(example => {
          const difficulty = example.difficulty;
          examplesMap.set(difficulty, (examplesMap.get(difficulty) || 0) + 1);
        });
      }

      // Check for missing difficulties
      const missingDifficulties: number[] = [];
      for (const difficulty of difficultyRange) {
        totalExpectedExamples++;
        if (!examplesMap.has(difficulty) || examplesMap.get(difficulty) === 0) {
          missingDifficulties.push(difficulty);
        } else {
          totalActualExamples++;
        }
      }

      if (missingDifficulties.length > 0) {
        missingExamples.push({
          section: sectionName,
          subSkill: subSkillName,
          missingDifficulties
        });
      }
    }
  }

  const completionPercentage = totalExpectedExamples > 0
    ? Math.round((totalActualExamples / totalExpectedExamples) * 100)
    : 0;

  return {
    testName,
    totalSubSkills,
    difficultyLevels: Array.from(allDifficultyLevels).sort(),
    missingExamples,
    completionStatus: missingExamples.length === 0 ? '✅ 100%' : '❌ Incomplete',
    completionPercentage
  };
}

function printAuditReport(result: AuditResult) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${result.testName}`);
  console.log('='.repeat(80));
  console.log(`Total Sub-Skills: ${result.totalSubSkills}`);
  console.log(`Difficulty Levels Used: ${result.difficultyLevels.join(', ')}`);
  console.log(`Completion Status: ${result.completionStatus} (${result.completionPercentage}%)`);

  if (result.missingExamples.length > 0) {
    console.log(`\nMISSING EXAMPLES (${result.missingExamples.length} sub-skills affected):`);
    console.log('-'.repeat(80));

    result.missingExamples.forEach(({ section, subSkill, missingDifficulties }) => {
      console.log(`\n📍 Section: ${section}`);
      console.log(`   Sub-Skill: ${subSkill}`);
      console.log(`   Missing Difficulties: ${missingDifficulties.join(', ')}`);
    });
  } else {
    console.log('\n✅ All sub-skills have complete example coverage!');
  }

  console.log('\n' + '='.repeat(80));
}

function main() {
  console.log('\n🔍 EXAMPLE COVERAGE AUDIT REPORT');
  console.log('Checking all test products for complete example coverage...\n');

  const testDatabases: [string, SubSkillExamplesDatabase][] = [
    ['ACER Scholarship (Year 7 Entry)', ACER_SUB_SKILLS],
    ['EduTest Scholarship', EDUTEST_SUB_SKILLS],
    ['NSW Selective Schools', NSW_SELECTIVE_SUB_SKILLS],
    ['VIC Selective Schools', VIC_SELECTIVE_SUB_SKILLS]
  ];

  const results: AuditResult[] = [];

  for (const [testName, database] of testDatabases) {
    const result = auditSubSkillDatabase(testName, database);
    results.push(result);
    printAuditReport(result);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));

  results.forEach(result => {
    const icon = result.completionStatus === '✅ 100%' ? '✅' : '❌';
    console.log(`${icon} ${result.testName}: ${result.completionPercentage}% (${result.totalSubSkills} sub-skills)`);
  });

  const allComplete = results.every(r => r.completionStatus === '✅ 100%');

  if (allComplete) {
    console.log('\n🎉 ALL TEST PRODUCTS HAVE COMPLETE EXAMPLE COVERAGE!');
  } else {
    const incomplete = results.filter(r => r.completionStatus === '❌ Incomplete');
    console.log(`\n⚠️  ${incomplete.length} test product(s) need attention`);
  }

  console.log('='.repeat(80) + '\n');
}

main();
