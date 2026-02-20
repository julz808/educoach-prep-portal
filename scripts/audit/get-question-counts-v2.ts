import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface QuestionCount {
  test_type: string;
  section: string;
  mode: string;
  count: number;
}

interface SectionConfig {
  section: string;
  questionsNeeded: {
    practice: number;
    diagnostic: number;
  };
}

// Expected question counts per test type and section
const expectedCounts: Record<string, SectionConfig[]> = {
  'acer-scholarship': [
    { section: 'abstract-reasoning', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'mathematics', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'reading-comprehension', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'verbal-reasoning', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'humanities', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'sciences', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'written-expression', questionsNeeded: { practice: 20, diagnostic: 10 } },
  ],
  'edutest': [
    { section: 'numerical-reasoning', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'reading-comprehension', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'verbal-reasoning', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'written-expression', questionsNeeded: { practice: 20, diagnostic: 10 } },
  ],
  'nsw-selective-entry': [
    { section: 'mathematical-reasoning', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'reading', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'thinking-skills', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'writing', questionsNeeded: { practice: 20, diagnostic: 10 } },
  ],
  'vic-selective-entry': [
    { section: 'general-ability-verbal', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'general-ability-quantitative', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'mathematics-reasoning', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'reading-reasoning', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'writing', questionsNeeded: { practice: 20, diagnostic: 10 } },
  ],
  'year-5-naplan': [
    { section: 'numeracy-calculator', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'numeracy-no-calculator', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'reading', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'language-conventions', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'writing', questionsNeeded: { practice: 20, diagnostic: 10 } },
  ],
  'year-7-naplan': [
    { section: 'numeracy-calculator', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'numeracy-no-calculator', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'reading', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'language-conventions', questionsNeeded: { practice: 50, diagnostic: 30 } },
    { section: 'writing', questionsNeeded: { practice: 20, diagnostic: 10 } },
  ],
};

async function getQuestionCounts() {
  console.log('📊 Question Counts by Test Type and Section\n');
  console.log('='.repeat(100));

  // Get counts from database
  const { data: counts, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode');

  if (error) {
    console.error('Error fetching question counts:', error);
    return;
  }

  // Group by test_type, section_name, test_mode
  const groupedCounts: Record<string, Record<string, Record<string, number>>> = {};

  for (const row of counts || []) {
    if (!groupedCounts[row.test_type]) {
      groupedCounts[row.test_type] = {};
    }
    if (!groupedCounts[row.test_type][row.section_name]) {
      groupedCounts[row.test_type][row.section_name] = {};
    }
    if (!groupedCounts[row.test_type][row.section_name][row.test_mode]) {
      groupedCounts[row.test_type][row.section_name][row.test_mode] = 0;
    }
    groupedCounts[row.test_type][row.section_name][row.test_mode]++;
  }

  let totalMissing = 0;
  const missingBreakdown: Array<{testType: string, section: string, mode: string, expected: number, actual: number, missing: number}> = [];

  // Compare with expected counts
  for (const [testType, sections] of Object.entries(expectedCounts)) {
    console.log(`\n📝 ${testType.toUpperCase()}`);
    console.log('-'.repeat(100));

    for (const sectionConfig of sections) {
      const section = sectionConfig.section;
      const practiceExpected = sectionConfig.questionsNeeded.practice;
      const diagnosticExpected = sectionConfig.questionsNeeded.diagnostic;

      const practice1Actual = groupedCounts[testType]?.[section]?.['practice_1'] || 0;
      const practice2Actual = groupedCounts[testType]?.[section]?.['practice_2'] || 0;
      const practiceActual = practice1Actual + practice2Actual;
      const diagnosticActual = groupedCounts[testType]?.[section]?.['diagnostic'] || 0;

      const practiceMissing = Math.max(0, practiceExpected - practiceActual);
      const diagnosticMissing = Math.max(0, diagnosticExpected - diagnosticActual);

      if (practiceMissing > 0) {
        missingBreakdown.push({
          testType,
          section,
          mode: 'practice',
          expected: practiceExpected,
          actual: practiceActual,
          missing: practiceMissing
        });
      }

      if (diagnosticMissing > 0) {
        missingBreakdown.push({
          testType,
          section,
          mode: 'diagnostic',
          expected: diagnosticExpected,
          actual: diagnosticActual,
          missing: diagnosticMissing
        });
      }

      totalMissing += practiceMissing + diagnosticMissing;

      const practiceStatus = practiceActual >= practiceExpected ? '✅' : '❌';
      const diagnosticStatus = diagnosticActual >= diagnosticExpected ? '✅' : '❌';

      console.log(`\n  ${section}`);
      console.log(`    Practice:    ${practiceStatus} ${practiceActual.toString().padStart(3)}/${practiceExpected.toString().padStart(3)} (${practiceMissing > 0 ? `missing: ${practiceMissing}` : 'complete'})`);
      console.log(`    Diagnostic:  ${diagnosticStatus} ${diagnosticActual.toString().padStart(3)}/${diagnosticExpected.toString().padStart(3)} (${diagnosticMissing > 0 ? `missing: ${diagnosticMissing}` : 'complete'})`);
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log(`\n📈 SUMMARY`);
  console.log(`Total questions missing: ${totalMissing}`);

  if (missingBreakdown.length > 0) {
    console.log('\n❌ Sections with missing questions (sorted by missing count):\n');
    missingBreakdown
      .sort((a, b) => b.missing - a.missing)
      .forEach(item => {
        console.log(`  ${item.testType.padEnd(25)} | ${item.section.padEnd(30)} | ${item.mode.padEnd(10)} | Missing: ${item.missing.toString().padStart(3)} (${item.actual}/${item.expected})`);
      });
  } else {
    console.log('\n✅ All sections complete!');
  }

  // Check for any unexpected test types or sections
  console.log('\n' + '='.repeat(100));
  console.log('\n🔍 Checking for unexpected test types or sections...\n');

  for (const [testType, sections] of Object.entries(groupedCounts)) {
    if (!expectedCounts[testType]) {
      console.log(`⚠️  Unexpected test type: ${testType}`);
      continue;
    }

    const expectedSections = expectedCounts[testType].map(s => s.section);
    for (const section of Object.keys(sections)) {
      if (!expectedSections.includes(section)) {
        console.log(`⚠️  Unexpected section in ${testType}: ${section}`);
      }
    }
  }
}

getQuestionCounts().catch(console.error);
