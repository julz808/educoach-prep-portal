/**
 * Check correct sub-skills counts by mode (excluding drill)
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

async function checkByMode() {
  console.log('\n🔍 Checking Correct Sub-Skills by Test Mode...\n');

  // Get correct sub-skills from configuration
  const configKey = 'Year 7 NAPLAN - Language Conventions';
  const config = SECTION_CONFIGURATIONS[configKey];

  if (!config || config.section_structure.generation_strategy !== 'balanced') {
    console.error('❌ Configuration not found!');
    return;
  }

  const correctSubSkills = config.section_structure.balanced_distribution!.sub_skills;

  // Get questions with correct sub-skills
  const { data, error } = await supabase
    .from('questions_v2')
    .select('sub_skill, test_mode')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Language Conventions')
    .in('sub_skill', correctSubSkills);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ CORRECT SUB-SKILLS:');
  correctSubSkills.forEach((skill, idx) => {
    console.log(`${idx + 1}. ${skill}`);
  });

  console.log('\n');

  // Count by test mode
  const modes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];
  const modeTargets: Record<string, number> = {
    practice_1: 45,
    practice_2: 45,
    practice_3: 45,
    practice_4: 45,
    practice_5: 45,
    diagnostic: 45
  };

  console.log('📊 COUNTS BY TEST MODE (correct sub-skills only):');
  console.log('━'.repeat(80));

  let totalPracticeAndDiagnostic = 0;
  let totalDrill = 0;

  for (const mode of modes) {
    const count = data.filter(q => q.test_mode === mode).length;
    const target = modeTargets[mode];
    const diff = count - target;
    const status = diff === 0 ? '✅' : diff > 0 ? '⚠️  OVER' : '⚠️  UNDER';

    console.log(`${status} ${mode}: ${count}/${target} (${diff >= 0 ? '+' : ''}${diff})`);
    totalPracticeAndDiagnostic += count;
  }

  // Check drill mode separately
  const drillCount = data.filter(q => q.test_mode === 'drill').length;
  totalDrill = drillCount;

  console.log(`\n📝 drill: ${drillCount} questions (not counted in target)`);

  console.log('\n');
  console.log('📊 SUMMARY:');
  console.log('━'.repeat(80));
  console.log(`Practice & Diagnostic modes: ${totalPracticeAndDiagnostic}/${modes.length * 45} questions`);
  console.log(`Drill mode: ${totalDrill} questions`);
  console.log(`Total (with correct sub-skills): ${totalPracticeAndDiagnostic + totalDrill} questions`);
  console.log('');

  const totalTarget = modes.length * 45;
  if (totalPracticeAndDiagnostic > totalTarget) {
    console.log(`⚠️  ${totalPracticeAndDiagnostic - totalTarget} over-generated questions (even with correct sub-skills)`);
  } else if (totalPracticeAndDiagnostic < totalTarget) {
    console.log(`⚠️  ${totalTarget - totalPracticeAndDiagnostic} questions still needed`);
  } else {
    console.log(`✅ Exactly the right number of questions!`);
  }
  console.log('');

  return { totalPracticeAndDiagnostic, totalDrill, modes };
}

checkByMode().then(() => {
  console.log('✅ Check complete\n');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
