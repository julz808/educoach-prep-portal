#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check all distinct product types
  const { data: types, error } = await supabase
    .from('questions_v2')
    .select('product_type, test_type');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const uniqueProducts = [...new Set(types?.map(t => t.product_type))];
  console.log('All product types found:');
  uniqueProducts.sort().forEach(type => {
    console.log(`  - ${type}`);
  });

  // Check for VIC Selective
  const { data: vicData, error: vicError } = await supabase
    .from('questions_v2')
    .select('*')
    .like('product_type', '%VIC%')
    .limit(3);

  if (vicError) {
    console.error('Error:', vicError);
    return;
  }

  console.log('\nVIC related questions:');
  console.log(JSON.stringify(vicData, null, 2));
}

main();
