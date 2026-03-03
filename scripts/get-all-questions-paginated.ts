/**
 * Get ALL questions with pagination to avoid 1000 row limit
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllQuestionsPaginated() {
  console.log('🔍 Fetching ALL questions with pagination\n');
  console.log('=' .repeat(80));

  let allQuestions: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log(`Fetching rows ${from} to ${to}...`);

    const { data, error } = await supabase
      .from('questions_v2')
      .select('test_type, section_name, test_mode')
      .range(from, to);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allQuestions = allQuestions.concat(data);
      console.log(`  Retrieved ${data.length} rows (total so far: ${allQuestions.length})`);

      if (data.length < pageSize) {
        hasMore = false;
      }

      page++;
    }
  }

  console.log(`\n✅ Retrieved ${allQuestions.length} total questions\n`);
  console.log('=' .repeat(80));

  // Now aggregate the counts
  const countMap = new Map<string, number>();
  allQuestions.forEach(row => {
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
      allQuestions
        .filter(q => q.test_type === testType)
        .map(q => q.section_name)
    );

    if (sectionsForType.size === 0) {
      console.log('\n⚠️  No questions found for this test type\n');
      continue;
    }

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

      console.log(`${'-'.repeat(16)}|${'-'.repeat(7)}`);
      console.log(`${'TOTAL'.padEnd(15)} | ${sectionTotal}`);
    }
  }

  // Summary by mode
  console.log('\n\n' + '=' .repeat(80));
  console.log('📊 SUMMARY BY TEST MODE (All Products)');
  console.log('=' .repeat(80));

  const modeCountMap = new Map<string, number>();
  allQuestions.forEach(row => {
    modeCountMap.set(row.test_mode, (modeCountMap.get(row.test_mode) || 0) + 1);
  });

  console.log('\nTest Mode       | Total Questions');
  console.log('----------------|----------------');
  [...modeCountMap.entries()].sort().forEach(([mode, count]) => {
    console.log(`${mode.padEnd(15)} | ${count}`);
  });

  console.log('\n' + '=' .repeat(80));
  console.log(`GRAND TOTAL: ${allQuestions.length} questions`);
  console.log('=' .repeat(80));
}

getAllQuestionsPaginated()
  .then(() => {
    console.log('\n✅ Complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
