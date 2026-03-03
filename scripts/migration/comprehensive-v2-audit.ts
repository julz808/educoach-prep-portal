/**
 * Comprehensive V2 Questions Audit Script
 *
 * Checks for:
 * - Duplicates
 * - Hallucinations ("Let me..." patterns)
 * - Question counts comparison (V1 vs V2)
 * - Missing required fields
 * - Invalid answer formats
 * - Broken passage relationships
 * - Difficulty distribution
 * - Visual question integrity
 */

import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface AuditResult {
  testType: string;
  section: string;
  v1Count: number;
  v2Count: number;
  duplicates: number;
  hallucinations: number;
  missingFields: string[];
  invalidAnswers: number;
  brokenPassages: number;
  difficultyDistribution: { easy: number; medium: number; hard: number };
  visualQuestions: { total: number; withSvg: number; withUrl: number; broken: number };
  issues: string[];
}

const TEST_TYPES = [
  'Year 5 NAPLAN',
  'Year 7 NAPLAN',
  'ACER Scholarship (Year 7 Entry)',
  'EduTest Scholarship (Year 7 Entry)',
  'VIC Selective Entry (Year 9 Entry)',
  'NSW Selective Entry (Year 7 Entry)',
];

const TEST_MODES = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'drill', 'diagnostic'];

// Patterns that indicate AI hallucination
const HALLUCINATION_PATTERNS = [
  /let me\s+(help|assist|explain|show|create|provide|calculate|solve)/i,
  /i'll\s+(help|assist|explain|show|create|provide|calculate|solve)/i,
  /i can\s+(help|assist|explain|show|create|provide|calculate|solve)/i,
  /here's\s+(the|a|an)\s+(solution|answer|explanation)/i,
  /step\s+1:/i, // Only if it's NOT in explanation field
];

async function auditTestType(testType: string): Promise<AuditResult[]> {
  const results: AuditResult[] = [];

  console.log(`\n📋 Auditing ${testType}...`);

  // Get all sections for this test type
  const { data: sectionsData } = await supabase
    .from('questions_v2')
    .select('section_name')
    .eq('test_type', testType);

  const sections = [...new Set(sectionsData?.map(q => q.section_name) || [])];

  for (const section of sections) {
    const result: AuditResult = {
      testType,
      section,
      v1Count: 0,
      v2Count: 0,
      duplicates: 0,
      hallucinations: 0,
      missingFields: [],
      invalidAnswers: 0,
      brokenPassages: 0,
      difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      visualQuestions: { total: 0, withSvg: 0, withUrl: 0, broken: 0 },
      issues: [],
    };

    // Count V1 questions
    const { count: v1Count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType)
      .eq('section_name', section);

    result.v1Count = v1Count || 0;

    // Fetch V2 questions
    const { data: v2Questions } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('test_type', testType)
      .eq('section_name', section);

    result.v2Count = v2Questions?.length || 0;

    if (!v2Questions || v2Questions.length === 0) {
      result.issues.push('No V2 questions found');
      results.push(result);
      continue;
    }

    // 1. Check for duplicates (exact question text match)
    const questionTexts = new Map<string, number>();
    v2Questions.forEach(q => {
      const text = q.question_text?.trim().toLowerCase();
      if (text) {
        questionTexts.set(text, (questionTexts.get(text) || 0) + 1);
      }
    });

    result.duplicates = Array.from(questionTexts.values()).filter(count => count > 1).length;

    // 2. Check for hallucinations
    v2Questions.forEach(q => {
      const questionText = q.question_text || '';
      const hasHallucination = HALLUCINATION_PATTERNS.some(pattern => pattern.test(questionText));

      if (hasHallucination) {
        result.hallucinations++;
      }
    });

    // 3. Check for missing required fields
    const requiredFields = ['question_text', 'correct_answer', 'difficulty', 'section_name', 'test_type', 'test_mode'];
    const missingFieldsSet = new Set<string>();

    v2Questions.forEach(q => {
      requiredFields.forEach(field => {
        if (!q[field]) {
          missingFieldsSet.add(field);
        }
      });
    });

    result.missingFields = Array.from(missingFieldsSet);

    // 4. Check answer formats (MCQ questions)
    v2Questions.forEach(q => {
      if (q.response_type === 'mcq' || !q.response_type) {
        if (!q.answer_options || !Array.isArray(q.answer_options) || q.answer_options.length < 2) {
          result.invalidAnswers++;
        }
      }
    });

    // 5. Check passage relationships
    const passageIds = v2Questions
      .filter(q => q.passage_id)
      .map(q => q.passage_id);

    if (passageIds.length > 0) {
      const { data: passages } = await supabase
        .from('passages_v2')
        .select('id')
        .in('id', passageIds);

      const validPassageIds = new Set(passages?.map(p => p.id) || []);

      v2Questions.forEach(q => {
        if (q.passage_id && !validPassageIds.has(q.passage_id)) {
          result.brokenPassages++;
        }
      });
    }

    // 6. Difficulty distribution
    v2Questions.forEach(q => {
      if (q.difficulty === 1) result.difficultyDistribution.easy++;
      else if (q.difficulty === 2) result.difficultyDistribution.medium++;
      else if (q.difficulty === 3) result.difficultyDistribution.hard++;
    });

    // 7. Visual questions integrity
    const visualQuestions = v2Questions.filter(q => q.has_visual);
    result.visualQuestions.total = visualQuestions.length;

    visualQuestions.forEach(q => {
      if (q.visual_svg) result.visualQuestions.withSvg++;
      if (q.visual_url) result.visualQuestions.withUrl++;
      if (!q.visual_svg && !q.visual_url) result.visualQuestions.broken++;
    });

    // 8. Compare counts
    const countDiff = Math.abs(result.v1Count - result.v2Count);
    const percentDiff = result.v1Count > 0 ? (countDiff / result.v1Count) * 100 : 0;

    if (percentDiff > 10) {
      result.issues.push(`Question count differs by ${percentDiff.toFixed(1)}% (V1: ${result.v1Count}, V2: ${result.v2Count})`);
    }

    if (result.duplicates > 0) {
      result.issues.push(`${result.duplicates} duplicate questions found`);
    }

    if (result.hallucinations > 0) {
      result.issues.push(`${result.hallucinations} questions with hallucination patterns`);
    }

    if (result.missingFields.length > 0) {
      result.issues.push(`Missing fields: ${result.missingFields.join(', ')}`);
    }

    if (result.invalidAnswers > 0) {
      result.issues.push(`${result.invalidAnswers} questions with invalid answer formats`);
    }

    if (result.brokenPassages > 0) {
      result.issues.push(`${result.brokenPassages} questions reference missing passages`);
    }

    if (result.visualQuestions.broken > 0) {
      result.issues.push(`${result.visualQuestions.broken} visual questions missing SVG/URL`);
    }

    results.push(result);
  }

  return results;
}

