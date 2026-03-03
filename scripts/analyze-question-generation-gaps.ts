/**
 * Analyze Question Generation Gaps Across All Products
 *
 * Compares actual questions_v2 counts against section configuration requirements
 * for Practice Tests 1-5 and Diagnostic Test across all 6 products
 */

import { createClient } from '@supabase/supabase-js';
import { SECTION_CONFIGURATIONS } from '../src/data/curriculumData_v2/sectionConfigurations';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// All test types (6 products)
const TEST_TYPES = [
  'Year 5 NAPLAN',
  'Year 7 NAPLAN',
  'NSW Selective Entry (Year 7 Entry)',
  'VIC Selective Entry (Year 9 Entry)',
  'ACER Scholarship (Year 7 Entry)',
  'EduTest Scholarship (Year 7 Entry)'
];

// All test modes
const TEST_MODES = [
  'practice_1',
  'practice_2',
  'practice_3',
  'practice_4',
  'practice_5',
  'diagnostic'
];

interface QuestionCount {
  test_type: string;
  section_name: string;
  test_mode: string;
  count: number;
}

interface SectionAnalysis {
  test_type: string;
  section_name: string;
  test_mode: string;
  expected: number;
  actual: number;
  difference: number;
  status: 'under-generated' | 'over-generated' | 'correct';
}

async function getActualQuestionCounts(): Promise<QuestionCount[]> {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode');

  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }

  // Group and count
  const counts = new Map<string, number>();

  data.forEach(row => {
    const key = `${row.test_type}|||${row.section_name}|||${row.test_mode}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  // Convert to array
  const result: QuestionCount[] = [];
  counts.forEach((count, key) => {
    const [test_type, section_name, test_mode] = key.split('|||');
    result.push({ test_type, section_name, test_mode, count });
  });

  return result;
}

function getExpectedQuestionCount(testType: string, sectionName: string): number {
  const key = `${testType} - ${sectionName}`;
  const config = SECTION_CONFIGURATIONS[key];

  if (!config) {
    console.warn(`⚠️  No configuration found for: ${key}`);
    return 0;
  }

  return config.total_questions;
}

async function analyzeGaps() {
  console.log('📊 Analyzing Question Generation Gaps Across All Products\n');
  console.log('=' .repeat(80));

  // Get actual counts from database
  const actualCounts = await getActualQuestionCounts();

  // Get all unique sections from section configurations
  const allSections = Object.keys(SECTION_CONFIGURATIONS).map(key => {
    const [testType, ...sectionParts] = key.split(' - ');
    const sectionName = sectionParts.join(' - ');
    return { testType, sectionName };
  });

  // Build comprehensive analysis
  const analyses: SectionAnalysis[] = [];

  for (const { testType, sectionName } of allSections) {
    const expected = getExpectedQuestionCount(testType, sectionName);

    for (const testMode of TEST_MODES) {
      const actualCount = actualCounts.find(
        ac => ac.test_type === testType &&
              ac.section_name === sectionName &&
              ac.test_mode === testMode
      );

      const actual = actualCount?.count || 0;
      const difference = actual - expected;

      let status: 'under-generated' | 'over-generated' | 'correct';
      if (difference < 0) {
        status = 'under-generated';
      } else if (difference > 0) {
        status = 'over-generated';
      } else {
        status = 'correct';
      }

      analyses.push({
        test_type: testType,
        section_name: sectionName,
        test_mode: testMode,
        expected,
        actual,
        difference,
        status
      });
    }
  }

  // Print summary by product
  for (const testType of TEST_TYPES) {
    console.log(`\n\n🎯 ${testType.toUpperCase()}`);
    console.log('=' .repeat(80));

    const productAnalyses = analyses.filter(a => a.test_type === testType);
    const sections = [...new Set(productAnalyses.map(a => a.section_name))];

    for (const sectionName of sections) {
      console.log(`\n📝 ${sectionName}`);
      console.log('-' .repeat(80));

      const sectionAnalyses = productAnalyses.filter(a => a.section_name === sectionName);
      const expected = sectionAnalyses[0].expected;

      console.log(`Expected per test: ${expected} questions\n`);

      // Print table header
      console.log('Test Mode          | Expected | Actual | Difference | Status');
      console.log('-------------------|----------|--------|------------|------------------');

      for (const analysis of sectionAnalyses) {
        const statusEmoji =
          analysis.status === 'correct' ? '✅' :
          analysis.status === 'under-generated' ? '⚠️ ' :
          '🔴';

        const diffStr = analysis.difference > 0 ? `+${analysis.difference}` : `${analysis.difference}`;

        console.log(
          `${analysis.test_mode.padEnd(18)} | ${String(analysis.expected).padStart(8)} | ${String(analysis.actual).padStart(6)} | ${diffStr.padStart(10)} | ${statusEmoji} ${analysis.status}`
        );
      }
    }
  }

  // Overall summary
  console.log('\n\n' + '=' .repeat(80));
  console.log('📊 OVERALL SUMMARY');
  console.log('=' .repeat(80));

  const underGenerated = analyses.filter(a => a.status === 'under-generated');
  const overGenerated = analyses.filter(a => a.status === 'over-generated');
  const correct = analyses.filter(a => a.status === 'correct');

  console.log(`\n✅ Correctly Generated: ${correct.length} sections`);
  console.log(`⚠️  Under-Generated: ${underGenerated.length} sections`);
  console.log(`🔴 Over-Generated: ${overGenerated.length} sections`);

  if (underGenerated.length > 0) {
    console.log('\n\n⚠️  UNDER-GENERATED SECTIONS (Need More Questions):');
    console.log('-' .repeat(80));

    const grouped = new Map<string, SectionAnalysis[]>();
    underGenerated.forEach(a => {
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

  if (overGenerated.length > 0) {
    console.log('\n\n🔴 OVER-GENERATED SECTIONS (Too Many Questions):');
    console.log('-' .repeat(80));

    const grouped = new Map<string, SectionAnalysis[]>();
    overGenerated.forEach(a => {
      const key = `${a.test_type} - ${a.section_name}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(a);
    });

    grouped.forEach((analyses, key) => {
      console.log(`\n${key}`);
      analyses.forEach(a => {
        console.log(`  ${a.test_mode}: Excess ${a.difference} questions (has ${a.actual}/${a.expected})`);
      });
    });
  }

  // Total counts
  console.log('\n\n' + '=' .repeat(80));
  console.log('📈 TOTAL QUESTION COUNTS');
  console.log('=' .repeat(80));

  const totalActual = actualCounts.reduce((sum, ac) => sum + ac.count, 0);
  const totalExpectedPerTest = Object.values(SECTION_CONFIGURATIONS).reduce((sum: number, config: any) => sum + config.total_questions, 0);
  const totalExpectedAllTests = totalExpectedPerTest * TEST_MODES.length;

  console.log(`\nTotal questions in database: ${totalActual}`);
  console.log(`Expected per complete test set: ${totalExpectedPerTest} questions`);
  console.log(`Expected for all ${TEST_MODES.length} modes: ${totalExpectedAllTests} questions`);
  console.log(`Difference: ${totalActual - totalExpectedAllTests} questions`);
}

// Run analysis
analyzeGaps()
  .then(() => {
    console.log('\n✅ Analysis complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
