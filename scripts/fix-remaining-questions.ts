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
  newQuestionText: string;
  newAnswerOptions: string[];
}

/**
 * Improved extraction that handles multiline patterns
 */
function extractOptionsFromTextImproved(questionText: string): {
  cleanedText: string;
  options: string[] | null;
} {
  // Pattern for options on separate lines: "\nA) text\nB) text"
  const multilinePattern = /^([A-E])\)\s*(.+?)$/gm;

  // Pattern for options on same line: "A) text B) text C) text"
  const sameLinePattern = /([A-E])\)\s*([^A-E\n]+?)(?=\s*[A-E]\)|$)/g;

  // Try multiline pattern first
  let matches = [...questionText.matchAll(multilinePattern)];
  let useMultiline = matches.length >= 4;

  // Verify they're consecutive letters starting from A
  if (useMultiline) {
    const letters = matches.map(m => m[1]);
    const isConsecutive = letters[0] === 'A' &&
      letters.every((letter, idx) => letter.charCodeAt(0) === 'A'.charCodeAt(0) + idx);

    if (!isConsecutive) {
      useMultiline = false;
    }
  }

  if (!useMultiline) {
    // Try same-line pattern
    matches = [...questionText.matchAll(sameLinePattern)];
    if (matches.length < 4) {
      return { cleanedText: questionText, options: null };
    }
  }

  // Extract options
  const options: string[] = [];
  let cleanedText = questionText;

  if (useMultiline) {
    // For multiline: remove from first option onwards
    const firstMatch = matches[0];
    const optionsStartIndex = questionText.indexOf(firstMatch[0]);

    if (optionsStartIndex !== -1) {
      cleanedText = questionText.substring(0, optionsStartIndex).trim();
    }

    // Extract option texts
    for (const match of matches) {
      options.push(match[2].trim());
    }
  } else {
    // For same-line: use existing logic
    const firstMatch = matches[0];
    const optionsStartIndex = questionText.indexOf(firstMatch[0]);

    if (optionsStartIndex !== -1) {
      cleanedText = questionText.substring(0, optionsStartIndex).trim();
    }

    for (const match of matches) {
      options.push(match[2].trim());
    }
  }

  return { cleanedText, options };
}

async function fixRemainingQuestions(): Promise<void> {
  console.log('Loading questions needing manual review...\n');

  const reviewPath = '/Users/julz88/Documents/educoach-prep-portal-2/questions-needing-manual-review.json';
  const questions = JSON.parse(fs.readFileSync(reviewPath, 'utf-8'));

  const fixes: QuestionFix[] = [];
  const stillFailed: any[] = [];

  console.log(`Processing ${questions.length} questions...\n`);

  for (const q of questions) {
    const { cleanedText, options } = extractOptionsFromTextImproved(q.question_text);

    if (options && options.length >= 4) {
      fixes.push({
        id: q.id,
        originalQuestionText: q.question_text,
        newQuestionText: cleanedText,
        newAnswerOptions: options,
      });
    } else {
      stillFailed.push(q);
    }
  }

  console.log(`=== PROCESSING SUMMARY ===`);
  console.log(`Can now fix: ${fixes.length} questions`);
  console.log(`Still cannot extract: ${stillFailed.length} questions\n`);

  if (fixes.length > 0) {
    console.log('=== SAMPLE FIXES ===');
    fixes.slice(0, 3).forEach((fix, idx) => {
      console.log(`\n${idx + 1}. ID: ${fix.id}`);
      console.log(`   Original: ${fix.originalQuestionText.substring(0, 100)}...`);
      console.log(`   Cleaned: ${fix.newQuestionText.substring(0, 100)}...`);
      console.log(`   Options: ${JSON.stringify(fix.newAnswerOptions)}`);
    });

    console.log('\n=== APPLYING FIXES ===');
    let successCount = 0;

    for (const fix of fixes) {
      const { error } = await supabase
        .from('questions_v2')
        .update({
          question_text: fix.newQuestionText,
          answer_options: fix.newAnswerOptions,
        })
        .eq('id', fix.id);

      if (error) {
        console.error(`❌ Error fixing ${fix.id}:`, error.message);
      } else {
        successCount++;
      }
    }

    console.log(`\n✅ Successfully fixed ${successCount}/${fixes.length} questions`);
  }

  if (stillFailed.length > 0) {
    console.log(`\n⚠️  ${stillFailed.length} questions still need manual intervention:`);
    stillFailed.forEach((q, idx) => {
      console.log(`\n${idx + 1}. ID: ${q.id}`);
      console.log(`   Section: ${q.section_name}`);
      console.log(`   Question: ${q.question_text}`);
    });
  }
}

fixRemainingQuestions();
