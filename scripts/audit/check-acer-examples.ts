import { ACER_SUB_SKILLS } from '../../src/data/curriculumData_v2/acer';

console.log('🔍 Analyzing ACER Humanities Examples by Difficulty\n');
console.log('═══════════════════════════════════════════════════════\n');

const humanitiesSection = ACER_SUB_SKILLS['ACER Scholarship (Year 7 Entry) - Humanities'];

for (const [subSkill, data] of Object.entries(humanitiesSection)) {
  const exampleCounts = {
    1: 0,
    2: 0,
    3: 0
  };

  data.examples.forEach(ex => {
    exampleCounts[ex.difficulty as 1 | 2 | 3]++;
  });

  const total = exampleCounts[1] + exampleCounts[2] + exampleCounts[3];
  const easyPct = ((exampleCounts[1] / total) * 100).toFixed(0);
  const medPct = ((exampleCounts[2] / total) * 100).toFixed(0);
  const hardPct = ((exampleCounts[3] / total) * 100).toFixed(0);

  console.log(`${subSkill}:`);
  console.log(`  Difficulty Range: [${data.difficulty_range.join(', ')}]`);
  console.log(`  Examples: ${exampleCounts[1]} Easy, ${exampleCounts[2]} Medium, ${exampleCounts[3]} Hard (${total} total)`);
  console.log(`  Distribution: ${easyPct}% Easy, ${medPct}% Medium, ${hardPct}% Hard`);
  console.log('');
}

console.log('═══════════════════════════════════════════════════════\n');
console.log('ROOT CAUSE ANALYSIS:\n');
console.log('If most sub-skills only have difficulty 2-3 examples,');
console.log('the V2 engine will generate mostly Medium/Hard questions.');
console.log('But if the engine is defaulting to Easy when uncertain,');
console.log('that would explain 85-97% Easy questions in the output.\n');
