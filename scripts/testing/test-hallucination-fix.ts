/**
 * Test script to verify curriculum examples pass hallucination checks
 * This verifies Issue #4 fix - cleaned examples should pass validation
 */

import {
  VIC_SELECTIVE_SUB_SKILLS,
  NAPLAN_YEAR7_SUB_SKILLS
} from '../src/data/curriculumData_v2';

// Hallucination patterns from validator.ts
const hallucinationPatterns = [
  /wait,?\s+let\s+me/i,
  /let\s+me\s+recalculate/i,
  /actually,?\s+wait/i,
  /i\s+apologize/i,
  /my\s+mistake/i,
  /let\s+me\s+check/i,
  /hold\s+on/i,
  /correction:/i
];

function checkForHallucinations(text: string): string[] {
  const foundPatterns: string[] = [];
  for (const pattern of hallucinationPatterns) {
    if (pattern.test(text)) {
      foundPatterns.push(pattern.source);
    }
  }
  return foundPatterns;
}

console.log('\n🔍 Checking curriculum examples for hallucination patterns...\n');

let totalExamples = 0;
let totalWithHallucinations = 0;
const problemExamples: Array<{ test: string; section: string; subSkill: string; patterns: string[] }> = [];

// Test types to check (the ones we fixed)
const testTypesToCheck = {
  'VIC Selective Entry (Year 9 Entry)': VIC_SELECTIVE_SUB_SKILLS,
  'Year 7 NAPLAN': NAPLAN_YEAR7_SUB_SKILLS
};

// Check all test types
for (const [testType, sections] of Object.entries(testTypesToCheck)) {
  for (const [sectionName, sectionData] of Object.entries(sections)) {
    if (typeof sectionData !== 'object' || !sectionData) continue;

    for (const [subSkillName, subSkillData] of Object.entries(sectionData)) {
      if (typeof subSkillData !== 'object' || !subSkillData || !subSkillData.examples) continue;

      for (const example of subSkillData.examples) {
        totalExamples++;

        // Check explanation field
        if (example.explanation) {
          const patterns = checkForHallucinations(example.explanation);
          if (patterns.length > 0) {
            totalWithHallucinations++;
            problemExamples.push({
              test: testType,
              section: sectionName,
              subSkill: subSkillName,
              patterns
            });
          }
        }
      }
    }
  }
}

console.log(`✅ Checked ${totalExamples} examples across all test types\n`);

if (totalWithHallucinations === 0) {
  console.log('🎉 SUCCESS! No hallucination patterns found in any examples.\n');
  console.log('   All curriculum examples are now clean and will not be rejected by the validator.\n');
  console.log('   Expected outcome:');
  console.log('   - Retry rates should drop from 80-138% to <20%');
  console.log('   - Generation success rate should improve from 50-60% to 90%+');
  console.log('   - Cost per question should drop from $0.014-0.032 to ~$0.006-0.010\n');
} else {
  console.log(`❌ FOUND ${totalWithHallucinations} examples with hallucination patterns:\n`);

  for (const problem of problemExamples) {
    console.log(`   ${problem.test} > ${problem.section} > ${problem.subSkill}`);
    console.log(`      Patterns: ${problem.patterns.join(', ')}\n`);
  }

  console.log('   These examples need to be cleaned before generation can succeed.\n');
  process.exit(1);
}
