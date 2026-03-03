import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Question {
  id: string;
  question_text: string;
  answer_options: string[];
  response_type: string;
  test_type: string;
  section_name: string;
  passage_id: string | null;
  test_mode: string;
}

interface Passage {
  id: string;
  content: string;
  title: string;
}

interface Issue {
  questionId: string;
  testType: string;
  sectionName: string;
  testMode: string;
  issueType: 'embedded_options' | 'duplicate_passage' | 'wrong_response_type' | 'multiple_issues';
  details: string;
  questionTextPreview: string;
}

async function comprehensiveAudit() {
  console.log('COMPREHENSIVE AUDIT OF ALL QUESTIONS IN DATABASE');
  console.log('='.repeat(100));
  console.log('Starting...\n');

  // Fetch ALL questions (Supabase has 1000 row limit by default, so we need to paginate)
  console.log('Fetching all questions from database...');

  let allQuestions: Question[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('id, question_text, answer_options, response_type, test_type, section_name, passage_id, test_mode')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    if (data && data.length > 0) {
      allQuestions = allQuestions.concat(data as Question[]);
      console.log(`  Fetched ${allQuestions.length} questions so far...`);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`\nTotal questions fetched: ${allQuestions.length}\n`);

  // Fetch ALL passages
  const { data: allPassages, error: passagesError } = await supabase
    .from('passages_v2')
    .select('id, content, title');

  if (passagesError) {
    console.error('Error fetching passages:', passagesError);
    return;
  }

  console.log(`Total passages in database: ${allPassages?.length || 0}\n`);

  const issues: Issue[] = [];

  console.log('Scanning all questions...\n');

  let processedCount = 0;
  const totalCount = allQuestions.length;

  for (const q of allQuestions) {
    processedCount++;
    if (processedCount % 1000 === 0) {
      console.log(`Progress: ${processedCount}/${totalCount} questions scanned...`);
    }

    const questionText = q.question_text || '';
    const hasAnswerOptions = q.answer_options && q.answer_options.length > 0;

    const foundIssues: string[] = [];

    // ============================================================
    // ISSUE 1: Check for embedded answer options
    // ============================================================
    // More aggressive patterns to catch all variations
    const embeddedOptionPatterns = [
      /\bA\)\s+[A-Z]/, // A) followed by capital letter
      /\bB\)\s+[A-Z]/, // B) followed by capital letter
      /\bC\)\s+[A-Z]/, // C) followed by capital letter
      /\bD\)\s+[A-Z]/, // D) followed by capital letter
      /\bE\)\s+[A-Z]/, // E) followed by capital letter
      /\n\s*A\)\s+\w/, // newline then A) with text
      /\n\s*B\)\s+\w/, // newline then B) with text
      /\n\s*C\)\s+\w/, // newline then C) with text
      /\n\s*D\)\s+\w/, // newline then D) with text
      /\n\s*E\)\s+\w/, // newline then E) with text
    ];

    // Count how many option patterns match
    let optionMatchCount = 0;
    for (const pattern of embeddedOptionPatterns) {
      if (pattern.test(questionText)) {
        optionMatchCount++;
      }
    }

    // If we have 2+ different option letters (A, B, C, D, E), it's likely embedded
    const hasMultipleOptions = optionMatchCount >= 2;

    if (hasMultipleOptions && hasAnswerOptions) {
      foundIssues.push('embedded_options');
    }

    // ============================================================
    // ISSUE 2: Check for duplicate passage content
    // ============================================================
    if (q.passage_id) {
      const passage = (allPassages as Passage[]).find(p => p.id === q.passage_id);

      if (passage) {
        const passageContent = passage.content || '';

        // Check if significant portion of passage is in question text
        const passageStart = passageContent.substring(0, 150).trim();
        const hasPassageContent = passageStart.length > 50 && questionText.includes(passageStart);

        // Check for "Passage:" indicator with long text
        const hasPassageIndicator = /Passage:|Read the passage and answer/i.test(questionText);
        const isVeryLong = questionText.length > 600;

        if (hasPassageContent || (hasPassageIndicator && isVeryLong)) {
          foundIssues.push('duplicate_passage');
        }
      }
    }

    // ============================================================
    // ISSUE 3: Wrong response_type
    // ============================================================
    // If question has answer_options array with multiple choices,
    // response_type should be 'multiple_choice'
    if (hasAnswerOptions && q.answer_options.length >= 2) {
      const responseType = q.response_type || '';

      if (responseType !== 'multiple_choice') {
        foundIssues.push('wrong_response_type');
      }
    }

    // ============================================================
    // Record issues
    // ============================================================
    if (foundIssues.length > 0) {
      const issueType = foundIssues.length > 1 ? 'multiple_issues' : foundIssues[0] as any;

      issues.push({
        questionId: q.id,
        testType: q.test_type,
        sectionName: q.section_name,
        testMode: q.test_mode,
        issueType: issueType,
        details: foundIssues.join(', '),
        questionTextPreview: questionText.substring(0, 200)
      });
    }
  }

  console.log(`\nScan complete! Processed ${totalCount} questions.\n`);

  // ============================================================
  // REPORT RESULTS
  // ============================================================
  console.log('='.repeat(100));
  console.log('AUDIT RESULTS');
  console.log('='.repeat(100));
  console.log();

  const embeddedOptionsIssues = issues.filter(i => i.details.includes('embedded_options'));
  const duplicatePassageIssues = issues.filter(i => i.details.includes('duplicate_passage'));
  const wrongResponseTypeIssues = issues.filter(i => i.details.includes('wrong_response_type'));
  const multipleIssues = issues.filter(i => i.issueType === 'multiple_issues');

  console.log(`ISSUE 1: Embedded Options (A, B, C, D in question_text)`);
  console.log(`   Found: ${embeddedOptionsIssues.length} questions`);
  console.log();

  console.log(`ISSUE 2: Duplicate Passage Content in question_text`);
  console.log(`   Found: ${duplicatePassageIssues.length} questions`);
  console.log();

  console.log(`ISSUE 3: Wrong response_type (should be multiple_choice)`);
  console.log(`   Found: ${wrongResponseTypeIssues.length} questions`);
  console.log();

  console.log(`Questions with MULTIPLE issues: ${multipleIssues.length}`);
  console.log();

  console.log(`TOTAL QUESTIONS WITH ISSUES: ${issues.length}`);
  console.log();

  // ============================================================
  // BREAKDOWN BY PRODUCT AND SECTION
  // ============================================================
  console.log('='.repeat(100));
  console.log('BREAKDOWN BY TEST TYPE AND SECTION');
  console.log('='.repeat(100));
  console.log();

  const byProduct: { [key: string]: Issue[] } = {};
  for (const issue of issues) {
    const key = `${issue.testType} | ${issue.sectionName}`;
    if (!byProduct[key]) {
      byProduct[key] = [];
    }
    byProduct[key].push(issue);
  }

  const sortedProducts = Object.entries(byProduct).sort((a, b) => b[1].length - a[1].length);

  for (const [key, productIssues] of sortedProducts) {
    const embeddedCount = productIssues.filter(i => i.details.includes('embedded_options')).length;
    const passageCount = productIssues.filter(i => i.details.includes('duplicate_passage')).length;
    const responseCount = productIssues.filter(i => i.details.includes('wrong_response_type')).length;

    console.log(`${key}`);
    console.log(`   Total issues: ${productIssues.length}`);
    console.log(`   - Embedded options: ${embeddedCount}`);
    console.log(`   - Duplicate passage: ${passageCount}`);
    console.log(`   - Wrong response_type: ${responseCount}`);
    console.log();
  }

  // ============================================================
  // BREAKDOWN BY TEST MODE
  // ============================================================
  console.log('='.repeat(100));
  console.log('BREAKDOWN BY TEST MODE');
  console.log('='.repeat(100));
  console.log();

  const byMode: { [key: string]: number } = {};
  for (const issue of issues) {
    const mode = issue.testMode || 'unknown';
    byMode[mode] = (byMode[mode] || 0) + 1;
  }

  for (const [mode, count] of Object.entries(byMode).sort((a, b) => b[1] - a[1])) {
    console.log(`${mode}: ${count} questions`);
  }
  console.log();

  // ============================================================
  // EXAMPLES OF EACH ISSUE TYPE
  // ============================================================
  console.log('='.repeat(100));
  console.log('EXAMPLES');
  console.log('='.repeat(100));
  console.log();

  console.log('--- ISSUE 1: EMBEDDED OPTIONS (first 3 examples) ---\n');
  for (let i = 0; i < Math.min(3, embeddedOptionsIssues.length); i++) {
    const issue = embeddedOptionsIssues[i];
    console.log(`Question ID: ${issue.questionId}`);
    console.log(`Test: ${issue.testType} | ${issue.sectionName} | ${issue.testMode}`);
    console.log(`Preview: ${issue.questionTextPreview}...`);
    console.log();
  }

  console.log('--- ISSUE 2: DUPLICATE PASSAGE (first 3 examples) ---\n');
  for (let i = 0; i < Math.min(3, duplicatePassageIssues.length); i++) {
    const issue = duplicatePassageIssues[i];
    console.log(`Question ID: ${issue.questionId}`);
    console.log(`Test: ${issue.testType} | ${issue.sectionName} | ${issue.testMode}`);
    console.log(`Preview: ${issue.questionTextPreview}...`);
    console.log();
  }

  console.log('--- ISSUE 3: WRONG RESPONSE_TYPE (first 3 examples) ---\n');
  for (let i = 0; i < Math.min(3, wrongResponseTypeIssues.length); i++) {
    const issue = wrongResponseTypeIssues[i];
    console.log(`Question ID: ${issue.questionId}`);
    console.log(`Test: ${issue.testType} | ${issue.sectionName} | ${issue.testMode}`);
    console.log(`Preview: ${issue.questionTextPreview}...`);
    console.log();
  }

  // ============================================================
  // SAVE RESULTS TO FILES
  // ============================================================
  console.log('='.repeat(100));
  console.log('SAVING RESULTS TO FILES');
  console.log('='.repeat(100));
  console.log();

  // Save all question IDs by issue type
  const report = {
    timestamp: new Date().toISOString(),
    totalQuestionsScanned: totalCount,
    totalIssuesFound: issues.length,
    summary: {
      embeddedOptions: embeddedOptionsIssues.length,
      duplicatePassage: duplicatePassageIssues.length,
      wrongResponseType: wrongResponseTypeIssues.length,
      multipleIssues: multipleIssues.length
    },
    embeddedOptionsQuestionIds: embeddedOptionsIssues.map(i => i.questionId),
    duplicatePassageQuestionIds: duplicatePassageIssues.map(i => i.questionId),
    wrongResponseTypeQuestionIds: wrongResponseTypeIssues.map(i => i.questionId),
    allIssues: issues
  };

  fs.writeFileSync('comprehensive-audit-report.json', JSON.stringify(report, null, 2));
  console.log('✓ Saved: comprehensive-audit-report.json');

  // Save simple text file with IDs
  let textReport = `COMPREHENSIVE QUESTION AUDIT REPORT\n`;
  textReport += `Generated: ${new Date().toISOString()}\n`;
  textReport += `Total Questions Scanned: ${totalCount}\n`;
  textReport += `Total Issues Found: ${issues.length}\n\n`;

  textReport += `EMBEDDED OPTIONS (${embeddedOptionsIssues.length} questions):\n`;
  textReport += embeddedOptionsIssues.map(i => i.questionId).join(',');
  textReport += `\n\n`;

  textReport += `DUPLICATE PASSAGE (${duplicatePassageIssues.length} questions):\n`;
  textReport += duplicatePassageIssues.map(i => i.questionId).join(',');
  textReport += `\n\n`;

  textReport += `WRONG RESPONSE_TYPE (${wrongResponseTypeIssues.length} questions):\n`;
  textReport += wrongResponseTypeIssues.map(i => i.questionId).join(',');
  textReport += `\n\n`;

  fs.writeFileSync('comprehensive-audit-report.txt', textReport);
  console.log('✓ Saved: comprehensive-audit-report.txt');

  console.log();
  console.log('='.repeat(100));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(100));
}

comprehensiveAudit();
