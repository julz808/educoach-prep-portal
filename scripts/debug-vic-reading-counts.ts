import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkCounts() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('sub_skill, test_mode')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  const countsByMode: Record<string, Record<string, number>> = {};

  data.forEach(row => {
    if (!countsByMode[row.test_mode]) {
      countsByMode[row.test_mode] = {};
    }
    countsByMode[row.test_mode][row.sub_skill] = (countsByMode[row.test_mode][row.sub_skill] || 0) + 1;
  });

  console.log('VIC Selective Reading Reasoning - Question Counts:\n');

  for (const [mode, counts] of Object.entries(countsByMode)) {
    console.log(`${mode}:`);
    let total = 0;
    for (const [subSkill, count] of Object.entries(counts)) {
      console.log(`  ${subSkill}: ${count}`);
      total += count;
    }
    console.log(`  TOTAL: ${total}\n`);
  }
}

checkCounts();
