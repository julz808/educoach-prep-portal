/**
 * Check actual question counts for Year 7 NAPLAN Language Conventions
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkCounts() {
  console.log('\n🔍 Checking Year 7 NAPLAN Language Conventions question counts...\n');

  // Get counts by test mode
  const { data, error } = await supabase
    .from('questions_v2')
    .select('test_mode, sub_skill')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Language Conventions');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No questions found!\n');
    return;
  }

  // Count by test mode
  const countsByMode: Record<string, number> = {};
  const countsByModeAndSubSkill: Record<string, Record<string, number>> = {};

  for (const row of data) {
    const mode = row.test_mode;
    const subSkill = row.sub_skill;

    countsByMode[mode] = (countsByMode[mode] || 0) + 1;

    if (!countsByModeAndSubSkill[mode]) {
      countsByModeAndSubSkill[mode] = {};
    }
    countsByModeAndSubSkill[mode][subSkill] = (countsByModeAndSubSkill[mode][subSkill] || 0) + 1;
  }

  console.log('📊 COUNTS BY TEST MODE:\n');
  const modes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];

  for (const mode of modes) {
    const count = countsByMode[mode] || 0;
    const target = 45;
    const status = count > target ? '⚠️  OVER-GENERATED' : count === target ? '✅' : '⚠️  UNDER';
    console.log(`${status} ${mode}: ${count}/${target} questions`);

    if (countsByModeAndSubSkill[mode]) {
      const subSkills = Object.entries(countsByModeAndSubSkill[mode]).sort((a, b) => a[0].localeCompare(b[0]));
      for (const [subSkill, count] of subSkills) {
        console.log(`   • ${subSkill}: ${count} questions`);
      }
    }
    console.log('');
  }

  const totalCount = Object.values(countsByMode).reduce((sum, count) => sum + count, 0);
  const totalTarget = 45 * 6; // 45 questions per mode, 6 modes
  console.log(`📊 TOTAL: ${totalCount}/${totalTarget} questions`);
  console.log(`   Over-generated: ${Math.max(0, totalCount - totalTarget)} questions\n`);

  // Find over-generated questions (latest created_at per mode)
  if (totalCount > totalTarget) {
    console.log('🔍 Finding over-generated questions (by created_at)...\n');

    for (const mode of modes) {
      const count = countsByMode[mode] || 0;
      if (count > 45) {
        const overCount = count - 45;

        const { data: modeQuestions, error: modeError } = await supabase
          .from('questions_v2')
          .select('id, created_at, sub_skill')
          .eq('test_type', 'Year 7 NAPLAN')
          .eq('section_name', 'Language Conventions')
          .eq('test_mode', mode)
          .order('created_at', { ascending: false })
          .limit(overCount);

        if (!modeError && modeQuestions) {
          console.log(`${mode}: ${overCount} questions to delete (latest generated):`);
          for (const q of modeQuestions) {
            console.log(`   • ID: ${q.id} | Sub-skill: ${q.sub_skill} | Created: ${q.created_at}`);
          }
          console.log('');
        }
      }
    }
  }
}

checkCounts().then(() => {
  console.log('✅ Check complete\n');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
