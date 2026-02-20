/**
 * Validation Script: Check Passage Examples in Curriculum Data
 *
 * This script validates that all reading/comprehension sections have proper
 * passage examples (not just passage summaries).
 *
 * Run: npx tsx scripts/audit/validate-passage-examples.ts
 */

import { ACER_SUB_SKILLS } from '@/data/curriculumData_v2/acer';
import { EDUTEST_SUB_SKILLS } from '@/data/curriculumData_v2/edutest';
import { NSW_SELECTIVE_SUB_SKILLS } from '@/data/curriculumData_v2/nsw-selective';
import { VIC_SELECTIVE_SUB_SKILLS } from '@/data/curriculumData_v2/vic-selective';

interface ValidationResult {
  testType: string;
  sectionName: string;
  subSkill: string;
  exampleIndex: number;
  hasPassageContent: boolean;
  passageWordCount: number | null;
  issue: string | null;
}

const READING_SECTION_PATTERNS = [
  'Reading',
  'Humanities',
  'Reading Comprehension',
  'Reading Reasoning'
];

const PASSAGE_INDICATORS = [
  'Read the passage',
  'Read the following passage',
  'Passage:',
  '\n\nPassage:',
  'Read the poem'
];

const PROBLEMATIC_PATTERNS = [
  'Passage about',
  'From a passage about',
  'passage about',
  'passage discusses'
];

function isReadingSection(sectionName: string): boolean {
  return READING_SECTION_PATTERNS.some(pattern =>
    sectionName.includes(pattern)
  );
}

function hasProperPassage(questionText: string): boolean {
  // Check if it has passage indicators
  const hasIndicator = PASSAGE_INDICATORS.some(indicator =>
    questionText.includes(indicator)
  );

  // Check if it has problematic patterns
  const hasProblematicPattern = PROBLEMATIC_PATTERNS.some(pattern =>
    questionText.toLowerCase().includes(pattern.toLowerCase())
  );

  return hasIndicator && !hasProblematicPattern;
}

function getPassageWordCount(questionText: string): number | null {
  // Extract passage content if present
  const passageMatch = questionText.match(/Passage:\s*([\s\S]+?)(?:\n\n[A-Z]|$)/);

  if (passageMatch && passageMatch[1]) {
    const passageText = passageMatch[1].trim();
    const wordCount = passageText.split(/\s+/).length;
    return wordCount;
  }

  return null;
}

function validateCurriculum(
  curriculum: any,
  testTypeName: string
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const [sectionName, sectionData] of Object.entries(curriculum)) {
    // Only check reading/comprehension sections
    if (!isReadingSection(sectionName as string)) {
      continue;
    }

    for (const [subSkill, subSkillData] of Object.entries(sectionData as any)) {
      const examples = (subSkillData as any).examples || [];

      examples.forEach((example: any, index: number) => {
        const questionText = example.question_text || '';
        const hasProperPassageContent = hasProperPassage(questionText);
        const wordCount = getPassageWordCount(questionText);

        let issue: string | null = null;

        // Check for problematic patterns
        if (PROBLEMATIC_PATTERNS.some(pattern =>
          questionText.toLowerCase().includes(pattern.toLowerCase())
        )) {
          issue = 'Contains passage summary instead of full passage';
        } else if (!hasProperPassageContent && questionText.length > 50) {
          issue = 'Missing passage indicator';
        } else if (hasProperPassageContent && wordCount && wordCount < 30) {
          issue = `Passage too short (${wordCount} words)`;
        }

        results.push({
          testType: testTypeName,
          sectionName: sectionName as string,
          subSkill,
          exampleIndex: index,
          hasPassageContent: hasProperPassageContent,
          passageWordCount: wordCount,
          issue
        });
      });
    }
  }

  return results;
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  PASSAGE EXAMPLE VALIDATION                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const allResults: ValidationResult[] = [
    ...validateCurriculum(ACER_SUB_SKILLS, 'ACER Scholarship'),
    ...validateCurriculum(EDUTEST_SUB_SKILLS, 'EduTest Scholarship'),
    ...validateCurriculum(NSW_SELECTIVE_SUB_SKILLS, 'NSW Selective Entry'),
    ...validateCurriculum(VIC_SELECTIVE_SUB_SKILLS, 'VIC Selective Entry')
  ];

  // Filter results with issues
  const issuesFound = allResults.filter(r => r.issue !== null);
  const validExamples = allResults.filter(r => r.issue === null);

  // Display statistics
  console.log('📊 VALIDATION SUMMARY\n');
  console.log(`Total reading examples checked: ${allResults.length}`);
  console.log(`✅ Valid examples: ${validExamples.length}`);
  console.log(`❌ Issues found: ${issuesFound.length}\n`);

  // Display issues by test type
  if (issuesFound.length > 0) {
    console.log('❌ ISSUES FOUND:\n');

    const issuesByTest = issuesFound.reduce((acc, result) => {
      if (!acc[result.testType]) {
        acc[result.testType] = [];
      }
      acc[result.testType].push(result);
      return acc;
    }, {} as Record<string, ValidationResult[]>);

    for (const [testType, issues] of Object.entries(issuesByTest)) {
      console.log(`\n${testType}:`);
      console.log('─'.repeat(60));

      issues.forEach(issue => {
        console.log(`\n  Section: ${issue.sectionName}`);
        console.log(`  Sub-skill: ${issue.subSkill}`);
        console.log(`  Example #${issue.exampleIndex + 1}`);
        console.log(`  Issue: ${issue.issue}`);
        if (issue.passageWordCount) {
          console.log(`  Word count: ${issue.passageWordCount}`);
        }
      });
    }
  } else {
    console.log('✅ All reading examples have proper passage content!\n');
  }

  // Display valid examples statistics
  console.log('\n📈 VALID EXAMPLES BY TEST TYPE:\n');

  const validByTest = validExamples.reduce((acc, result) => {
    if (!acc[result.testType]) {
      acc[result.testType] = {
        count: 0,
        totalWords: 0,
        minWords: Infinity,
        maxWords: 0
      };
    }
    acc[result.testType].count++;
    if (result.passageWordCount) {
      acc[result.testType].totalWords += result.passageWordCount;
      acc[result.testType].minWords = Math.min(acc[result.testType].minWords, result.passageWordCount);
      acc[result.testType].maxWords = Math.max(acc[result.testType].maxWords, result.passageWordCount);
    }
    return acc;
  }, {} as Record<string, { count: number; totalWords: number; minWords: number; maxWords: number }>);

  for (const [testType, stats] of Object.entries(validByTest)) {
    const avgWords = stats.totalWords > 0 ? Math.round(stats.totalWords / stats.count) : 0;
    console.log(`${testType}:`);
    console.log(`  Examples: ${stats.count}`);
    if (avgWords > 0) {
      console.log(`  Avg passage length: ${avgWords} words`);
      console.log(`  Range: ${stats.minWords} - ${stats.maxWords} words`);
    }
    console.log();
  }

  // Exit code
  if (issuesFound.length > 0) {
    console.log('⚠️  Validation failed - issues found\n');
    process.exit(1);
  } else {
    console.log('✅ Validation passed - all examples valid\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});
