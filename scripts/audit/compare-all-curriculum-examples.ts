import { EDUTEST_SUB_SKILLS } from '../../src/data/curriculumData_v2/edutest';
import { NSW_SELECTIVE_SUB_SKILLS } from '../../src/data/curriculumData_v2/nsw-selective';
import { VIC_SELECTIVE_SUB_SKILLS } from '../../src/data/curriculumData_v2/vic-selective';
import { NAPLAN_YEAR5_SUB_SKILLS } from '../../src/data/curriculumData_v2/naplan-year5';
import { ACER_SUB_SKILLS } from '../../src/data/curriculumData_v2/acer';

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('CURRICULUM DATA V2: EXAMPLE COVERAGE COMPARISON ACROSS ALL PRODUCTS');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

interface ExampleStats {
  totalSubSkills: number;
  totalExamples: number;
  easy: number;
  medium: number;
  hard: number;
  avgExamplesPerSubSkill: number;
  subSkillsWithEasy: number;
  subSkillsWithMedium: number;
  subSkillsWithHard: number;
  subSkillsWithAllThree: number;
}

function analyzeProduct(productName: string, subSkillsDatabase: any): ExampleStats {
  const stats: ExampleStats = {
    totalSubSkills: 0,
    totalExamples: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    avgExamplesPerSubSkill: 0,
    subSkillsWithEasy: 0,
    subSkillsWithMedium: 0,
    subSkillsWithHard: 0,
    subSkillsWithAllThree: 0
  };

  // Iterate through all sections and sub-skills
  for (const [sectionKey, subSkills] of Object.entries(subSkillsDatabase)) {
    for (const [subSkillName, data] of Object.entries(subSkills as any)) {
      stats.totalSubSkills++;

      const exampleCounts = { 1: 0, 2: 0, 3: 0 };

      (data as any).examples.forEach((ex: any) => {
        stats.totalExamples++;
        exampleCounts[ex.difficulty as 1 | 2 | 3]++;
      });

      stats.easy += exampleCounts[1];
      stats.medium += exampleCounts[2];
      stats.hard += exampleCounts[3];

      if (exampleCounts[1] > 0) stats.subSkillsWithEasy++;
      if (exampleCounts[2] > 0) stats.subSkillsWithMedium++;
      if (exampleCounts[3] > 0) stats.subSkillsWithHard++;
      if (exampleCounts[1] > 0 && exampleCounts[2] > 0 && exampleCounts[3] > 0) {
        stats.subSkillsWithAllThree++;
      }
    }
  }

  stats.avgExamplesPerSubSkill = stats.totalExamples / stats.totalSubSkills;

  return stats;
}

