import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Question {
  id: string;
  question_text: string;
  answer_options: any;
  section_name: string;
  test_type: string;
  sub_skill_id: string;
}

interface AuditResult {
  totalQuestions: number;
  questionsWithEmbeddedOptions: Question[];
  nonWritingQuestionsWithoutOptions: Question[];
  summary: {
    embeddedOptionsCount: number;
    missingOptionsCount: number;
    bothIssuesCount: number;
    totalProblematic: number;
  };
}

async function auditQuestionFormatIssues(): Promise<void> {
  console.log('Starting comprehensive audit of questions_v2 table...\n');

  // Fetch all questions with pagination
  let allQuestions: Question[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: questions, error } = await supabase
      .from('questions_v2')
      .select('id, question_text, answer_options, section_name, test_type, sub_skill_id')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    if (!questions || questions.length === 0) {
      hasMore = false;
    } else {
      allQuestions = allQuestions.concat(questions);
      console.log(`Fetched ${allQuestions.length} questions so far...`);

      if (questions.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  if (allQuestions.length === 0) {
    console.log('No questions found in questions_v2 table');
    return;
  }

  console.log(`\nTotal questions in questions_v2: ${allQuestions.length}\n`);
  const questions = allQuestions;

  const result: AuditResult = {
    totalQuestions: questions.length,
    questionsWithEmbeddedOptions: [],
    nonWritingQuestionsWithoutOptions: [],
    summary: {
      embeddedOptionsCount: 0,
      missingOptionsCount: 0,
      bothIssuesCount: 0,
      totalProblematic: 0,
    },
  };

  // Define writing-related section keywords
  const writingSections = [
    'writing',
    'written expression',
    'written response',
    'creative writing',
    'persuasive writing',
    'narrative writing',
  ];

  for (const question of questions) {
    let hasEmbeddedOptions = false;
    let hasMissingOptions = false;

    // Check if this is a writing section
    const isWritingSection = writingSections.some(keyword =>
      question.section_name?.toLowerCase().includes(keyword)
    );

    // Issue 1: Check for embedded options in question text
    // Pattern: A) text B) text or a) text b) text
    const embeddedOptionsPattern = /[A-E]\)\s*\w+.*?[B-E]\)\s*\w+/i;
    if (embeddedOptionsPattern.test(question.question_text)) {
      hasEmbeddedOptions = true;
    }

    // Issue 2: Check for missing answer options (non-writing questions only)
    if (!isWritingSection) {
      const options = question.answer_options;

      // Check if options are null, empty array, empty object, or not a proper array/object
      const hasNoOptions =
        !options ||
        (Array.isArray(options) && options.length === 0) ||
        (typeof options === 'object' && Object.keys(options).length === 0) ||
        (typeof options === 'string' && options.trim() === '');

      if (hasNoOptions) {
        hasMissingOptions = true;
      }
    }

    // Record issues
    if (hasEmbeddedOptions) {
      result.questionsWithEmbeddedOptions.push(question);
      result.summary.embeddedOptionsCount++;
    }

    if (hasMissingOptions) {
      result.nonWritingQuestionsWithoutOptions.push(question);
      result.summary.missingOptionsCount++;
    }

    if (hasEmbeddedOptions && hasMissingOptions) {
      result.summary.bothIssuesCount++;
    }
  }

  // Calculate total unique problematic questions
  const problematicIds = new Set([
    ...result.questionsWithEmbeddedOptions.map(q => q.id),
    ...result.nonWritingQuestionsWithoutOptions.map(q => q.id),
  ]);
  result.summary.totalProblematic = problematicIds.size;

  // Display summary
  console.log('=== AUDIT SUMMARY ===');
  console.log(`Total questions audited: ${result.totalQuestions}`);
  console.log(`Questions with embedded options in text: ${result.summary.embeddedOptionsCount}`);
  console.log(`Non-writing questions without answer options: ${result.summary.missingOptionsCount}`);
  console.log(`Questions with BOTH issues: ${result.summary.bothIssuesCount}`);
  console.log(`Total problematic questions: ${result.summary.totalProblematic}`);
  console.log(`Percentage of problematic questions: ${((result.summary.totalProblematic / result.totalQuestions) * 100).toFixed(2)}%\n`);

  // Show examples
  if (result.questionsWithEmbeddedOptions.length > 0) {
    console.log('\n=== SAMPLE: Questions with Embedded Options ===');
    result.questionsWithEmbeddedOptions.slice(0, 5).forEach((q, idx) => {
      console.log(`\n${idx + 1}. ID: ${q.id}`);
      console.log(`   Test Type: ${q.test_type}`);
      console.log(`   Section: ${q.section_name}`);
      console.log(`   Question Text (first 200 chars): ${q.question_text.substring(0, 200)}...`);
      console.log(`   Answer Options: ${JSON.stringify(q.answer_options)}`);
    });
  }

  if (result.nonWritingQuestionsWithoutOptions.length > 0) {
    console.log('\n=== SAMPLE: Non-Writing Questions Without Options ===');
    result.nonWritingQuestionsWithoutOptions.slice(0, 5).forEach((q, idx) => {
      console.log(`\n${idx + 1}. ID: ${q.id}`);
      console.log(`   Test Type: ${q.test_type}`);
      console.log(`   Section: ${q.section_name}`);
      console.log(`   Question Text (first 200 chars): ${q.question_text.substring(0, 200)}...`);
      console.log(`   Answer Options: ${JSON.stringify(q.answer_options)}`);
    });
  }

  // Save detailed report
  const reportPath = '/Users/julz88/Documents/educoach-prep-portal-2/question-format-issues-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ Detailed report saved to: ${reportPath}`);

  // Save question IDs for easy reference
  const idsReport = {
    embeddedOptionsIds: result.questionsWithEmbeddedOptions.map(q => q.id),
    missingOptionsIds: result.nonWritingQuestionsWithoutOptions.map(q => q.id),
  };
  const idsPath = '/Users/julz88/Documents/educoach-prep-portal-2/problematic-question-ids.json';
  fs.writeFileSync(idsPath, JSON.stringify(idsReport, null, 2));
  console.log(`✅ Question IDs saved to: ${idsPath}`);
}

auditQuestionFormatIssues();
