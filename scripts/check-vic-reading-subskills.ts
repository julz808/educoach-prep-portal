import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const { data, error } = await supabase
  .from('questions_v2')
  .select('test_mode, sub_skill')
  .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
  .eq('section_name', 'Reading Reasoning');

if (error) {
  console.error('Error:', error);
} else {
  const counts: Record<string, number> = {};
  data.forEach((row: any) => {
    const key = `${row.test_mode} - ${row.sub_skill}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  console.log('VIC Selective Reading Reasoning - Question Counts by Test Mode and Sub-Skill:');
  console.log('');
  Object.entries(counts).sort().forEach(([key, count]) => {
    console.log(`${key}: ${count}`);
  });

  // Show unique sub-skills
  const subSkills = new Set(data.map((row: any) => row.sub_skill));
  console.log('\nUnique sub-skills in database:');
  Array.from(subSkills).sort().forEach(skill => console.log(`  - ${skill}`));
}
