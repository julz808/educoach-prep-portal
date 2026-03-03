/**
 * Verify actual question counts in questions_v2
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyActualCounts() {
  console.log('🔍 Verifying Actual Question Counts in questions_v2\n');
  console.log('=' .repeat(80));

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting count:', countError);
    return;
  }

  console.log(`\n📊 TOTAL QUESTIONS IN DATABASE: ${totalCount}\n`);

  // Get all data
  const { data: allData, error: allError } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode, id');

  if (allError) {
    console.error('Error getting all data:', allError);
    return;
  }

  console.log(`Total rows retrieved: ${allData.length}\n`);

  // Get unique test_mode values
  const uniqueModes = new Set(allData.map(q => q.test_mode));
  console.log('Unique test_mode values found:');
  console.log([...uniqueModes].sort());
  console.log();

  // Count by test_type, section_name, and test_mode
  const countMap = new Map<string, number>();

  allData.forEach(row => {
    const key = `${row.test_type}|||${row.section_name}|||${row.test_mode}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  // Group by test type
  const testTypes = [
    'Year 5 NAPLAN',
    'Year 7 NAPLAN',
    'NSW Selective Entry (Year 7 Entry)',
    'VIC Selective Entry (Year 9 Entry)',
    'ACER Scholarship (Year 7 Entry)',
    'EduTest Scholarship (Year 7 Entry)'
  ];

  for (const testType of testTypes) {
    console.log(`\n${'=' .repeat(80)}`);
    console.log(`🎯 ${testType.toUpperCase()}`);
    console.log('=' .repeat(80));

    // Get all sections for this test type
    const sectionsForType = new Set(
      allData
        .filter(q => q.test_type === testType)
        .map(q => q.section_name)
    );

    for (const section of [...sectionsForType].sort()) {
      console.log(`\n📝 ${section}`);
      console.log('-' .repeat(80));

      // Get counts for each mode
      const modes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];

      console.log('Test Mode       | Count');
      console.log('----------------|-------');

      let sectionTotal = 0;
      for (const mode of modes) {
        const key = `${testType}|||${section}|||${mode}`;
        const count = countMap.get(key) || 0;
        sectionTotal += count;
        console.log(`${mode.padEnd(15)} | ${count}`);
      }

      // Also check for 'drill' mode
      const drillKey = `${testType}|||${section}|||drill`;
      const drillCount = countMap.get(drillKey) || 0;
      if (drillCount > 0) {
        console.log(`${'drill'.padEnd(15)} | ${drillCount}`);
        sectionTotal += drillCount;
      }

      console.log(`${'TOTAL'.padEnd(15)} | ${sectionTotal}`);
    }
  }

  // Summary by test mode across all products
  console.log('\n\n' + '=' .repeat(80));
  console.log('📊 SUMMARY BY TEST MODE (All Products)');
  console.log('=' .repeat(80));

  const modeCountMap = new Map<string, number>();
  allData.forEach(row => {
    modeCountMap.set(row.test_mode, (modeCountMap.get(row.test_mode) || 0) + 1);
  });

  console.log('\nTest Mode       | Total Questions');
  console.log('----------------|----------------');
  [...modeCountMap.entries()].sort().forEach(([mode, count]) => {
    console.log(`${mode.padEnd(15)} | ${count}`);
  });

  console.log('\n' + '=' .repeat(80));
  console.log('GRAND TOTAL: ' + allData.length);
  console.log('=' .repeat(80));
}

verifyActualCounts()
  .then(() => {
    console.log('\n✅ Verification complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
