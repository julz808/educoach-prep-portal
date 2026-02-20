import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TestConfig {
  testType: string;
  sections: {
    name: string;
    practiceTarget: number;
    diagnosticTarget: number;
  }[];
}

const TEST_CONFIGS: TestConfig[] = [
  {
    testType: 'ACER Scholarship (Year 7 Entry)',
    sections: [
      { name: 'Abstract Reasoning', practiceTarget: 100, diagnosticTarget: 60 },
      { name: 'Mathematics', practiceTarget: 175, diagnosticTarget: 35 },
      { name: 'Reading Comprehension', practiceTarget: 215, diagnosticTarget: 43 },
      { name: 'Verbal Reasoning', practiceTarget: 150, diagnosticTarget: 30 },
      { name: 'Humanities', practiceTarget: 475, diagnosticTarget: 95 },
      { name: 'Sciences', practiceTarget: 250, diagnosticTarget: 50 },
      { name: 'Written Expression', practiceTarget: 10, diagnosticTarget: 2 },
    ]
  },
  {
    testType: 'EduTest Scholarship (Year 7 Entry)',
    sections: [
      { name: 'Numerical Reasoning', practiceTarget: 180, diagnosticTarget: 36 },
      { name: 'Reading Comprehension', practiceTarget: 215, diagnosticTarget: 43 },
      { name: 'Verbal Reasoning', practiceTarget: 236, diagnosticTarget: 42 },
      { name: 'Written Expression', practiceTarget: 10, diagnosticTarget: 2 },
      { name: 'Mathematics', practiceTarget: 226, diagnosticTarget: 6 },
    ]
  },
  {
    testType: 'NSW Selective Entry (Year 7 Entry)',
    sections: [
      { name: 'Mathematical Reasoning', practiceTarget: 150, diagnosticTarget: 30 },
      { name: 'Reading', practiceTarget: 250, diagnosticTarget: 50 },
      { name: 'Thinking Skills', practiceTarget: 150, diagnosticTarget: 30 },
      { name: 'Writing', practiceTarget: 5, diagnosticTarget: 1 },
    ]
  },
  {
    testType: 'VIC Selective Entry (Year 9 Entry)',
    sections: [
      { name: 'General Ability - Verbal', practiceTarget: 300, diagnosticTarget: 60 },
      { name: 'General Ability - Quantitative', practiceTarget: 250, diagnosticTarget: 50 },
      { name: 'Mathematics Reasoning', practiceTarget: 300, diagnosticTarget: 60 },
      { name: 'Reading Reasoning', practiceTarget: 370, diagnosticTarget: 74 },
      { name: 'Writing', practiceTarget: 10, diagnosticTarget: 2 },
    ]
  },
  {
    testType: 'Year 5 NAPLAN',
    sections: [
      { name: 'Numeracy Calculator', practiceTarget: 175, diagnosticTarget: 35 },
      { name: 'Numeracy No Calculator', practiceTarget: 150, diagnosticTarget: 30 },
      { name: 'Reading', practiceTarget: 215, diagnosticTarget: 43 },
      { name: 'Language Conventions', practiceTarget: 225, diagnosticTarget: 45 },
      { name: 'Writing', practiceTarget: 5, diagnosticTarget: 1 },
    ]
  },
  {
    testType: 'Year 7 NAPLAN',
    sections: [
      { name: 'Numeracy Calculator', practiceTarget: 175, diagnosticTarget: 35 },
      { name: 'Numeracy No Calculator', practiceTarget: 150, diagnosticTarget: 30 },
      { name: 'Reading', practiceTarget: 215, diagnosticTarget: 43 },
      { name: 'Language Conventions', practiceTarget: 225, diagnosticTarget: 45 },
      { name: 'Writing', practiceTarget: 5, diagnosticTarget: 1 },
    ]
  },
];

