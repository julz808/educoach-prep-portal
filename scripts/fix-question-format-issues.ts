import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QuestionFix {
  id: string;
  originalQuestionText: string;
  originalAnswerOptions: any;
  newQuestionText: string;
  newAnswerOptions: string[];
  issueType: 'embedded_options' | 'missing_options' | 'both';
}

/**
 * Extract answer options from question text
 * Handles patterns like:
 * - "A) option B) option C) option D) option"
 * - "A: option B: option C: option"
 */
function extractOptionsFromText(questionText: string): {
  cleanedText: string;
  options: string[] | null;
} {
  // Pattern 1: A) text B) text C) text D) text E) text (with optional E)
  const pattern1 = /([A-E])\)\s*([^A-E\n]+?)(?=\s*[A-E]\)|$)/g;

  // Pattern 2: A: text B: text C: text D: text E: text (with optional E)
  const pattern2 = /([A-E]):\s*([^A-E\n]+?)(?=\s*[A-E]:|$)/g;

  let matches: RegExpMatchArray[] = [];
  let pattern: RegExp;

  // Try pattern 1 first
  const text1 = questionText;
  const tempMatches1 = [...text1.matchAll(pattern1)];

  if (tempMatches1.length >= 4) {
    matches = tempMatches1;
    pattern = pattern1;
  } else {
    // Try pattern 2
    const tempMatches2 = [...questionText.matchAll(pattern2)];
    if (tempMatches2.length >= 4) {
      matches = tempMatches2;
      pattern = pattern2;
    }
  }

  if (matches.length < 4) {
    return { cleanedText: questionText, options: null };
  }

  // Extract options
  const options: string[] = [];
  let optionsText = '';

  for (const match of matches) {
    const letter = match[1];
    const text = match[2].trim();
    options.push(text);
    optionsText = match[0]; // Keep track for removal
  }

  // Remove the options part from question text
  // Find where the options start in the original text
  let cleanedText = questionText;

  // Remove the entire options section
  const firstOptionMatch = matches[0];
  const optionsStartIndex = questionText.indexOf(firstOptionMatch[0]);

  if (optionsStartIndex !== -1) {
    cleanedText = questionText.substring(0, optionsStartIndex).trim();
  }

  return { cleanedText, options };
}

async function fixQuestionFormatIssues(): Promise<void> {
  console.log('Loading problematic questions report...\n');

  const reportPath = '/Users/julz88/Documents/educoach-prep-portal-2/question-format-issues-report.json';
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  const fixes: QuestionFix[] = [];
  const failedFixes: any[] = [];

  console.log('Analyzing and preparing fixes...\n');

  // Process questions with embedded options
  for (const q of report.questionsWithEmbeddedOptions) {
    const { cleanedText, options } = extractOptionsFromText(q.question_text);

    if (options && options.length >= 4) {
      // Determine issue type
      const hasExistingOptions = q.answer_options &&
        ((Array.isArray(q.answer_options) && q.answer_options.length > 0) ||
         (typeof q.answer_options === 'object' && Object.keys(q.answer_options).length > 0));

      const issueType = hasExistingOptions ? 'embedded_options' : 'both';

      fixes.push({
        id: q.id,
        originalQuestionText: q.question_text,
        originalAnswerOptions: q.answer_options,
        newQuestionText: cleanedText,
        newAnswerOptions: options,
        issueType,
      });
    } else {
      console.log(`⚠️  Could not extract options from question ${q.id}`);
      failedFixes.push({ ...q, reason: 'Could not extract options pattern' });
    }
  }

  // Process questions with missing options (that don't have embedded options)
  const embeddedIds = new Set(report.questionsWithEmbeddedOptions.map((q: any) => q.id));

  for (const q of report.nonWritingQuestionsWithoutOptions) {
    if (!embeddedIds.has(q.id)) {
      // Try to extract options from text
      const { cleanedText, options } = extractOptionsFromText(q.question_text);

      if (options && options.length >= 4) {
        fixes.push({
          id: q.id,
          originalQuestionText: q.question_text,
          originalAnswerOptions: q.answer_options,
          newQuestionText: cleanedText,
          newAnswerOptions: options,
          issueType: 'missing_options',
        });
      } else {
        console.log(`⚠️  Question ${q.id} has missing options but no extractable pattern in text`);
        failedFixes.push({ ...q, reason: 'No extractable options pattern found' });
      }
    }
  }

  console.log(`\n=== FIX SUMMARY ===`);
  console.log(`Total fixes to apply: ${fixes.length}`);
  console.log(`Failed to prepare fixes: ${failedFixes.length}`);

  if (fixes.length === 0) {
    console.log('\nNo fixes to apply. Exiting.');
    return;
  }

  // Show samples of fixes
  console.log('\n=== SAMPLE FIXES (First 3) ===');
  fixes.slice(0, 3).forEach((fix, idx) => {
    console.log(`\n${idx + 1}. Question ID: ${fix.id}`);
    console.log(`   Issue Type: ${fix.issueType}`);
    console.log(`   Original Text: ${fix.originalQuestionText.substring(0, 150)}...`);
    console.log(`   New Text: ${fix.newQuestionText.substring(0, 150)}...`);
    console.log(`   Extracted Options: ${JSON.stringify(fix.newAnswerOptions)}`);
  });

  // Save backup
  const backupPath = '/Users/julz88/Documents/educoach-prep-portal-2/backup-question-format-fixes.json';
  fs.writeFileSync(backupPath, JSON.stringify({ fixes, failedFixes }, null, 2));
  console.log(`\n✅ Backup saved to: ${backupPath}`);

  // Apply fixes
  console.log('\n=== APPLYING FIXES ===');
  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    const { error } = await supabase
      .from('questions_v2')
      .update({
        question_text: fix.newQuestionText,
        answer_options: fix.newAnswerOptions,
      })
      .eq('id', fix.id);

    if (error) {
      console.error(`❌ Error fixing question ${fix.id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`   Fixed ${successCount}/${fixes.length} questions...`);
      }
    }
  }

  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`✅ Successfully fixed: ${successCount} questions`);
  console.log(`❌ Failed to fix: ${errorCount} questions`);
  console.log(`⚠️  Could not prepare fixes for: ${failedFixes.length} questions`);

  if (failedFixes.length > 0) {
    console.log('\n=== QUESTIONS THAT NEED MANUAL REVIEW ===');
    failedFixes.forEach((q, idx) => {
      console.log(`\n${idx + 1}. ID: ${q.id}`);
      console.log(`   Section: ${q.section_name}`);
      console.log(`   Test Type: ${q.test_type}`);
      console.log(`   Reason: ${q.reason}`);
      console.log(`   Question Text: ${q.question_text.substring(0, 200)}...`);
    });

    const manualReviewPath = '/Users/julz88/Documents/educoach-prep-portal-2/questions-needing-manual-review.json';
    fs.writeFileSync(manualReviewPath, JSON.stringify(failedFixes, null, 2));
    console.log(`\n📝 Questions needing manual review saved to: ${manualReviewPath}`);
  }
}

fixQuestionFormatIssues();
