/**
 * Get full counts using SQL aggregation instead of fetching all rows
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getFullCountsByAggregation() {
  console.log('🔍 Getting Full Question Counts via SQL Aggregation\n');
  console.log('=' .repeat(80));

  // Use RPC or direct SQL to get counts
  const { data, error } = await supabase.rpc('get_question_counts_v2', {});

  if (error) {
    console.log('RPC not available, using direct query with aggregation...\n');

    // Alternative: Use Postgres query directly
    const { data: countData, error: countError } = await supabase
      .from('questions_v2')
      .select('test_type, section_name, test_mode', { count: 'exact' });

    if (countError) {
      console.error('Error:', countError);
      return;
    }

    console.log(`Total questions found: ${countData.length}`);

    // Manual aggregation
    const countMap = new Map<string, number>();
    countData.forEach(row => {
      const key = `${row.test_type}|||${row.section_name}|||${row.test_mode}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    // Display results
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
        countData
          .filter(q => q.test_type === testType)
          .map(q => q.section_name)
      );

      for (const section of [...sectionsForType].sort()) {
        console.log(`\n📝 ${section}`);
        console.log('-' .repeat(80));

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

        // Check for drill mode
        const drillKey = `${testType}|||${section}|||drill`;
        const drillCount = countMap.get(drillKey) || 0;
        if (drillCount > 0) {
          console.log(`${'drill'.padEnd(15)} | ${drillCount}`);
          sectionTotal += drillCount;
        }

        console.log(`${'TOTAL'.padEnd(15)} | ${sectionTotal}`);
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log(`GRAND TOTAL: ${countData.length}`);
    console.log('=' .repeat(80));

  } else {
    console.log('Using RPC result:');
    console.log(data);
  }
}

getFullCountsByAggregation()
  .then(() => {
    console.log('\n✅ Complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