async function comprehensiveAudit() {
  console.log('=' .repeat(120));
  console.log('COMPREHENSIVE QUESTIONS_V2 AUDIT');
  console.log('=' .repeat(120));

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting total count:', countError);
    return;
  }

  console.log(`\n📊 TOTAL QUESTIONS IN DATABASE: ${totalCount}\n`);

  // Get all questions with pagination
  let allQuestions: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('test_type, section_name, test_mode, sub_skill, id')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    if (data && data.length > 0) {
      allQuestions = allQuestions.concat(data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Fetched ${allQuestions.length} questions from database\n`);

  console.log('=' .repeat(120));
  console.log('DETAILED BREAKDOWN BY TEST TYPE AND SECTION');
  console.log('=' .repeat(120));

  let totalExpectedPractice = 0;
  let totalExpectedDiagnostic = 0;
  let totalActualPractice = 0;
  let totalActualDiagnostic = 0;

  const zeroCompleteSections: Array<{test: string, section: string, target: number}> = [];
  const incompleteSections: Array<{test: string, section: string, actual: number, target: number, percentage: number}> = [];
  const completeSections: Array<{test: string, section: string, actual: number, target: number}> = [];

  for (const testConfig of TEST_CONFIGS) {
    const testQuestions = allQuestions?.filter(q => q.test_type === testConfig.testType) || [];

    console.log(`\n${'='.repeat(120)}`);
    console.log(`📝 ${testConfig.testType.toUpperCase()}`);
    console.log(`${'='.repeat(120)}\n`);

    let testTotalPractice = 0;
    let testTotalDiagnostic = 0;
    let testExpectedPractice = 0;
    let testExpectedDiagnostic = 0;

    for (const sectionConfig of testConfig.sections) {
      const sectionQuestions = testQuestions.filter(q => q.section_name === sectionConfig.name);

      const practiceQuestions = sectionQuestions.filter(q => q.test_mode.startsWith('practice_'));
      const diagnosticQuestions = sectionQuestions.filter(q => q.test_mode === 'diagnostic');

      const practiceCount = practiceQuestions.length;
      const diagnosticCount = diagnosticQuestions.length;
      const totalCount = sectionQuestions.length;

      const practiceTarget = sectionConfig.practiceTarget;
      const diagnosticTarget = sectionConfig.diagnosticTarget;
      const totalTarget = practiceTarget + diagnosticTarget;

      testTotalPractice += practiceCount;
      testTotalDiagnostic += diagnosticCount;
      testExpectedPractice += practiceTarget;
      testExpectedDiagnostic += diagnosticTarget;

      const practicePercentage = (practiceCount / practiceTarget * 100).toFixed(1);
      const diagnosticPercentage = (diagnosticCount / diagnosticTarget * 100).toFixed(1);
      const overallPercentage = (totalCount / totalTarget * 100).toFixed(1);

      const practiceStatus = practiceCount >= practiceTarget ? '✅' : practiceCount === 0 ? '❌' : '⚠️';
      const diagnosticStatus = diagnosticCount >= diagnosticTarget ? '✅' : diagnosticCount === 0 ? '❌' : '⚠️';
      const overallStatus = totalCount >= totalTarget ? '✅' : totalCount === 0 ? '❌' : '⚠️';

      console.log(`  ${sectionConfig.name}`);
      console.log(`    Practice:    ${practiceStatus} ${practiceCount.toString().padStart(4)}/${practiceTarget.toString().padStart(4)} (${practicePercentage.padStart(5)}%)`);
      console.log(`    Diagnostic:  ${diagnosticStatus} ${diagnosticCount.toString().padStart(4)}/${diagnosticTarget.toString().padStart(4)} (${diagnosticPercentage.padStart(5)}%)`);
      console.log(`    TOTAL:       ${overallStatus} ${totalCount.toString().padStart(4)}/${totalTarget.toString().padStart(4)} (${overallPercentage.padStart(5)}%)\n`);

      // Categorize sections
      if (totalCount === 0) {
        zeroCompleteSections.push({
          test: testConfig.testType,
          section: sectionConfig.name,
          target: totalTarget
        });
      } else if (totalCount < totalTarget) {
        incompleteSections.push({
          test: testConfig.testType,
          section: sectionConfig.name,
          actual: totalCount,
          target: totalTarget,
          percentage: parseFloat(overallPercentage)
        });
      } else {
        completeSections.push({
          test: testConfig.testType,
          section: sectionConfig.name,
          actual: totalCount,
          target: totalTarget
        });
      }
    }

    const testTotal = testTotalPractice + testTotalDiagnostic;
    const testExpected = testExpectedPractice + testExpectedDiagnostic;
    const testPercentage = (testTotal / testExpected * 100).toFixed(1);

    console.log(`  ${'─'.repeat(116)}`);
    console.log(`  TEST TOTAL:  ${testTotal.toString().padStart(4)}/${testExpected.toString().padStart(4)} (${testPercentage}%)`);

    totalExpectedPractice += testExpectedPractice;
    totalExpectedDiagnostic += testExpectedDiagnostic;
    totalActualPractice += testTotalPractice;
    totalActualDiagnostic += testTotalDiagnostic;
  }

  // Overall summary
  console.log(`\n${'='.repeat(120)}`);
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(120));

  const totalExpected = totalExpectedPractice + totalExpectedDiagnostic;
  const totalActual = totalActualPractice + totalActualDiagnostic;
  const overallPercentage = (totalActual / totalExpected * 100).toFixed(1);

  console.log(`\nTotal Practice Questions:   ${totalActualPractice.toString().padStart(5)}/${totalExpectedPractice.toString().padStart(5)} (${(totalActualPractice/totalExpectedPractice*100).toFixed(1)}%)`);
  console.log(`Total Diagnostic Questions: ${totalActualDiagnostic.toString().padStart(5)}/${totalExpectedDiagnostic.toString().padStart(5)} (${(totalActualDiagnostic/totalExpectedDiagnostic*100).toFixed(1)}%)`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`GRAND TOTAL:                ${totalActual.toString().padStart(5)}/${totalExpected.toString().padStart(5)} (${overallPercentage}%)`);
  console.log(`Questions Still Needed:     ${(totalExpected - totalActual).toString().padStart(5)}`);

  // Zero complete sections
  console.log(`\n${'='.repeat(120)}`);
  console.log('❌ SECTIONS WITH 0% COMPLETION (NOT STARTED)');
  console.log('='.repeat(120));

  if (zeroCompleteSections.length === 0) {
    console.log('\n✅ All sections have been started!\n');
  } else {
    console.log(`\nTotal: ${zeroCompleteSections.length} sections\n`);
    for (const section of zeroCompleteSections) {
      console.log(`  ${section.test.padEnd(45)} | ${section.section.padEnd(35)} | Target: ${section.target.toString().padStart(4)}`);
    }
  }

  // Incomplete sections
  console.log(`\n${'='.repeat(120)}`);
  console.log('⚠️  SECTIONS WITH INCOMPLETE GENERATION (<100%)');
  console.log('='.repeat(120));

  incompleteSections.sort((a, b) => a.percentage - b.percentage);

  console.log(`\nTotal: ${incompleteSections.length} sections\n`);
  for (const section of incompleteSections) {
    const percentStr = section.percentage.toFixed(1).padStart(5) + '%';
    const missing = section.target - section.actual;
    console.log(`  ${percentStr} | ${section.test.padEnd(45)} | ${section.section.padEnd(35)} | ${section.actual}/${section.target} (missing: ${missing})`);
  }

  // Complete sections
  console.log(`\n${'='.repeat(120)}`);
  console.log('✅ COMPLETED SECTIONS (100%)');
  console.log('='.repeat(120));

  console.log(`\nTotal: ${completeSections.length} sections\n`);
  for (const section of completeSections) {
    console.log(`  ${section.test.padEnd(45)} | ${section.section.padEnd(35)} | ${section.actual}/${section.target}`);
  }

  // Sub-skill analysis
  console.log(`\n${'='.repeat(120)}`);
  console.log('SUB-SKILL FAILURE ANALYSIS');
  console.log('='.repeat(120));

  // We need to compare against post-generation reports for failures
  console.log('\nTo analyze sub-skill failures, please review the post-generation reports in:');
  console.log('  docs/generation-reports/post-generation-check-*.md');
  console.log('\nThese reports contain detailed failure breakdowns by sub-skill.');

  // Unique sub-skills count
  const uniqueSubSkills = new Set(allQuestions?.map(q => `${q.test_type}::${q.section_name}::${q.sub_skill}`));
  console.log(`\n📊 Total Unique Sub-Skills in Database: ${uniqueSubSkills.size}`);

  // Sub-skills by test and section
  console.log(`\n${'='.repeat(120)}`);
  console.log('SUB-SKILLS BY TEST TYPE AND SECTION');
  console.log('='.repeat(120));

  for (const testConfig of TEST_CONFIGS) {
    console.log(`\n${testConfig.testType}:`);

    for (const sectionConfig of testConfig.sections) {
      const sectionQuestions = allQuestions?.filter(
        q => q.test_type === testConfig.testType && q.section_name === sectionConfig.name
      ) || [];

      if (sectionQuestions.length === 0) {
        console.log(`  ${sectionConfig.name}: No questions generated yet`);
        continue;
      }

      const subSkillCounts: Record<string, number> = {};
      for (const q of sectionQuestions) {
        subSkillCounts[q.sub_skill] = (subSkillCounts[q.sub_skill] || 0) + 1;
      }

      console.log(`  ${sectionConfig.name}:`);
      for (const [subSkill, count] of Object.entries(subSkillCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`    - ${subSkill}: ${count} questions`);
      }
    }
  }
}

comprehensiveAudit().catch(console.error);
