/**
 * Identify correct (new) vs old sub-skill names for Year 7 NAPLAN Language Conventions
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

async function identifySubSkills() {
  console.log('\n🔍 Identifying Correct vs Old Sub-Skill Names...\n');

  // Get correct sub-skills from configuration
  const configKey = 'Year 7 NAPLAN - Language Conventions';
  const config = SECTION_CONFIGURATIONS[configKey];

  if (!config || config.section_structure.generation_strategy !== 'balanced') {
    console.error('❌ Configuration not found or not balanced!');
    return;
  }

  const correctSubSkills = config.section_structure.balanced_distribution!.sub_skills;

  console.log('✅ CORRECT SUB-SKILLS (from curriculumData_v2 configuration):');
  console.log('━'.repeat(80));
  correctSubSkills.forEach((skill, idx) => {
    console.log(`${idx + 1}. "${skill}"`);
  });

  console.log('\n');

  // Get all sub-skills from database
  const { data, error } = await supabase
    .from('questions_v2')
    .select('sub_skill, test_mode')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Language Conventions');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Count by sub-skill and mode
  const subSkillCounts: Record<string, { total: number; byMode: Record<string, number> }> = {};

  for (const row of data) {
    const skill = row.sub_skill;
    const mode = row.test_mode;

    if (!subSkillCounts[skill]) {
      subSkillCounts[skill] = { total: 0, byMode: {} };
    }

    subSkillCounts[skill].total++;
    subSkillCounts[skill].byMode[mode] = (subSkillCounts[skill].byMode[mode] || 0) + 1;
  }

  // Separate correct vs old sub-skills
  const correctInDb: string[] = [];
  const oldInDb: string[] = [];

  Object.keys(subSkillCounts).forEach(skill => {
    if (correctSubSkills.includes(skill)) {
      correctInDb.push(skill);
    } else {
      oldInDb.push(skill);
    }
  });

  console.log('✅ CORRECT Sub-Skills Found in Database:');
  console.log('━'.repeat(80));
  correctInDb.forEach(skill => {
    const counts = subSkillCounts[skill];
    console.log(`"${skill}"`);
    console.log(`   Total: ${counts.total} questions`);
    console.log(`   By mode:`, counts.byMode);
    console.log('');
  });

  console.log('❌ OLD/INCORRECT Sub-Skills Found in Database (TO BE DELETED):');
  console.log('━'.repeat(80));
  let totalToDelete = 0;
  oldInDb.forEach(skill => {
    const counts = subSkillCounts[skill];
    totalToDelete += counts.total;
    console.log(`"${skill}"`);
    console.log(`   Total: ${counts.total} questions`);
    console.log(`   By mode:`, counts.byMode);
    console.log('');
  });

  console.log('📊 SUMMARY:');
  console.log('━'.repeat(80));
  console.log(`Total questions in database: ${data.length}`);
  console.log(`Questions with CORRECT sub-skill names: ${correctInDb.reduce((sum, skill) => sum + subSkillCounts[skill].total, 0)}`);
  console.log(`Questions with OLD sub-skill names (to delete): ${totalToDelete}`);
  console.log(`After deletion: ${data.length - totalToDelete} questions remaining`);
  console.log('');

  // Check if we'll have the right number after deletion
  const target = 45 * 6; // 45 questions per mode, 6 modes
  const remaining = data.length - totalToDelete;

  if (remaining < target) {
    console.log(`⚠️  After deletion, we'll have ${remaining}/${target} questions (${target - remaining} short)`);
  } else if (remaining > target) {
    console.log(`⚠️  After deletion, we'll have ${remaining}/${target} questions (${remaining - target} over)`);
  } else {
    console.log(`✅ After deletion, we'll have exactly ${remaining}/${target} questions!`);
  }
  console.log('');

  return { correctSubSkills, oldSubSkills: oldInDb, totalToDelete };
}

identifySubSkills().then(() => {
  console.log('✅ Identification complete\n');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