async function generateReport() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         COMPREHENSIVE V2 QUESTIONS AUDIT REPORT           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const allResults: AuditResult[] = [];

  for (const testType of TEST_TYPES) {
    const results = await auditTestType(testType);
    allResults.push(...results);
  }

  // Summary statistics
  let totalV1 = 0;
  let totalV2 = 0;
  let totalIssues = 0;
  let totalDuplicates = 0;
  let totalHallucinations = 0;

  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📊 DETAILED RESULTS BY TEST TYPE & SECTION\n');

  let currentTestType = '';

  allResults.forEach(result => {
    if (result.testType !== currentTestType) {
      currentTestType = result.testType;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎯 ${currentTestType.toUpperCase()}`);
      console.log(`${'='.repeat(60)}`);
    }

    console.log(`\n  📚 Section: ${result.section}`);
    console.log(`     V1 Count: ${result.v1Count} | V2 Count: ${result.v2Count}`);
    console.log(`     Duplicates: ${result.duplicates} | Hallucinations: ${result.hallucinations}`);
    console.log(`     Difficulty: Easy=${result.difficultyDistribution.easy} Med=${result.difficultyDistribution.medium} Hard=${result.difficultyDistribution.hard}`);

    if (result.visualQuestions.total > 0) {
      console.log(`     Visual: ${result.visualQuestions.total} total (SVG: ${result.visualQuestions.withSvg}, URL: ${result.visualQuestions.withUrl}, Broken: ${result.visualQuestions.broken})`);
    }

    if (result.issues.length > 0) {
      console.log(`     ⚠️  ISSUES:`);
      result.issues.forEach(issue => console.log(`        - ${issue}`));
    } else {
      console.log(`     ✅ No issues found`);
    }

    totalV1 += result.v1Count;
    totalV2 += result.v2Count;
    totalIssues += result.issues.length;
    totalDuplicates += result.duplicates;
    totalHallucinations += result.hallucinations;
  });

  console.log('\n\n═══════════════════════════════════════════════════════════\n');
  console.log('📈 OVERALL SUMMARY\n');
  console.log(`   Total V1 Questions: ${totalV1}`);
  console.log(`   Total V2 Questions: ${totalV2}`);
  console.log(`   Count Difference: ${totalV2 - totalV1} (${totalV1 > 0 ? ((totalV2 - totalV1) / totalV1 * 100).toFixed(1) : 0}%)`);
  console.log(`   Total Issues Found: ${totalIssues}`);
  console.log(`   Total Duplicates: ${totalDuplicates}`);
  console.log(`   Total Hallucinations: ${totalHallucinations}`);

  if (totalIssues === 0) {
    console.log('\n✅ ✅ ✅  NO ISSUES FOUND - V2 DATA IS CLEAN! ✅ ✅ ✅\n');
  } else {
    console.log(`\n⚠️  ${totalIssues} ISSUES FOUND - REVIEW REQUIRED\n`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // Critical blockers check
  const criticalBlockers = allResults.filter(r =>
    r.v2Count === 0 ||
    r.brokenPassages > 0 ||
    r.invalidAnswers > r.v2Count * 0.1 // More than 10% invalid
  );

  if (criticalBlockers.length > 0) {
    console.log('\n🚨 CRITICAL BLOCKERS - DO NOT MIGRATE YET:\n');
    criticalBlockers.forEach(result => {
      console.log(`   ${result.testType} - ${result.section}`);
      result.issues.forEach(issue => console.log(`      - ${issue}`));
    });
    console.log('\n');
  }

  return {
    totalV1,
    totalV2,
    totalIssues,
    totalDuplicates,
    totalHallucinations,
    criticalBlockers: criticalBlockers.length,
  };
}

// Run the audit
generateReport()
  .then(summary => {
    if (summary.criticalBlockers > 0) {
      console.log('❌ Audit failed with critical blockers. Fix issues before migrating.');
      process.exit(1);
    } else if (summary.totalIssues > 0) {
      console.log('⚠️  Audit completed with warnings. Review before migrating.');
      process.exit(0);
    } else {
      console.log('✅ Audit passed! V2 data is ready for migration.');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n❌ Audit failed with error:', error);
    process.exit(1);
  });
