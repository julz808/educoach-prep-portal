import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkACERHumanities() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('test_mode, sub_skill')
    .eq('test_type', 'ACER Scholarship (Year 7 Entry)')
    .eq('section_name', 'Humanities');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const counts: Record<string, number> = {};
  const bySubSkill: Record<string, Record<string, number>> = {};

  data.forEach(q => {
    counts[q.test_mode] = (counts[q.test_mode] || 0) + 1;

    if (!bySubSkill[q.test_mode]) {
      bySubSkill[q.test_mode] = {};
    }
    bySubSkill[q.test_mode][q.sub_skill] = (bySubSkill[q.test_mode][q.sub_skill] || 0) + 1;
  });

  console.log('\n📊 ACER Humanities - Question Counts by Mode:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const modes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];
  modes.forEach(mode => {
    const count = counts[mode] || 0;
    const status = count >= 35 ? '✅' : '⚠️';
    console.log(`${status} ${mode}: ${count}/35 ${count >= 35 ? '(complete)' : `(need ${35 - count})`}`);
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\nTOTAL: ${total}/210`);
  console.log(`Completion: ${((total / 210) * 100).toFixed(1)}%`);

  console.log('\n📋 Breakdown by Sub-Skill per Mode:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  modes.forEach(mode => {
    console.log(`\n${mode}:`);
    const skills = bySubSkill[mode] || {};
    Object.entries(skills).forEach(([skill, count]) => {
      console.log(`  ${skill}: ${count}`);
    });
  });
}

checkACERHumanities();
