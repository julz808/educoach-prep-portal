/**
 * Generate Visual Coverage Chart
 *
 * Creates a text-based visualization of example coverage across all test products
 */

import { ACER_SUB_SKILLS } from '../../src/data/curriculumData_v2/acer';
import { EDUTEST_SUB_SKILLS } from '../../src/data/curriculumData_v2/edutest';
import { NSW_SELECTIVE_SUB_SKILLS } from '../../src/data/curriculumData_v2/nsw-selective';
import { VIC_SELECTIVE_SUB_SKILLS } from '../../src/data/curriculumData_v2/vic-selective';
import type { SubSkillExamplesDatabase } from '../../src/data/curriculumData_v2/types';

interface SubSkillCoverage {
  section: string;
  subSkill: string;
  difficultyRange: number[];
  coverage: Map<number, number>; // difficulty -> count
  complete: boolean;
}

function analyzeDatabase(database: SubSkillExamplesDatabase): SubSkillCoverage[] {
  const results: SubSkillCoverage[] = [];

  for (const [sectionName, section] of Object.entries(database)) {
    for (const [subSkillName, subSkill] of Object.entries(section)) {
      const difficultyRange = subSkill.difficulty_range || [1, 2, 3];
      const coverage = new Map<number, number>();

      if (subSkill.examples && Array.isArray(subSkill.examples)) {
        subSkill.examples.forEach(example => {
          const count = coverage.get(example.difficulty) || 0;
          coverage.set(example.difficulty, count + 1);
        });
      }

      const complete = difficultyRange.every(d => coverage.has(d) && coverage.get(d)! > 0);

      results.push({
        section: sectionName,
        subSkill: subSkillName,
        difficultyRange,
        coverage,
        complete
      });
    }
  }

  return results;
}

function printCoverageChart(testName: string, coverage: SubSkillCoverage[]) {
  console.log(`\n${'='.repeat(90)}`);
  console.log(`${testName}`);
  console.log('='.repeat(90));

  let currentSection = '';

  coverage.forEach(item => {
    if (item.section !== currentSection) {
      currentSection = item.section;
      console.log(`\n📁 ${item.section}`);
      console.log('-'.repeat(90));
    }

    const status = item.complete ? '✅' : '❌';
    const coverageStr = item.difficultyRange.map(d => {
      const count = item.coverage.get(d) || 0;
      return count > 0 ? `${d}:${count}` : `${d}:✗`;
    }).join(' | ');

    console.log(`${status} ${item.subSkill.padEnd(45)} [${coverageStr}]`);
  });

  const totalComplete = coverage.filter(c => c.complete).length;
  const totalSubSkills = coverage.length;
  const percentage = Math.round((totalComplete / totalSubSkills) * 100);

  console.log('\n' + '-'.repeat(90));
  console.log(`Summary: ${totalComplete}/${totalSubSkills} sub-skills complete (${percentage}%)`);
  console.log('='.repeat(90));
}

function main() {
  console.log('\n📊 EXAMPLE COVERAGE VISUALIZATION\n');
  console.log('Legend:');
  console.log('  ✅ = Complete coverage for all difficulty levels');
  console.log('  ❌ = Missing examples at one or more difficulty levels');
  console.log('  [1:2 | 2:3 | 3:1] = Difficulty level : Number of examples');
  console.log('  [1:✗] = No examples at this difficulty level\n');

  const tests: [string, SubSkillExamplesDatabase][] = [
    ['ACER Scholarship (Year 7 Entry)', ACER_SUB_SKILLS],
    ['EduTest Scholarship', EDUTEST_SUB_SKILLS],
    ['NSW Selective Schools', NSW_SELECTIVE_SUB_SKILLS],
    ['VIC Selective Schools', VIC_SELECTIVE_SUB_SKILLS]
  ];

  tests.forEach(([testName, database]) => {
    const coverage = analyzeDatabase(database);
    printCoverageChart(testName, coverage);
  });
}

main();
