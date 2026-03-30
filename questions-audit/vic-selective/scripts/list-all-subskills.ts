import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listAllSubSkills() {
  console.log('Fetching all VIC Selective Entry sub-skills...\n');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('sub_skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)');

  if (error) {
    console.error('Error fetching sub-skills:', error);
    return;
  }

  // Get unique sub-skills and count questions
  const subSkillCounts = data.reduce((acc: Record<string, number>, row) => {
    acc[row.sub_skill] = (acc[row.sub_skill] || 0) + 1;
    return acc;
  }, {});

  // Sort by name
  const sorted = Object.entries(subSkillCounts).sort(([a], [b]) => a.localeCompare(b));

  console.log('All Sub-Skills with Question Counts:\n');
  console.log('Total Sub-Skills:', sorted.length);
  console.log('Total Questions:', data.length);
  console.log('\n' + '='.repeat(80) + '\n');

  sorted.forEach(([subSkill, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${subSkill.padEnd(60)} ${count} questions`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\nTotal: ${sorted.length} sub-skills, ${data.length} questions`);
}

listAllSubSkills();
