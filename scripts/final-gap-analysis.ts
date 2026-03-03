/**
 * Final Gap Analysis - Compares actual vs expected counts
 * Using correct paginated data
 */

import { createClient } from '@supabase/supabase-js';
import { SECTION_CONFIGURATIONS } from '../src/data/curriculumData_v2/sectionConfigurations';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SectionAnalysis {
  test_type: string;
  section_name: string;
  test_mode: string;
  expected: number;
  actual: number;
  difference: number;
  status: 'under-generated' | 'over-generated' | 'correct';
}

async function getAllQuestions() {
  let allQuestions: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('questions_v2')
      .select('test_type, section_name, test_mode')
      .range(from, to);

    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allQuestions = allQuestions.concat(data);
      if (data.length < pageSize) hasMore = false;
      page++;
    }
  }

  return allQuestions;
}

function getExpectedCount(testType: string, sectionName: string): number {
  const key = `${testType} - ${sectionName}`;
  const config = SECTION_CONFIGURATIONS[key];
  return config ? config.total_questions : 0;
}

async function analyzeGaps() {
  console.log('📊 QUESTION GENERATION GAP ANALYSIS\n');
  console.log('=' .repeat(80));

  const allQuestions = await getAllQuestions();
  console.log(`\n✅ Retrieved ${allQuestions.length} total questions\n`);

  // Count by test_type, section_name, test_mode
  const countMap = new Map<string, number>();
  allQuestions.forEach(row => {
    const key = `${row.test_type}|||${row.section_name}|||${row.test_mode}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  const testTypes = [
    'Year 5 NAPLAN',
    'Year 7 NAPLAN',
    'NSW Selective Entry (Year 7 Entry)',
    'VIC Selective Entry (Year 9 Entry)',
    'ACER Scholarship (Year 7 Entry)',
    'EduTest Scholarship (Year 7 Entry)'
  ];

  const modes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];

  const allAnalyses: SectionAnalysis[] = [];
  const issues: { underGen: SectionAnalysis[], overGen: SectionAnalysis[] } = {
    underGen: [],
    overGen: []
  };

  for (const testType of testTypes) {
    console.log(`\n${'=' .repeat(80)}`);
    console.log(`🎯 ${testType.toUpperCase()}`);
    console.log('=' .repeat(80));

    const sectionsForType = new Set(
      allQuestions
        .filter(q => q.test_type === testType)
        .map(q => q.section_name)
    );

    for (const section of [...sectionsForType].sort()) {
      const expected = getExpectedCount(testType, section);

      console.log(`\n📝 ${section}`);
      console.log(`Expected: ${expected} questions per test`);
      console.log('-' .repeat(80));
      console.log('Test Mode       | Expected | Actual | Difference | Status');
      console.log('----------------|----------|--------|------------|------------------');

      for (const mode of modes) {
        const key = `${testType}|||${section}|||${mode}`;
        const actual = countMap.get(key) || 0;
        const difference = actual - expected;

        let status: 'under-generated' | 'over-generated' | 'correct';
        let emoji: string;

        if (difference < 0) {
          status = 'under-generated';
          emoji = '⚠️ ';
          issues.underGen.push({ test_type: testType, section_name: section, test_mode: mode, expected, actual, difference, status });
        } else if (difference > 0) {
          status = 'over-generated';
          emoji = '🔴';
          issues.overGen.push({ test_type: testType, section_name: section, test_mode: mode, expected, actual, difference, status });
        } else {
          status = 'correct';
          emoji = '✅';
        }

        allAnalyses.push({ test_type: testType, section_name: section, test_mode: mode, expected, actual, difference, status });

        const diffStr = difference > 0 ? `+${difference}` : `${difference}`;
        console.log(
          `${mode.padEnd(15)} | ${String(expected).padStart(8)} | ${String(actual).padStart(6)} | ${diffStr.padStart(10)} | ${emoji} ${status}`
        );
      }
    }
  }

  // Summary
  console.log('\n\n' + '=' .repeat(80));
  console.log('📊 OVERALL SUMMARY');
  console.log('=' .repeat(80));

  const correct = allAnalyses.filter(a => a.status === 'correct').length;

  console.log(`\n✅ Correctly Generated: ${correct} section-modes`);
  console.log(`⚠️  Under-Generated: ${issues.underGen.length} section-modes`);
  console.log(`🔴 Over-Generated: ${issues.overGen.length} section-modes`);

  if (issues.overGen.length > 0) {
    console.log('\n\n🔴 OVER-GENERATED SECTIONS (TOO MANY QUESTIONS):');
    console.log('=' .repeat(80));

    const grouped = new Map<string, SectionAnalysis[]>();
    issues.overGen.forEach(a => {
      const key = `${a.test_type} - ${a.section_name}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(a);
    });

    grouped.forEach((analyses, key) => {
      console.log(`\n${key}`);
      analyses.forEach(a => {
        console.log(`  ${a.test_mode}: ${a.difference} extra questions (has ${a.actual}/${a.expected})`);
      });
    });
  }

  if (issues.underGen.length > 0) {
    console.log('\n\n⚠️  UNDER-GENERATED SECTIONS (NEED MORE QUESTIONS):');
    console.log('=' .repeat(80));

    const grouped = new Map<string, SectionAnalysis[]>();
    issues.underGen.forEach(a => {
      const key = `${a.test_type} - ${a.section_name}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(a);
    });

    grouped.forEach((analyses, key) => {
      console.log(`\n${key}`);
      analyses.forEach(a => {
        console.log(`  ${a.test_mode}: Missing ${Math.abs(a.difference)} questions (has ${a.actual}/${a.expected})`);
      });
    });
  }

  console.log('\n\n' + '=' .repeat(80));
  console.log('📈 TOTAL QUESTION COUNTS');
  console.log('=' .repeat(80));

  const totalExpectedPerTest = Object.values(SECTION_CONFIGURATIONS).reduce((sum: number, config: any) => sum + config.total_questions, 0);
  const totalExpectedAllTests = totalExpectedPerTest * modes.length;
  const totalActual = allQuestions.filter(q => modes.includes(q.test_mode)).length;

  console.log(`\nTotal questions in database (all modes): ${allQuestions.length}`);
  console.log(`Total questions in practice/diagnostic modes: ${totalActual}`);
  console.log(`Expected per complete test set: ${totalExpectedPerTest} questions`);
  console.log(`Expected for all ${modes.length} modes: ${totalExpectedAllTests} questions`);
  console.log(`Difference: ${totalActual - totalExpectedAllTests} questions`);
}

analyzeGaps()
  .then(() => {
    console.log('\n✅ Analysis complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
