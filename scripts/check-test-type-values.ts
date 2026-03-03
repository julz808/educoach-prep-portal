import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTestTypes() {
  console.log('Checking test_type values...\n');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('product_type, test_type, test_mode, sub_skill')
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample data:');
  data.forEach((row, i) => {
    console.log(`${i + 1}.`);
    console.log(`   product_type: ${row.product_type}`);
    console.log(`   test_type: ${row.test_type}`);
    console.log(`   test_mode: ${row.test_mode}`);
    console.log(`   sub_skill: ${row.sub_skill}`);
    console.log();
  });

  // Get unique combinations
  const { data: allData } = await supabase
    .from('questions_v2')
    .select('product_type, test_type');

  if (allData) {
    const uniqueCombos = new Set<string>();
    allData.forEach(row => {
      uniqueCombos.add(`${row.product_type} → ${row.test_type}`);
    });

    console.log('\nAll unique product_type → test_type combinations:');
    Array.from(uniqueCombos).sort().forEach(combo => {
      console.log(`  ${combo}`);
    });
  }
}

checkTestTypes().catch(console.error);
