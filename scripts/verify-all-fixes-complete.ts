import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Question {
  id: string;
  question_text: string;
  answer_options: string[];
  test_type: string;
  section_name: string;
  passage_id: string | null;
}

interface Passage {
  id: string;
  content: string;
  title: string;
}

async function verifyAllFixes() {
  console.log('VERIFICATION: CHECKING ALL 8,888 QUESTIONS FOR REMAINING ISSUES');
  console.log('='.repeat(100));
  console.log();

  // Fetch ALL questions (with pagination)
  console.log('Fetching all questions from database...');

  let allQuestions: Question[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('id, question_text, answer_options, test_type, section_name, passage_id')
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

  // Fetch passages
  const { data: allPassages } = await supabase
    .from('passages_v2')
    .select('id, content, title');

  console.log(`Total passages fetched: ${allPassages?.length || 0}\n`);

  // Create passage map for quick lookup
  const passageMap = new Map<string, Passage>();
  if (allPassages) {
    allPassages.forEach((p: any) => passageMap.set(p.id, p));
  }

  console.log('Scanning all questions for remaining issues...\n');

  let embeddedOptionsCount = 0;
  let duplicatePassageCount = 0;
  const embeddedOptionsExamples: Question[] = [];
  const duplicatePassageExamples: Question[] = [];

  let processedCount = 0;
  const totalCount = allQuestions.length;

  for (const q of allQuestions) {
    processedCount++;
    if (processedCount % 1000 === 0) {
      console.log(`Progress: ${processedCount}/${totalCount} questions scanned...`);
    }

    const questionText = q.question_text || '';
    const hasAnswerOptions = q.answer_options && q.answer_options.length > 0;

    // ============================================================
    // CHECK 1: Embedded options
    // ============================================================
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

    let optionMatchCount = 0;
    for (const pattern of embeddedOptionPatterns) {
      if (pattern.test(questionText)) {
        optionMatchCount++;
      }
    }

    const hasMultipleOptions = optionMatchCount >= 2;

    if (hasMultipleOptions && hasAnswerOptions) {
      embeddedOptionsCount++;
      if (embeddedOptionsExamples.length < 5) {
        embeddedOptionsExamples.push(q);
      }
    }

    // ============================================================
    // CHECK 2: Duplicate passage content
    // ============================================================
    if (q.passage_id) {
      const passage = passageMap.get(q.passage_id);

      if (passage) {
        const passageContent = passage.content || '';

        // Check if significant portion of passage is in question text
        const passageStart = passageContent.substring(0, 150).trim();
        const hasPassageContent = passageStart.length > 50 && questionText.includes(passageStart);

        // Check for "Passage:" indicator with long text
        const hasPassageIndicator = /Passage:|Read the passage and answer/i.test(questionText);
        const isVeryLong = questionText.length > 600;

        if (hasPassageContent || (hasPassageIndicator && isVeryLong)) {
          duplicatePassageCount++;
          if (duplicatePassageExamples.length < 5) {
            duplicatePassageExamples.push(q);
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(100));
  console.log();

  console.log(`Total questions scanned: ${totalCount}`);
  console.log();

  console.log(`ISSUE 1: Embedded Options (A, B, C, D in question_text)`);
  console.log(`   Remaining: ${embeddedOptionsCount} questions`);
  if (embeddedOptionsCount === 0) {
    console.log('   ✅ ALL FIXED!');
  } else {
    console.log('   ⚠️  Still have issues!');
  }
  console.log();

  console.log(`ISSUE 2: Duplicate Passage Content in question_text`);
  console.log(`   Remaining: ${duplicatePassageCount} questions`);
  if (duplicatePassageCount === 0) {
    console.log('   ✅ ALL FIXED!');
  } else {
    console.log('   ⚠️  Still have issues!');
  }
  console.log();

  console.log('='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));
  console.log();

  if (embeddedOptionsCount === 0 && duplicatePassageCount === 0) {
    console.log('🎉 SUCCESS! All issues have been fixed!');
    console.log('✅ No embedded options found');
    console.log('✅ No duplicate passages found');
  } else {
    console.log(`⚠️  ${embeddedOptionsCount + duplicatePassageCount} issues remain`);
  }

  console.log();

  // Show examples of remaining issues if any
  if (embeddedOptionsCount > 0) {
    console.log('='.repeat(100));
    console.log('REMAINING EMBEDDED OPTIONS EXAMPLES:');
    console.log('='.repeat(100));
    console.log();

    for (let i = 0; i < Math.min(5, embeddedOptionsExamples.length); i++) {
      const q = embeddedOptionsExamples[i];
      console.log(`Question ID: ${q.id}`);
      console.log(`Test: ${q.test_type} | ${q.section_name}`);
      console.log(`Text (first 300 chars):`);
      console.log(q.question_text.substring(0, 300));
      console.log();
      console.log('-'.repeat(100));
      console.log();
    }

    console.log(`All remaining embedded options IDs:`);
    console.log(embeddedOptionsExamples.map(q => q.id).join(','));
    console.log();
  }

  if (duplicatePassageCount > 0) {
    console.log('='.repeat(100));
    console.log('REMAINING DUPLICATE PASSAGE EXAMPLES:');
    console.log('='.repeat(100));
    console.log();

    for (let i = 0; i < Math.min(5, duplicatePassageExamples.length); i++) {
      const q = duplicatePassageExamples[i];
      const passage = q.passage_id ? passageMap.get(q.passage_id) : null;
      console.log(`Question ID: ${q.id}`);
      console.log(`Test: ${q.test_type} | ${q.section_name}`);
      if (passage) {
        console.log(`Passage: ${passage.title}`);
      }
      console.log(`Text length: ${q.question_text.length} chars`);
      console.log(`Text (first 300 chars):`);
      console.log(q.question_text.substring(0, 300));
      console.log();
      console.log('-'.repeat(100));
      console.log();
    }

    console.log(`All remaining duplicate passage IDs:`);
    console.log(duplicatePassageExamples.map(q => q.id).join(','));
    console.log();
  }

  // Compare with original audit
  console.log('='.repeat(100));
  console.log('COMPARISON WITH ORIGINAL AUDIT:');
  console.log('='.repeat(100));
  console.log();
  console.log('Original Issues Found:');
  console.log('  - Embedded options: 194 questions');
  console.log('  - Duplicate passages: 745 questions');
  console.log('  - Total: 939 questions with issues');
  console.log();
  console.log('After Fixes:');
  console.log(`  - Embedded options: ${embeddedOptionsCount} questions`);
  console.log(`  - Duplicate passages: ${duplicatePassageCount} questions`);
  console.log(`  - Total: ${embeddedOptionsCount + duplicatePassageCount} questions with issues`);
  console.log();
  console.log('Questions Fixed:');
  console.log(`  - Embedded options: ${194 - embeddedOptionsCount} fixed`);
  console.log(`  - Duplicate passages: ${745 - duplicatePassageCount} fixed`);
  console.log(`  - Total: ${939 - (embeddedOptionsCount + duplicatePassageCount)} questions fixed`);
  console.log();

  const totalFixed = 939 - (embeddedOptionsCount + duplicatePassageCount);
  const percentFixed = ((totalFixed / 939) * 100).toFixed(1);
  console.log(`Success Rate: ${percentFixed}% of issues resolved`);
  console.log();
}

verifyAllFixes();