function printStats(productName: string, stats: ExampleStats) {
  const easyPct = ((stats.easy / stats.totalExamples) * 100).toFixed(0);
  const medPct = ((stats.medium / stats.totalExamples) * 100).toFixed(0);
  const hardPct = ((stats.hard / stats.totalExamples) * 100).toFixed(0);

  const easySkillPct = ((stats.subSkillsWithEasy / stats.totalSubSkills) * 100).toFixed(0);
  const medSkillPct = ((stats.subSkillsWithMedium / stats.totalSubSkills) * 100).toFixed(0);
  const hardSkillPct = ((stats.subSkillsWithHard / stats.totalSubSkills) * 100).toFixed(0);
  const allThreePct = ((stats.subSkillsWithAllThree / stats.totalSubSkills) * 100).toFixed(0);

  console.log(`\n${'▓'.repeat(80)}`);
  console.log(`${productName.toUpperCase()}`);
  console.log(`${'▓'.repeat(80)}\n`);

  console.log(`Total Sub-Skills: ${stats.totalSubSkills}`);
  console.log(`Total Examples: ${stats.totalExamples}`);
  console.log(`Avg Examples per Sub-Skill: ${stats.avgExamplesPerSubSkill.toFixed(1)}`);

  console.log('\n📊 EXAMPLE DISTRIBUTION BY DIFFICULTY:');
  console.log('─'.repeat(80));
  console.log(`  Easy (1):   ${stats.easy.toString().padStart(3)} examples (${easyPct}% of total)`);
  console.log(`  Medium (2): ${stats.medium.toString().padStart(3)} examples (${medPct}% of total)`);
  console.log(`  Hard (3):   ${stats.hard.toString().padStart(3)} examples (${hardPct}% of total)`);

  console.log('\n📋 SUB-SKILL COVERAGE:');
  console.log('─'.repeat(80));
  console.log(`  Sub-skills with Easy examples:   ${stats.subSkillsWithEasy}/${stats.totalSubSkills} (${easySkillPct}%)`);
  console.log(`  Sub-skills with Medium examples: ${stats.subSkillsWithMedium}/${stats.totalSubSkills} (${medSkillPct}%)`);
  console.log(`  Sub-skills with Hard examples:   ${stats.subSkillsWithHard}/${stats.totalSubSkills} (${hardSkillPct}%)`);
  console.log(`  Sub-skills with ALL THREE:       ${stats.subSkillsWithAllThree}/${stats.totalSubSkills} (${allThreePct}%)`);

  // Quality assessment
  console.log('\n⭐ QUALITY ASSESSMENT:');
  console.log('─'.repeat(80));

  let score = 0;
  let issues: string[] = [];
  let strengths: string[] = [];

  // Check coverage
  if (stats.subSkillsWithAllThree === stats.totalSubSkills) {
    strengths.push('✅ ALL sub-skills have examples at all difficulty levels');
    score += 3;
  } else if (stats.subSkillsWithAllThree >= stats.totalSubSkills * 0.7) {
    strengths.push(`✅ Most sub-skills (${allThreePct}%) have all three difficulty levels`);
    score += 2;
  } else if (stats.subSkillsWithAllThree >= stats.totalSubSkills * 0.5) {
    issues.push(`⚠️ Only ${allThreePct}% of sub-skills have all three difficulty levels`);
    score += 1;
  } else {
    issues.push(`❌ Only ${allThreePct}% of sub-skills have all three difficulty levels`);
  }

  // Check average examples
  if (stats.avgExamplesPerSubSkill >= 4) {
    strengths.push(`✅ Good example density (${stats.avgExamplesPerSubSkill.toFixed(1)} per sub-skill)`);
    score += 2;
  } else if (stats.avgExamplesPerSubSkill >= 3) {
    strengths.push(`✅ Adequate examples (${stats.avgExamplesPerSubSkill.toFixed(1)} per sub-skill)`);
    score += 1;
  } else {
    issues.push(`⚠️ Low example count (${stats.avgExamplesPerSubSkill.toFixed(1)} per sub-skill)`);
  }

  // Check balance
  if (stats.easy > 0 && stats.medium > 0 && stats.hard > 0) {
    const balance = Math.max(stats.easy, stats.medium, stats.hard) / Math.min(stats.easy, stats.medium, stats.hard);
    if (balance <= 2) {
      strengths.push('✅ Well-balanced difficulty distribution');
      score += 2;
    } else if (balance <= 4) {
      issues.push('⚠️ Moderate imbalance in difficulty distribution');
      score += 1;
    } else {
      issues.push('❌ Severe imbalance in difficulty distribution');
    }
  } else {
    issues.push('❌ Missing examples at one or more difficulty levels');
  }

  strengths.forEach(s => console.log(`  ${s}`));
  issues.forEach(i => console.log(`  ${i}`));

  const stars = '⭐'.repeat(Math.min(5, score));
  const maxScore = 7;
  console.log(`\n  Overall Score: ${stars} (${score}/${maxScore})`);

  if (score >= 6) {
    console.log('  Rating: EXCELLENT - Ready for production generation');
  } else if (score >= 4) {
    console.log('  Rating: GOOD - Minor improvements recommended');
  } else if (score >= 2) {
    console.log('  Rating: NEEDS WORK - Significant gaps to fill');
  } else {
    console.log('  Rating: POOR - Major overhaul needed');
  }
}

// Analyze all products
const products = [
  { name: 'EduTest Scholarship', data: EDUTEST_SUB_SKILLS },
  { name: 'NSW Selective Entry', data: NSW_SELECTIVE_SUB_SKILLS },
  { name: 'VIC Selective Entry', data: VIC_SELECTIVE_SUB_SKILLS },
  { name: 'Year 5 NAPLAN', data: NAPLAN_YEAR5_SUB_SKILLS },
  { name: 'ACER Scholarship', data: ACER_SUB_SKILLS }
];

const allStats: Array<{ name: string; stats: ExampleStats }> = [];

for (const product of products) {
  const stats = analyzeProduct(product.name, product.data);
  allStats.push({ name: product.name, stats });
  printStats(product.name, stats);
}

// Summary comparison
console.log('\n\n' + '═'.repeat(80));
console.log('📊 SUMMARY COMPARISON TABLE');
console.log('═'.repeat(80) + '\n');

console.log('Product'.padEnd(25) + ' | Total | Easy | Med | Hard | Avg/Skill | All-3 Coverage');
console.log('─'.repeat(88));

allStats.forEach(({ name, stats }) => {
  const allThreePct = ((stats.subSkillsWithAllThree / stats.totalSubSkills) * 100).toFixed(0);
  console.log(
    name.padEnd(25) + ' | ' +
    stats.totalExamples.toString().padStart(5) + ' | ' +
    stats.easy.toString().padStart(4) + ' | ' +
    stats.medium.toString().padStart(3) + ' | ' +
    stats.hard.toString().padStart(4) + ' | ' +
    stats.avgExamplesPerSubSkill.toFixed(1).padStart(9) + ' | ' +
    `${stats.subSkillsWithAllThree}/${stats.totalSubSkills} (${allThreePct}%)`
  );
});

console.log('\n' + '═'.repeat(80) + '\n');
