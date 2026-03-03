import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking questions_v2 columns...\n');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Available columns:');
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof data[0][key]} = ${JSON.stringify(data[0][key]).substring(0, 50)}`);
    });
  }

  // Now check the actual grouping
  console.log('\n\nChecking actual data structure:');
  const { data: sample } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode, product_type')
    .limit(10);

  if (sample) {
    console.log('\nSample rows:');
    sample.forEach((row, i) => {
      console.log(`${i + 1}.`);
      console.log(`   test_type: ${row.test_type}`);
      console.log(`   section_name: ${row.section_name}`);
      console.log(`   product_type: ${row.product_type}`);
      console.log(`   test_mode: ${row.test_mode}`);
    });
  }
}

checkColumns().catch(console.error);
