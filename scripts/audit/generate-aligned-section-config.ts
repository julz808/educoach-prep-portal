/**
 * Generate Aligned Section Configuration
 *
 * This script reads curriculumData_v2 (SOURCE OF TRUTH) and generates
 * properly aligned section configurations with matching sub-skill names.
 */

import { SUB_SKILL_EXAMPLES } from '../../src/data/curriculumData_v2';

// Extract curriculum structure
const curriculumStructure = new Map<string, Map<string, string[]>>();

for (const [key, sections] of Object.entries(SUB_SKILL_EXAMPLES)) {
  const parts = key.split(' - ');
  const testType = parts[0];
  const sectionName = parts.slice(1).join(' - ');

  if (!curriculumStructure.has(testType)) {
    curriculumStructure.set(testType, new Map());
  }

  const testSections = curriculumStructure.get(testType)!;
  if (!testSections.has(sectionName)) {
    testSections.set(sectionName, []);
  }

  const subSkills = testSections.get(sectionName)!;
  for (const subSkillName of Object.keys(sections)) {
    subSkills.push(subSkillName);
  }
}

console.log('CORRECTED SUB-SKILLS FOR SECTION CONFIGURATIONS');
console.log('================================================\n');
console.log('Copy these into sectionConfigurations.ts\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ACER Humanities - Already fixed, just show for reference
console.log('ACER SCHOLARSHIP (YEAR 7 ENTRY) - HUMANITIES');
console.log('Current sub-skills in curriculum:');
const acerHumanities = curriculumStructure.get('ACER Scholarship (Year 7 Entry)')?.get('Humanities') || [];
acerHumanities.forEach(skill => console.log(`  "${skill}"`));
console.log('\n✅ Already fixed\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// NSW Selective - Reading
console.log('NSW SELECTIVE ENTRY (YEAR 7 ENTRY) - READING');
console.log('Current sub-skills in curriculum:');
const nswReading = curriculumStructure.get('NSW Selective Entry (Year 7 Entry)')?.get('Reading') || [];
nswReading.forEach(skill => console.log(`  "${skill}"`));
console.log('\n❌ NEEDS FIX - Replace with:');
console.log(`
passage_distribution: [
  {
    passage_type: "narrative",
    count: 2,
    word_count_range: [300, 400],
    questions_per_passage: [4, 5],
    sub_skills: [
      "Main Idea & Theme Identification",
      "Inference & Conclusion Drawing",
      "Vocabulary in Context"
    ]
  },
  {
    passage_type: "informational",
    count: 3,
    word_count_range: [250, 350],
    questions_per_passage: 4,
    sub_skills: [
      "Main Idea & Theme Identification",
      "Supporting Details & Evidence Retrieval",
      "Text Structure & Organization"
    ]
  },
  {
    passage_type: "poetry",
    count: 1,
    word_count_range: [100, 200],
    questions_per_passage: 4,
    sub_skills: [
      "Literary Devices & Figurative Language",
      "Author's Purpose & Tone"
    ]
  },
  {
    passage_type: "visual",
    count: 1,
    word_count_range: [0, 50],
    questions_per_passage: [3, 4],
    sub_skills: ["Visual Literacy & Interpretation"]
  }
]
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Year 5 NAPLAN sections
console.log('YEAR 5 NAPLAN - READING');
const y5Reading = curriculumStructure.get('Year 5 NAPLAN')?.get('Reading') || [];
console.log('Current sub-skills in curriculum:');
y5Reading.forEach(skill => console.log(`  "${skill}"`));
console.log('\n❌ NEEDS FIX - Replace with:');
console.log(`
passage_distribution: [
  {
    passage_type: "narrative",
    count: 1,
    word_count_range: [250, 350],
    questions_per_passage: 8,
    sub_skills: [
      "Literal Comprehension",
      "Inferential Comprehension",
      "Vocabulary in Context"
    ]
  },
  {
    passage_type: "informational",
    count: 2,
    word_count_range: [300, 400],
    questions_per_passage: [7, 8],
    sub_skills: [
      "Literal Comprehension",
      "Text Structure & Organization",
      "Vocabulary in Context"
    ]
  },
  {
    passage_type: "persuasive",
    count: 1,
    word_count_range: [250, 350],
    questions_per_passage: 7,
    sub_skills: [
      "Author's Purpose & Perspective",
      "Inferential Comprehension"
    ]
  },
  {
    passage_type: "multimodal",
    count: 1,
    word_count_range: [200, 300],
    questions_per_passage: [7, 9],
    sub_skills: [
      "Visual Literacy & Multimodal Comprehension",
      "Literal Comprehension"
    ]
  }
]
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('YEAR 5 NAPLAN - LANGUAGE CONVENTIONS');
const y5Lang = curriculumStructure.get('Year 5 NAPLAN')?.get('Language Conventions') || [];
console.log('Current sub-skills in curriculum:');
y5Lang.forEach(skill => console.log(`  "${skill}"`));
console.log('\n❌ NEEDS FIX - Replace with:');
console.log(`
balanced_distribution: {
  total_questions: 40,
  sub_skills: [
    "Grammar & Syntax",
    "Punctuation & Capitalization",
    "Spelling Patterns & Rules",
    "Vocabulary & Word Choice"
  ],
  distribution_strategy: "even"
}
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('YEAR 5 NAPLAN - NUMERACY (COMBINED)');
const y5NumNoCalc = curriculumStructure.get('Year 5 NAPLAN')?.get('Numeracy No Calculator') || [];
const y5NumCalc = curriculumStructure.get('Year 5 NAPLAN')?.get('Numeracy Calculator') || [];
console.log('Numeracy No Calculator sub-skills:');
y5NumNoCalc.forEach(skill => console.log(`  "${skill}"`));
console.log('\nNumeracy Calculator sub-skills:');
y5NumCalc.forEach(skill => console.log(`  "${skill}"`));
console.log('\n❌ Config has single "Numeracy" section but curriculum has split sections');
console.log('⚠️  ARCHITECTURAL DECISION NEEDED: Keep split or combine?\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Year 7 NAPLAN
console.log('YEAR 7 NAPLAN - READING');
const y7Reading = curriculumStructure.get('Year 7 NAPLAN')?.get('Reading') || [];
console.log('Current sub-skills in curriculum:');
y7Reading.forEach(skill => console.log(`  "${skill}"`));
console.log('\n❌ NEEDS FIX - Replace with:');
console.log(`
passage_distribution: [
  {
    passage_type: "narrative",
    count: 2,
    word_count_range: [500, 600],
    questions_per_passage: 6,
    sub_skills: [
      "Literal Comprehension",
      "Inferential & Critical Comprehension"
    ]
  },
  {
    passage_type: "informational",
    count: 3,
    word_count_range: [500, 550],
    questions_per_passage: [6, 7],
    sub_skills: [
      "Literal Comprehension",
      "Text Structure & Organization",
      "Author's Purpose & Perspective"
    ]
  },
  {
    passage_type: "persuasive",
    count: 1,
    word_count_range: [450, 550],
    questions_per_passage: 6,
    sub_skills: [
      "Critical Analysis & Evaluation",
      "Inferential & Critical Comprehension"
    ]
  },
  {
    passage_type: "multimodal",
    count: 1,
    word_count_range: [400, 500],
    questions_per_passage: [6, 8],
    sub_skills: [
      "Visual Literacy & Multimodal Integration"
    ]
  }
]
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('YEAR 7 NAPLAN - LANGUAGE CONVENTIONS');
const y7Lang = curriculumStructure.get('Year 7 NAPLAN')?.get('Language Conventions') || [];
console.log('Current sub-skills in curriculum:');
y7Lang.forEach(skill => console.log(`  "${skill}"`));
console.log('\n❌ NEEDS FIX - Replace with:');
console.log(`
balanced_distribution: {
  total_questions: 45,
  sub_skills: [
    "Advanced Grammar & Sentence Structure",
    "Punctuation & Sentence Boundaries",
    "Spelling & Word Formation",
    "Vocabulary Precision & Usage"
  ],
  distribution_strategy: "even"
}
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('YEAR 7 NAPLAN - NUMERACY NO CALCULATOR');
const y7NumNoCalc = curriculumStructure.get('Year 7 NAPLAN')?.get('Numeracy No Calculator') || [];
console.log('Current sub-skills in curriculum:');
y7NumNoCalc.forEach(skill => console.log(`  "${skill}"`));
console.log('\n❌ NEEDS FIX - Replace with:');
console.log(`
balanced_distribution: {
  total_questions: 30,
  sub_skills: [
    "Integer Operations & Negative Numbers",
    "Fractions, Decimals & Percentages",
    "Algebraic Thinking & Patterns",
    "Measurement & Spatial Reasoning",
    "Ratio, Rate & Proportion"
  ],
  distribution_strategy: "even"
}
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('YEAR 7 NAPLAN - NUMERACY CALCULATOR');
const y7NumCalc = curriculumStructure.get('Year 7 NAPLAN')?.get('Numeracy Calculator') || [];
console.log('Current sub-skills in curriculum:');
y7NumCalc.forEach(skill => console.log(`  "${skill}"`));
console.log('\n❌ NEEDS FIX - Replace with:');
console.log(`
balanced_distribution: {
  total_questions: 35,
  sub_skills: [
    "Advanced Problem Solving & Multi-Step Calculations",
    "Advanced Percentages & Financial Mathematics",
    "Advanced Measurement & Geometry",
    "Data Analysis, Statistics & Probability",
    "Complex Multi-Step Problem Solving"
  ],
  distribution_strategy: "even"
}
`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('\n✅ COMPLETE - Apply these changes to sectionConfigurations.ts');
