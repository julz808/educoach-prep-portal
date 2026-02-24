import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';

const passageBasedSections = Object.entries(SECTION_CONFIGURATIONS).filter(
  ([_, config]) => config.section_structure.generation_strategy === 'passage_based'
);

console.log('\n📊 Passage-Based Section Configuration Validation');
console.log('━'.repeat(80));
console.log('');

const issues: string[] = [];

for (const [key, sectionConfig] of passageBasedSections) {
  const passages = sectionConfig.section_structure.passage_blueprint!;
  const targetDistribution: { [subSkill: string]: number } = {};

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

  const totalFromBlueprint = Object.values(targetDistribution).reduce((sum, count) => sum + count, 0);
  const totalFromConfig = sectionConfig.total_questions;
  const mismatch = totalFromConfig - totalFromBlueprint;

  const status = mismatch === 0 ? '✅' : '❌';
  console.log(`${status} ${sectionConfig.test_type} - ${sectionConfig.section_name}`);
  console.log(`   Config: ${totalFromConfig} | Blueprint: ${totalFromBlueprint} | Mismatch: ${mismatch}`);

  if (mismatch !== 0) {
    issues.push(`${sectionConfig.test_type} - ${sectionConfig.section_name}: ${mismatch} question mismatch`);
  }

  console.log('');
}

console.log('━'.repeat(80));
console.log(`\n📋 Summary: ${issues.length === 0 ? '✅ All configurations valid!' : `❌ ${issues.length} issues found`}\n`);

if (issues.length > 0) {
  console.log('Issues:');
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });
}
