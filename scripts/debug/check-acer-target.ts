import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';

const configKey = 'ACER Scholarship (Year 7 Entry) - Humanities';
const sectionConfig = SECTION_CONFIGURATIONS[configKey];

console.log('\n📋 ACER Humanities Configuration:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`total_questions from config: ${sectionConfig.total_questions}`);
console.log('');

// Calculate what the script thinks the target is
const targetDistribution: { [subSkill: string]: number } = {};
const passages = sectionConfig.section_structure.passage_blueprint!;

passages.passage_distribution.forEach(item => {
  const questionsPerPassage = Array.isArray(item.questions_per_passage)
    ? Math.floor((item.questions_per_passage[0] + item.questions_per_passage[1]) / 2)
    : item.questions_per_passage;

  const totalQuestionsForThisPassageType = item.count * questionsPerPassage;
  const numSubSkills = item.sub_skills.length;

  console.log(`${item.passage_type}:`);
  console.log(`  Passages: ${item.count}`);
  console.log(`  Questions per passage: ${questionsPerPassage} (${item.questions_per_passage})`);
  console.log(`  Total questions: ${totalQuestionsForThisPassageType}`);
  console.log(`  Sub-skills: ${numSubSkills}`);
  console.log('');

  // Questions rotate through sub-skills, so distribute proportionally
  item.sub_skills.forEach((skill, index) => {
    const baseCount = Math.floor(totalQuestionsForThisPassageType / numSubSkills);
    const remainder = totalQuestionsForThisPassageType % numSubSkills;
    const skillCount = baseCount + (index < remainder ? 1 : 0);

    targetDistribution[skill] = (targetDistribution[skill] || 0) + skillCount;
    console.log(`    ${skill}: +${skillCount}`);
  });
  console.log('');
});

const totalTargetFromDistribution = Object.values(targetDistribution).reduce((sum, count) => sum + count, 0);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Target Distribution Summary:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
Object.entries(targetDistribution).forEach(([skill, count]) => {
  console.log(`  ${skill}: ${count}`);
});

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ total_questions from config: ${sectionConfig.total_questions}`);
console.log(`❌ Total from passage blueprint calculation: ${totalTargetFromDistribution}`);
console.log(`⚠️  MISMATCH: ${sectionConfig.total_questions - totalTargetFromDistribution} questions`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
