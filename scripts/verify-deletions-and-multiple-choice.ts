import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const deletedQuestionIds = [
  "48c1a39a-b75f-4875-b38e-d6b4791ca33e",
  "6db49112-92ba-4ade-91cd-4aebf8c4a9f8",
  "ae321a4d-2b5e-4aaf-9ce6-c229723da83b",
  "f9feb86f-8a0a-4e53-8523-76a6f9c29b3c",
  "fcbfa39d-c352-4f3a-90be-fca5e51250bf",
  "c3f8c9ec-6ee5-4d98-8cd6-43d15f2463ef",
  "1c013a8f-ecbc-4b74-acab-0b05cdc8b6b0"
];

const writingSections = [
  'writing',
  'written expression',
  'written response',
  'creative writing',
  'persuasive writing',
  'narrative writing',
];

async function verifyDeletionsAndMultipleChoice() {
  console.log('=== PART 1: VERIFY DELETIONS ===\n');

  let foundCount = 0;
  let notFoundCount = 0;

  for (const id of deletedQuestionIds) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('id, test_type, section_name, sub_skill')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      console.log(`❌ STILL EXISTS: ${id}`);
      console.log(`   ${data.test_type} - ${data.section_name} - ${data.sub_skill}`);
      foundCount++;
    } else {
      console.log(`✅ CONFIRMED DELETED: ${id}`);
      notFoundCount++;
    }
  }

  console.log('\n--- Deletion Verification Summary ---');
  console.log(`Expected deleted: ${deletedQuestionIds.length}`);
  console.log(`✅ Confirmed deleted: ${notFoundCount}`);
  console.log(`❌ Still exists: ${foundCount}`);

  if (foundCount > 0) {
    console.log('\n⚠️ WARNING: Some questions were not deleted!');
  } else {
    console.log('\n✅ SUCCESS: All 7 questions confirmed deleted from questions_v2 table');
  }

  console.log('\n\n=== PART 2: VERIFY ALL NON-WRITING QUESTIONS ARE MULTIPLE CHOICE ===\n');
  console.log('Fetching all questions from questions_v2...\n');

  // Fetch all questions in batches
  let allQuestions: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: questions, error } = await supabase
      .from('questions_v2')
      .select('id, test_type, section_name, sub_skill, response_type, answer_options, question_text')
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

  console.log(`\nTotal questions in database: ${allQuestions.length}\n`);

  // Analyze each question
  const issues: any[] = [];
  let writingQuestionsCount = 0;
  let nonWritingQuestionsCount = 0;
  let correctMultipleChoiceCount = 0;
  let incorrectExtendedResponseCount = 0;

  for (const q of allQuestions) {
    const isWritingSection = writingSections.some(keyword =>
      q.section_name?.toLowerCase().includes(keyword)
    );

    if (isWritingSection) {
      writingQuestionsCount++;
      continue; // Skip writing questions
    }

    nonWritingQuestionsCount++;

    // Check if it's properly configured as multiple choice
    const hasOptions = q.answer_options &&
      ((Array.isArray(q.answer_options) && q.answer_options.length >= 4) ||
       (typeof q.answer_options === 'object' && Object.keys(q.answer_options).length >= 4));

    const isMultipleChoice = q.response_type === 'multiple_choice';

    if (!hasOptions || !isMultipleChoice) {
      incorrectExtendedResponseCount++;
      issues.push({
        id: q.id,
        test_type: q.test_type,
        section_name: q.section_name,
        sub_skill: q.sub_skill,
        response_type: q.response_type,
        has_options: hasOptions,
        answer_options: q.answer_options,
        question_text: q.question_text.substring(0, 100)
      });
    } else {
      correctMultipleChoiceCount++;
    }
  }

  console.log('--- Multiple Choice Verification Summary ---');
  console.log(`Total questions: ${allQuestions.length}`);
  console.log(`Writing/Written Expression questions: ${writingQuestionsCount}`);
  console.log(`Non-writing questions: ${nonWritingQuestionsCount}`);
  console.log(`✅ Correct multiple choice: ${correctMultipleChoiceCount}`);
  console.log(`❌ Incorrect (extended_response or missing options): ${incorrectExtendedResponseCount}`);
  console.log(`Success rate: ${((correctMultipleChoiceCount / nonWritingQuestionsCount) * 100).toFixed(2)}%`);

  if (issues.length > 0) {
    console.log(`\n\n❌ FOUND ${issues.length} NON-WRITING QUESTIONS WITH ISSUES:\n`);
    issues.forEach((q, idx) => {
      console.log(`${idx + 1}. ID: ${q.id}`);
      console.log(`   Test: ${q.test_type}`);
      console.log(`   Section: ${q.section_name}`);
      console.log(`   Sub-skill: ${q.sub_skill}`);
      console.log(`   Response Type: ${q.response_type}`);
      console.log(`   Has Options: ${q.has_options}`);
      console.log(`   Answer Options: ${JSON.stringify(q.answer_options)}`);
      console.log(`   Question: ${q.question_text}...\n`);
    });
  } else {
    console.log('\n\n✅ SUCCESS: ALL non-writing questions are properly configured as multiple choice!');
    console.log('✅ All questions have answer_options arrays');
    console.log('✅ All questions have response_type: "multiple_choice"');
  }

  // Final summary
  console.log('\n\n=== FINAL VERIFICATION SUMMARY ===');
  console.log(`\n1. Deletion Verification:`);
  console.log(`   ${notFoundCount === deletedQuestionIds.length ? '✅' : '❌'} ${notFoundCount}/${deletedQuestionIds.length} questions confirmed deleted`);

  console.log(`\n2. Multiple Choice Verification:`);
  console.log(`   ${issues.length === 0 ? '✅' : '❌'} ${correctMultipleChoiceCount}/${nonWritingQuestionsCount} non-writing questions are multiple choice`);
  console.log(`   ${issues.length === 0 ? '✅' : '❌'} ${issues.length} problematic questions found`);

  console.log(`\n3. Overall Status:`);
  if (notFoundCount === deletedQuestionIds.length && issues.length === 0) {
    console.log(`   ✅ PERFECT! All verifications passed.`);
    console.log(`   ✅ The question format fix is complete and working correctly.`);
  } else {
    console.log(`   ⚠️ Some issues remain - see details above`);
  }
}

verifyDeletionsAndMultipleChoice();
