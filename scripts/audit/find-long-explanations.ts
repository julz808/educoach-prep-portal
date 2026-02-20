/**
 * Find curriculum examples with suspiciously long explanations
 * Long explanations often indicate hallucination or impossible questions
 */

import {
  VIC_SELECTIVE_SUB_SKILLS,
  NAPLAN_YEAR7_SUB_SKILLS,
  NAPLAN_YEAR5_SUB_SKILLS,
  NSW_SELECTIVE_SUB_SKILLS,
  EDUTEST_SUB_SKILLS,
  ACER_SUB_SKILLS
} from '../../src/data/curriculumData_v2';

const testTypesToCheck = {
  'VIC Selective': VIC_SELECTIVE_SUB_SKILLS,
  'Year 7 NAPLAN': NAPLAN_YEAR7_SUB_SKILLS,
  'Year 5 NAPLAN': NAPLAN_YEAR5_SUB_SKILLS,
  'NSW Selective': NSW_SELECTIVE_SUB_SKILLS,
  'EduTest': EDUTEST_SUB_SKILLS,
  'ACER': ACER_SUB_SKILLS
};

const WORD_THRESHOLD = 80; // Explanations over 80 words are suspicious

interface LongExplanation {
  test: string;
  section: string;
  subSkill: string;
  wordCount: number;
  explanation: string;
  questionText: string;
}

const longExplanations: LongExplanation[] = [];

for (const [testType, sections] of Object.entries(testTypesToCheck)) {
  for (const [sectionName, sectionData] of Object.entries(sections)) {
    if (typeof sectionData !== 'object' || !sectionData) continue;

    for (const [subSkillName, subSkillData] of Object.entries(sectionData)) {
      if (typeof subSkillData !== 'object' || !subSkillData || !subSkillData.examples) continue;

      for (const example of subSkillData.examples) {
        if (example.explanation) {
          const wordCount = example.explanation.trim().split(/\s+/).length;

          if (wordCount > WORD_THRESHOLD) {
            longExplanations.push({
              test: testType,
              section: sectionName,
              subSkill: subSkillName,
              wordCount,
              explanation: example.explanation,
              questionText: example.question_text || 'N/A'
            });
          }
        }
      }
    }
  }
}

// Sort by word count descending
longExplanations.sort((a, b) => b.wordCount - a.wordCount);

console.log(`\n🔍 Found ${longExplanations.length} examples with explanations over ${WORD_THRESHOLD} words\n`);

if (longExplanations.length === 0) {
  console.log('✅ All explanations are concise.\n');
  process.exit(0);
}

console.log('These may indicate hallucinated/impossible questions:\n');

for (const item of longExplanations) {
  console.log(`${'='.repeat(80)}`);
  console.log(`${item.test} > ${item.section} > ${item.subSkill}`);
  console.log(`Word count: ${item.wordCount}`);
  console.log(`\nQuestion: ${item.questionText.substring(0, 100)}...`);
  console.log(`\nExplanation: ${item.explanation.substring(0, 200)}...`);
  console.log();
}

console.log(`\nTotal: ${longExplanations.length} examples need review\n`);
