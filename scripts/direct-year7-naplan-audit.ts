/**
 * Direct audit of Year 7 NAPLAN Language Conventions for sub-skill mismatches
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

async function auditYear7NAPLANLanguageConventions() {
  console.log('\n🔍 Year 7 NAPLAN Language Conventions Sub-Skill Audit\n');

  const configKey = 'Year 7 NAPLAN - Language Conventions';
  const config = SECTION_CONFIGURATIONS[configKey];

  if (!config || config.section_structure.generation_strategy !== 'balanced') {
    console.error('❌ Configuration not found or not balanced!');
    return;
  }

  const expectedSubSkills = config.section_structure.balanced_distribution!.sub_skills;

  console.log('✅ EXPECTED SUB-SKILLS (from configuration):');
  expectedSubSkills.forEach((skill, idx) => {
    console.log(`${idx + 1}. ${skill}`);
  });
  console.log('');

  // Get ALL Year 7 NAPLAN Language Conventions questions
  let allQuestions: any[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('sub_skill, test_mode')
      .eq('test_type', 'Year 7 NAPLAN')
      .eq('section_name', 'Language Conventions')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    allQuestions = allQuestions.concat(data);
    offset += batchSize;

    if (data.length < batchSize) {
      break;  // Last batch
    }
  }

  console.log(`📊 Loaded ${allQuestions.length} questions total\n`);

  // Analyze sub-skills
  const actualSubSkills = Array.from(new Set(allQuestions.map(q => q.sub_skill))).sort();
  const correctSubSkills = actualSubSkills.filter(s => expectedSubSkills.includes(s));
  const oldSubSkills = actualSubSkills.filter(s => !expectedSubSkills.includes(s));

  const questionsWithCorrectNames = allQuestions.filter(q => expectedSubSkills.includes(q.sub_skill)).length;
  const questionsWithOldNames = allQuestions.filter(q => !expectedSubSkills.includes(q.sub_skill)).length;

  console.log('📋 RESULTS:');
  console.log(`  Total questions: ${allQuestions.length}`);
  console.log(`  Questions with CORRECT sub-skill names: ${questionsWithCorrectNames}`);
  console.log(`  Questions with OLD/INCORRECT sub-skill names: ${questionsWithOldNames}`);
  console.log('');

  if (oldSubSkills.length > 0) {
    console.log('❌ OLD/INCORRECT SUB-SKILLS FOUND:');
    oldSubSkills.forEach(skill => {
      const count = allQuestions.filter(q => q.sub_skill === skill).length;
      console.log(`  • "${skill}" (${count} questions)`);
    });
    console.log('');
  }

  console.log('✅ CORRECT SUB-SKILLS:');
  correctSubSkills.forEach(skill => {
    const count = allQuestions.filter(q => q.sub_skill === skill).length;
    console.log(`  • "${skill}" (${count} questions)`);
  });
  console.log('');

  if (oldSubSkills.length > 0) {
    console.log('⚠️  ACTION REQUIRED:');
    console.log(`  Delete ${questionsWithOldNames} questions with old sub-skill names`);
    console.log('  Use: delete-old-subskill-names-year7-language-conventions.sql');
    console.log('');
  } else {
    console.log('✅ ALL CLEAR! All sub-skill names match configuration.');
    console.log('');
  }
}

auditYear7NAPLANLanguageConventions().then(() => {
  console.log('✅ Audit complete\n');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
