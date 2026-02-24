import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';

const config = SECTION_CONFIGURATIONS['Year 7 NAPLAN - Reading'];
const passageBlueprint = config.section_structure.passage_blueprint!;

console.log('\n📚 Year 7 NAPLAN Reading - Passage Type to Sub-Skill Mapping');
console.log('━'.repeat(80));
console.log('');

passageBlueprint.passage_distribution.forEach((spec) => {
  console.log(`${spec.passage_type}:`);
  console.log(`  Count: ${spec.count}`);
  console.log(`  Questions per passage: ${spec.questions_per_passage}`);
  console.log(`  Sub-skills:`);
  spec.sub_skills.forEach((skill: string) => {
    console.log(`    - ${skill}`);
  });
  console.log('');
});

console.log('━'.repeat(80));
console.log('\n✅ These are the CORRECT Year 7 NAPLAN Reading sub-skills');
console.log('   (not the old hardcoded NSW Selective sub-skills)');
console.log('');
