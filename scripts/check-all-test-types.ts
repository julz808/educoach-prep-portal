#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check all distinct test types
  const { data: types, error } = await supabase
    .from('questions_v2')
    .select('test_type');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const uniqueTypes = [...new Set(types?.map(t => t.test_type))];
  console.log('All test types found:');
  uniqueTypes.sort().forEach(type => {
    console.log(`  - ${type}`);
  });

  // Get count per test type
  console.log('\nCounts by test type:');
  const counts: { [key: string]: number } = {};
  types?.forEach(t => {
    counts[t.test_type] = (counts[t.test_type] || 0) + 1;
  });

  Object.keys(counts).sort().forEach(type => {
    console.log(`  ${type}: ${counts[type]} questions`);
  });
}

main();
