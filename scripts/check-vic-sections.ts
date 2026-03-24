#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check distinct section names for VIC Selective
  const { data: sections, error: sectionsError } = await supabase
    .from('questions_v2')
    .select('section_name')
    .eq('test_type', 'VIC Selective');

  if (sectionsError) {
    console.error('Error:', sectionsError);
    return;
  }

  const uniqueSections = [...new Set(sections?.map(s => s.section_name))];
  console.log('VIC Selective sections found:');
  console.log(uniqueSections);

  // Check distinct test_modes
  const { data: modes, error: modesError } = await supabase
    .from('questions_v2')
    .select('test_mode')
    .eq('test_type', 'VIC Selective');

  if (modesError) {
    console.error('Error:', modesError);
    return;
  }

  const uniqueModes = [...new Set(modes?.map(m => m.test_mode))];
  console.log('\nVIC Selective test modes found:');
  console.log(uniqueModes);

  // Get count by section and mode
  const { data: all, error: allError } = await supabase
    .from('questions_v2')
    .select('section_name, test_mode')
    .eq('test_type', 'VIC Selective');

  if (allError) {
    console.error('Error:', allError);
    return;
  }

  console.log('\nCounts by section and mode:');
  const counts: { [key: string]: { [key: string]: number } } = {};

  all?.forEach(q => {
    if (!counts[q.section_name]) {
      counts[q.section_name] = {};
    }
    if (!counts[q.section_name][q.test_mode]) {
      counts[q.section_name][q.test_mode] = 0;
    }
    counts[q.section_name][q.test_mode]++;
  });

  Object.keys(counts).sort().forEach(section => {
    console.log(`\n${section}:`);
    Object.keys(counts[section]).sort().forEach(mode => {
      console.log(`  ${mode}: ${counts[section][mode]} questions`);
    });
  });
}

main();
