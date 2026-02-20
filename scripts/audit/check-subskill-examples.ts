/**
 * Check if all sub-skills referenced in section configs have examples in curriculum data
 */

import { SUB_SKILL_EXAMPLES } from '../../src/data/curriculumData_v2';
import { SECTION_CONFIGURATIONS } from '../../src/data/curriculumData_v2/sectionConfigurations';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 CHECKING SUB-SKILL EXAMPLES COVERAGE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let totalSubSkills = 0;
let subSkillsWithExamples = 0;
let subSkillsWithoutExamples = 0;
const missingExamples: Array<{ test: string; section: string; subSkill: string }> = [];

for (const [configKey, config] of Object.entries(SECTION_CONFIGURATIONS)) {
  const parts = configKey.split(' - ');
  const testType = parts[0];
  const sectionName = parts.slice(1).join(' - ');

  const curriculumKey = `${testType} - ${sectionName}`;
  const curriculumSection = SUB_SKILL_EXAMPLES[curriculumKey];

  if (!curriculumSection) {
    continue; // Section not in curriculum (e.g., might be a config-only entry)
  }

  // Extract sub-skills from config
  const configSubSkills = new Set<string>();
  const structure = config.section_structure;

  if (structure.generation_strategy === 'balanced' && structure.balanced_distribution) {
    structure.balanced_distribution.sub_skills.forEach((skill: string) => configSubSkills.add(skill));
  } else if (structure.generation_strategy === 'passage_based' && structure.passage_blueprint) {
    structure.passage_blueprint.passage_distribution.forEach((passage: any) => {
      passage.sub_skills.forEach((skill: string) => configSubSkills.add(skill));
    });
  } else if (structure.generation_strategy === 'hybrid' && structure.hybrid_blueprint) {
    if (structure.hybrid_blueprint.standalone_distribution) {
      structure.hybrid_blueprint.standalone_distribution.forEach((item: any) => {
        configSubSkills.add(item.sub_skill);
      });
    }
    if (structure.hybrid_blueprint.passage_distribution) {
      structure.hybrid_blueprint.passage_distribution.forEach((passage: any) => {
        passage.sub_skills.forEach((skill: string) => configSubSkills.add(skill));
      });
    }
  }

  // Check each sub-skill for examples
  for (const subSkill of configSubSkills) {
    totalSubSkills++;

    if (curriculumSection[subSkill]) {
      const examples = curriculumSection[subSkill].examples || [];
      if (examples.length > 0) {
        subSkillsWithExamples++;
      } else {
        subSkillsWithoutExamples++;
        missingExamples.push({ test: testType, section: sectionName, subSkill });
      }
    } else {
      subSkillsWithoutExamples++;
      missingExamples.push({ test: testType, section: sectionName, subSkill });
    }
  }
}

console.log(`📊 SUMMARY:\n`);
console.log(`   Total Sub-Skills in Configs: ${totalSubSkills}`);
console.log(`   ✅ With Examples: ${subSkillsWithExamples} (${((subSkillsWithExamples/totalSubSkills)*100).toFixed(1)}%)`);
console.log(`   ❌ Without Examples: ${subSkillsWithoutExamples} (${((subSkillsWithoutExamples/totalSubSkills)*100).toFixed(1)}%)\n`);

if (missingExamples.length > 0) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ SUB-SKILLS WITHOUT EXAMPLES:\n');

  const byTest = new Map<string, typeof missingExamples>();
  for (const item of missingExamples) {
    const key = `${item.test} - ${item.section}`;
    if (!byTest.has(key)) {
      byTest.set(key, []);
    }
    byTest.get(key)!.push(item);
  }

  for (const [key, items] of byTest) {
    console.log(`📋 ${key}`);
    items.forEach(item => console.log(`   ❌ ${item.subSkill}`));
    console.log('');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (subSkillsWithoutExamples === 0) {
  console.log('✅ ALL SUB-SKILLS HAVE EXAMPLES!\n');
  process.exit(0);
} else {
  process.exit(1);
}
