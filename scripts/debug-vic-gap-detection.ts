import { createClient } from '@supabase/supabase-js';
import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const testType = 'VIC Selective Entry (Year 9 Entry)';
const sectionName = 'Reading Reasoning';
const testMode = 'practice_2';

console.log(`\n🔍 Debugging Gap Detection for ${testType} - ${sectionName} - ${testMode}\n`);

// Get configuration
const configKey = `${testType} - ${sectionName}`;
const sectionConfig = SECTION_CONFIGURATIONS[configKey];

if (!sectionConfig) {
  console.error(`No configuration found for ${configKey}`);
  process.exit(1);
}

// Calculate expected distribution
const hybrid = sectionConfig.section_structure.hybrid_blueprint!;
const targetDistribution: Record<string, number> = {};

// Standalone questions
hybrid.standalone_distribution.forEach(item => {
  targetDistribution[item.sub_skill] = item.count;
});

// Passage-based questions
hybrid.passage_distribution.forEach(item => {
  const questionsPerPassage = Array.isArray(item.questions_per_passage)
    ? Math.max(...item.questions_per_passage)
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

console.log('📋 Expected Distribution:');
Object.entries(targetDistribution).sort().forEach(([skill, count]) => {
  console.log(`   ${skill}: ${count}`);
});
console.log(`   TOTAL: ${Object.values(targetDistribution).reduce((a, b) => a + b, 0)}`);
console.log('');

// Get actual questions from database
const { data, error } = await supabase
  .from('questions_v2')
  .select('sub_skill')
  .eq('test_type', testType)
  .eq('section_name', sectionName)
  .eq('test_mode', testMode);

if (error) {
  console.error('Error querying database:', error);
  process.exit(1);
}

const existingCounts: Record<string, number> = {};
data?.forEach((row: any) => {
  existingCounts[row.sub_skill] = (existingCounts[row.sub_skill] || 0) + 1;
});

console.log('📊 Actual Database Counts:');
Object.entries(existingCounts).sort().forEach(([skill, count]) => {
  console.log(`   ${skill}: ${count}`);
});
console.log(`   TOTAL: ${Object.values(existingCounts).reduce((a, b) => a + b, 0)}`);
console.log('');

// Calculate gaps
console.log('🔍 Gap Analysis:');
let totalGaps = 0;
const allSkills = new Set([...Object.keys(targetDistribution), ...Object.keys(existingCounts)]);

for (const skill of Array.from(allSkills).sort()) {
  const target = targetDistribution[skill] || 0;
  const existing = existingCounts[skill] || 0;
  const gap = Math.max(0, target - existing);

  if (gap > 0) {
    console.log(`   ❌ ${skill}: ${existing}/${target} (need ${gap} more)`);
    totalGaps += gap;
  } else if (target === 0) {
    console.log(`   ⚠️  ${skill}: ${existing} (NOT IN CONFIG - over-generated?)`);
  } else {
    console.log(`   ✅ ${skill}: ${existing}/${target} (complete)`);
  }
}

console.log('');
console.log(`📊 Summary:`);
console.log(`   Total Target: ${Object.values(targetDistribution).reduce((a, b) => a + b, 0)}`);
console.log(`   Total Existing: ${Object.values(existingCounts).reduce((a, b) => a + b, 0)}`);
console.log(`   Total Gaps: ${totalGaps}`);
console.log('');
