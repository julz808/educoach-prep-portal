/**
 * Check what's actually in questions_v2
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking questions_v2 table...\n');

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting count:', countError);
    return;
  }

  console.log(`Total questions in questions_v2: ${totalCount}\n`);

  // Get sample of data
  const { data: sampleData, error: sampleError } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode, sub_skill_id')
    .limit(10);

  if (sampleError) {
    console.error('Error getting sample:', sampleError);
    return;
  }

  console.log('Sample data:');
  console.table(sampleData);

  // Get breakdown by test_type
  const { data: allData, error: allError } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode');

  if (allError) {
    console.error('Error getting all data:', allError);
    return;
  }

  // Count by test_type
  const countsByTestType = new Map<string, number>();
  allData.forEach(row => {
    const count = countsByTestType.get(row.test_type) || 0;
    countsByTestType.set(row.test_type, count + 1);
  });

  console.log('\n\nBreakdown by Test Type:');
  console.log('='.repeat(60));
  countsByTestType.forEach((count, testType) => {
    console.log(`${testType}: ${count} questions`);
  });

  // Count by section
  const countsBySection = new Map<string, number>();
  allData.forEach(row => {
    const key = `${row.test_type} - ${row.section_name}`;
    const count = countsBySection.get(key) || 0;
    countsBySection.set(key, count + 1);
  });

  console.log('\n\nBreakdown by Section:');
  console.log('='.repeat(60));
  countsBySection.forEach((count, section) => {
    console.log(`${section}: ${count} questions`);
  });

  // Count by test_mode
  const countsByMode = new Map<string, number>();
  allData.forEach(row => {
    const count = countsByMode.get(row.test_mode) || 0;
    countsByMode.set(row.test_mode, count + 1);
  });

  console.log('\n\nBreakdown by Test Mode:');
  console.log('='.repeat(60));
  countsByMode.forEach((count, mode) => {
    console.log(`${mode}: ${count} questions`);
  });
}

checkData()
  .then(() => {
    console.log('\n✅ Complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
