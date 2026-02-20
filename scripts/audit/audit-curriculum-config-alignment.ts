/**
 * Audit Curriculum Data v2 and Section Configurations Alignment
 *
 * This script ensures that:
 * 1. All test types in curriculum data have corresponding section configurations
 * 2. All sub-skill names match exactly between curriculum data and section configs
 * 3. Section configurations only reference sub-skills that exist in curriculum data
 *
 * Curriculum Data v2 is the SOURCE OF TRUTH
 */

import { SUB_SKILL_EXAMPLES } from '../../src/data/curriculumData_v2';
import { SECTION_CONFIGURATIONS } from '../../src/data/curriculumData_v2/sectionConfigurations';

interface AuditResult {
  testType: string;
  section: string;
  issues: string[];
  curriculumSubSkills: string[];
  configSubSkills: string[];
}

interface Summary {
  totalTests: number;
  totalSections: number;
  sectionsWithIssues: number;
  totalIssues: number;
  results: AuditResult[];
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 CURRICULUM DATA v2 & SECTION CONFIGURATION ALIGNMENT AUDIT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 1: Extract all test types and sections from curriculum data (SOURCE OF TRUTH)
const curriculumStructure = new Map<string, Map<string, Set<string>>>();

console.log('📚 STEP 1: Extracting structure from Curriculum Data v2 (SOURCE OF TRUTH)...\n');

for (const [key, sections] of Object.entries(SUB_SKILL_EXAMPLES)) {
  // Key format: "TestType - SectionName"
  const parts = key.split(' - ');
  if (parts.length < 2) {
    console.log(`⚠️  Skipping malformed key: "${key}"`);
    continue;
  }

  const testType = parts[0];
  const sectionName = parts.slice(1).join(' - '); // Handle sections with hyphens in name

  if (!curriculumStructure.has(testType)) {
    curriculumStructure.set(testType, new Map());
  }

  const testSections = curriculumStructure.get(testType)!;
  if (!testSections.has(sectionName)) {
    testSections.set(sectionName, new Set());
  }

  // Extract sub-skill names
  const subSkills = testSections.get(sectionName)!;
  for (const subSkillName of Object.keys(sections)) {
    subSkills.add(subSkillName);
  }
}

// Display curriculum structure
console.log('✅ Curriculum Data Structure:\n');
for (const [testType, sections] of curriculumStructure) {
  console.log(`   📋 ${testType}`);
  for (const [sectionName, subSkills] of sections) {
    console.log(`      └─ ${sectionName} (${subSkills.size} sub-skills)`);
  }
}
console.log('');

// Step 2: Extract section configurations
console.log('🔧 STEP 2: Extracting Section Configurations...\n');

const configStructure = new Map<string, Map<string, Set<string>>>();

for (const [configKey, config] of Object.entries(SECTION_CONFIGURATIONS)) {
  // Key format: "TestType - SectionName"
  const parts = configKey.split(' - ');
  if (parts.length < 2) {
    console.log(`⚠️  Skipping malformed config key: "${configKey}"`);
    continue;
  }

  const testType = parts[0];
  const sectionName = parts.slice(1).join(' - ');

  if (!configStructure.has(testType)) {
    configStructure.set(testType, new Map());
  }

  const testSections = configStructure.get(testType)!;
  if (!testSections.has(sectionName)) {
    testSections.set(sectionName, new Set());
  }

  const subSkills = testSections.get(sectionName)!;

  // Extract sub-skills based on generation strategy
  const structure = config.section_structure;

  if (structure.generation_strategy === 'balanced' && structure.balanced_distribution) {
    structure.balanced_distribution.sub_skills.forEach((skill: string) => subSkills.add(skill));
  } else if (structure.generation_strategy === 'passage_based' && structure.passage_blueprint) {
    structure.passage_blueprint.passage_distribution.forEach((passage: any) => {
      passage.sub_skills.forEach((skill: string) => subSkills.add(skill));
    });
  } else if (structure.generation_strategy === 'hybrid' && structure.hybrid_blueprint) {
    // Standalone sub-skills
    if (structure.hybrid_blueprint.standalone_distribution) {
      structure.hybrid_blueprint.standalone_distribution.forEach((item: any) => {
        subSkills.add(item.sub_skill);
      });
    }
    // Passage-based sub-skills
    if (structure.hybrid_blueprint.passage_distribution) {
      structure.hybrid_blueprint.passage_distribution.forEach((passage: any) => {
        passage.sub_skills.forEach((skill: string) => subSkills.add(skill));
      });
    }
  } else if (structure.generation_strategy === 'writing_prompt' && structure.prompt_types) {
    // Writing sections - add prompt types as sub-skills
    structure.prompt_types.forEach((type: string) => subSkills.add(type));
  }
}

console.log('✅ Section Configuration Structure:\n');
for (const [testType, sections] of configStructure) {
  console.log(`   📋 ${testType}`);
  for (const [sectionName, subSkills] of sections) {
    console.log(`      └─ ${sectionName} (${subSkills.size} sub-skills)`);
  }
}
console.log('');

// Step 3: Compare and find mismatches
console.log('🔍 STEP 3: Comparing Curriculum Data (SOURCE) vs Section Configs...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const results: AuditResult[] = [];

// Check every section in curriculum data
for (const [testType, curriculumSections] of curriculumStructure) {
  const configSections = configStructure.get(testType);

  for (const [sectionName, curriculumSubSkills] of curriculumSections) {
    const issues: string[] = [];
    const curriculumSkillsArray = Array.from(curriculumSubSkills).sort();
    let configSkillsArray: string[] = [];

    // Check if section config exists
    if (!configSections) {
      issues.push(`❌ Test type "${testType}" not found in section configurations`);
    } else if (!configSections.has(sectionName)) {
      issues.push(`❌ Section "${sectionName}" not found in configurations for "${testType}"`);
    } else {
      const configSubSkills = configSections.get(sectionName)!;
      configSkillsArray = Array.from(configSubSkills).sort();

      // Check for sub-skills in config that don't exist in curriculum
      for (const configSkill of configSubSkills) {
        if (!curriculumSubSkills.has(configSkill)) {
          issues.push(`❌ Sub-skill "${configSkill}" in config does NOT exist in curriculum data`);
        }
      }

      // Check for sub-skills in curriculum that aren't referenced in config (warning, not error)
      for (const curriculumSkill of curriculumSubSkills) {
        if (!configSubSkills.has(curriculumSkill)) {
          issues.push(`⚠️  Sub-skill "${curriculumSkill}" exists in curriculum but NOT referenced in config`);
        }
      }
    }

    results.push({
      testType,
      section: sectionName,
      issues,
      curriculumSubSkills: curriculumSkillsArray,
      configSubSkills: configSkillsArray
    });
  }
}

// Check for sections in config that don't exist in curriculum
for (const [testType, configSections] of configStructure) {
  const curriculumSections = curriculumStructure.get(testType);

  if (!curriculumSections) {
    results.push({
      testType,
      section: '(all sections)',
      issues: [`❌ Test type "${testType}" exists in config but NOT in curriculum data`],
      curriculumSubSkills: [],
      configSubSkills: []
    });
    continue;
  }

  for (const [sectionName, configSubSkills] of configSections) {
    if (!curriculumSections.has(sectionName)) {
      results.push({
        testType,
        section: sectionName,
        issues: [`❌ Section "${sectionName}" exists in config but NOT in curriculum data`],
        curriculumSubSkills: [],
        configSubSkills: Array.from(configSubSkills).sort()
      });
    }
  }
}

// Display results
let sectionsWithIssues = 0;
let totalIssues = 0;

for (const result of results) {
  if (result.issues.length > 0) {
    sectionsWithIssues++;
    totalIssues += result.issues.length;

    console.log(`📋 ${result.testType} - ${result.section}`);
    console.log(`   Issues: ${result.issues.length}`);
    result.issues.forEach(issue => console.log(`   ${issue}`));

    if (result.curriculumSubSkills.length > 0) {
      console.log(`   \n   📚 Curriculum Sub-Skills (${result.curriculumSubSkills.length}):`);
      result.curriculumSubSkills.forEach(skill => console.log(`      ✓ ${skill}`));
    }

    if (result.configSubSkills.length > 0) {
      console.log(`   \n   🔧 Config Sub-Skills (${result.configSubSkills.length}):`);
      result.configSubSkills.forEach(skill => console.log(`      → ${skill}`));
    }

    console.log('');
  }
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 AUDIT SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const totalTests = curriculumStructure.size;
const totalSections = results.length;

console.log(`   Total Test Types: ${totalTests}`);
console.log(`   Total Sections: ${totalSections}`);
console.log(`   Sections with Issues: ${sectionsWithIssues}`);
console.log(`   Total Issues Found: ${totalIssues}\n`);

if (totalIssues === 0) {
  console.log('   ✅ ALL SECTIONS ALIGNED! Curriculum Data v2 matches Section Configurations perfectly.\n');
} else {
  console.log(`   ⚠️  ${totalIssues} issues found across ${sectionsWithIssues} sections.\n`);
  console.log('   📝 ACTION REQUIRED: Update sectionConfigurations.ts to match curriculum data.\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Exit with error code if issues found
if (totalIssues > 0) {
  process.exit(1);
}
