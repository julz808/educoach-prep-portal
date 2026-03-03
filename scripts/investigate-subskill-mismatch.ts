/**
 * Investigate sub-skill mismatch for Year 7 NAPLAN Language Conventions
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function investigate() {
  console.log('\n🔍 Investigating Sub-Skill Mismatch...\n');

  // Get configuration
  const configKey = 'Year 7 NAPLAN - Language Conventions';
  const config = SECTION_CONFIGURATIONS[configKey];

  if (!config) {
    console.error('❌ Configuration not found!');
    return;
  }

  console.log('📋 EXPECTED SUB-SKILLS (from configuration):');
  console.log('━'.repeat(80));
  if (config.section_structure.generation_strategy === 'balanced') {
    const subSkills = config.section_structure.balanced_distribution!.sub_skills;
    subSkills.forEach((skill, idx) => {
      console.log(`${idx + 1}. ${skill}`);
    });
    console.log(`\nTotal: ${subSkills.length} sub-skills`);
    console.log(`Expected per sub-skill: ${Math.floor(45 / subSkills.length)}-${Math.ceil(45 / subSkills.length)} questions`);
  }

  console.log('\n');

  // Get actual sub-skills from database
  const { data, error } = await supabase
    .from('questions_v2')
    .select('sub_skill')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Language Conventions');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const actualSubSkills = [...new Set(data.map((row: any) => row.sub_skill))].sort();

  console.log('📊 ACTUAL SUB-SKILLS (in database):');
  console.log('━'.repeat(80));
  actualSubSkills.forEach((skill, idx) => {
    // Count questions for this sub-skill
    const count = data.filter((row: any) => row.sub_skill === skill).length;
    console.log(`${idx + 1}. ${skill} (${count} questions total)`);
  });
  console.log(`\nTotal: ${actualSubSkills.length} sub-skills`);

  console.log('\n');

  // Compare
  const expectedSubSkills = config.section_structure.generation_strategy === 'balanced'
    ? config.section_structure.balanced_distribution!.sub_skills
    : [];

  console.log('❌ MISMATCH ANALYSIS:');
  console.log('━'.repeat(80));

  const missingInDb = expectedSubSkills.filter(skill => !actualSubSkills.includes(skill));
  const extraInDb = actualSubSkills.filter(skill => !expectedSubSkills.includes(skill));

  if (missingInDb.length > 0) {
    console.log('\n⚠️  Sub-skills in CONFIG but NOT in DATABASE:');
    missingInDb.forEach(skill => console.log(`   • ${skill}`));
  }

  if (extraInDb.length > 0) {
    console.log('\n⚠️  Sub-skills in DATABASE but NOT in CONFIG:');
    extraInDb.forEach(skill => console.log(`   • ${skill}`));
  }

  if (missingInDb.length === 0 && extraInDb.length === 0) {
    console.log('✅ Sub-skills match perfectly!');
  }

  console.log('\n');
  console.log('💡 ROOT CAUSE:');
  console.log('━'.repeat(80));
  console.log('The gap detection script uses the configuration to determine how many questions');
  console.log('are needed per sub-skill. However, if the database contains questions with');
  console.log('DIFFERENT sub-skill names than those in the configuration, the script will:');
  console.log('');
  console.log('1. Count 0 questions for expected sub-skills (because they have different names)');
  console.log('2. Think all questions are missing');
  console.log('3. Generate NEW questions with the correct sub-skill names');
  console.log('4. Result: DOUBLE the questions (old + new)');
  console.log('');
  console.log('SOLUTION: Either:');
  console.log('  A) Update configuration to match database sub-skill names, OR');
  console.log('  B) Update database sub-skill names to match configuration, OR');
  console.log('  C) Delete over-generated questions and regenerate with correct names');
  console.log('');
}

investigate().then(() => {
  console.log('✅ Investigation complete\n');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
