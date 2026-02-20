import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualData() {
  console.log('📊 Checking actual data in questions_v2...\n');

  // Get unique test_type values
  const { data: testTypes, error: testTypesError } = await supabase
    .from('questions_v2')
    .select('test_type')
    .limit(1000);

  if (testTypesError) {
    console.error('Error:', testTypesError);
    return;
  }

  const uniqueTestTypes = [...new Set(testTypes?.map(t => t.test_type) || [])];
  console.log('Unique test_type values:');
  uniqueTestTypes.forEach(tt => console.log(`  - ${tt}`));

  // Get sample data
  console.log('\n📝 Sample data (first 10 rows):');
  const { data: sample, error: sampleError } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode, sub_skill')
    .limit(10);

  if (sampleError) {
    console.error('Error:', sampleError);
    return;
  }

  console.table(sample);

  // Get counts by test_type
  const { data: allData, error: allError } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode');

  if (allError) {
    console.error('Error:', allError);
    return;
  }

  const counts: Record<string, Record<string, Record<string, number>>> = {};

  for (const row of allData || []) {
    if (!counts[row.test_type]) counts[row.test_type] = {};
    if (!counts[row.test_type][row.section_name]) counts[row.test_type][row.section_name] = {};
    if (!counts[row.test_type][row.section_name][row.test_mode]) counts[row.test_type][row.section_name][row.test_mode] = 0;
    counts[row.test_type][row.section_name][row.test_mode]++;
  }

  console.log('\n📊 Counts by test_type, section_name, test_mode:');
  for (const [testType, sections] of Object.entries(counts)) {
    console.log(`\n${testType}:`);
    for (const [section, modes] of Object.entries(sections)) {
      console.log(`  ${section}:`);
      for (const [mode, count] of Object.entries(modes)) {
        console.log(`    ${mode}: ${count}`);
      }
    }
  }
}

checkActualData().catch(console.error);
