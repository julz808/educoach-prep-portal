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

async function comprehensiveAudit() {
  console.log('COMPREHENSIVE QUESTION TEXT AUDIT');
  console.log('='.repeat(80));
  console.log();

  // Fetch ALL questions
  const { data: allQuestions, error: questionsError } = await supabase
    .from('questions_v2')
    .select('id, question_text, answer_options, test_type, section_name, passage_id');

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return;
  }

  console.log(`Total questions in database: ${allQuestions?.length || 0}\n`);

  // ========================================================================
  // ISSUE 1: Check for embedded answer options
  // ========================================================================
  console.log('ISSUE 1: EMBEDDED ANSWER OPTIONS IN QUESTION TEXT');
  console.log('='.repeat(80));

  const embeddedOptionPatterns = [
    /\n[aA]\)\s+\w/, // a) followed by text
    /\n[bB]\)\s+\w/, // b) followed by text
    /\n[cC]\)\s+\w/, // c) followed by text
    /\n[dD]\)\s+\w/, // d) followed by text
    /\n[eE]\)\s+\w/, // e) followed by text
    /\n[aA]\.\s+\w/, // a. followed by text
  ];

  const questionsWithEmbeddedOptions: Question[] = [];

  for (const q of allQuestions as Question[]) {
    const text = q.question_text || '';

    // Check if text has multiple choice pattern
    const hasMultipleOptions = (text.match(/\n[aA-eE][\)\.]\s+/g) || []).length >= 2;

    if (hasMultipleOptions) {
      questionsWithEmbeddedOptions.push(q);
    }
  }

  console.log(`Found: ${questionsWithEmbeddedOptions.length} questions with embedded options\n`);

  if (questionsWithEmbeddedOptions.length > 0) {
    // Group by test type
    const byType: { [key: string]: number } = {};
    for (const q of questionsWithEmbeddedOptions) {
      const key = `${q.test_type} - ${q.section_name}`;
      byType[key] = (byType[key] || 0) + 1;
    }

    console.log('Breakdown:');
    for (const [key, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${key}: ${count}`);
    }

    console.log('\nFirst 3 examples:');
    for (let i = 0; i < Math.min(3, questionsWithEmbeddedOptions.length); i++) {
      const q = questionsWithEmbeddedOptions[i];
      console.log(`\n  ID: ${q.id}`);
      console.log(`  ${q.test_type} - ${q.section_name}`);
      console.log(`  Text preview: ${q.question_text.substring(0, 200)}...`);
    }

    console.log(`\n  All IDs: ${questionsWithEmbeddedOptions.map(q => q.id).join(',')}`);
  } else {
    console.log('✅ No questions found with embedded options!');
  }

  console.log('\n');

  // ========================================================================
  // ISSUE 2: Check for duplicate passages in question_text
  // ========================================================================
  console.log('ISSUE 2: DUPLICATE PASSAGES IN QUESTION TEXT');
  console.log('='.repeat(80));

  // Get all passages
  const { data: passages, error: passagesError } = await supabase
    .from('passages_v2')
    .select('id, content, title');

  if (passagesError) {
    console.error('Error fetching passages:', passagesError);
    return;
  }

  console.log(`Total passages in database: ${passages?.length || 0}\n`);

  // Find questions with passage_id
  const questionsWithPassages = (allQuestions as Question[]).filter(q => q.passage_id);
  console.log(`Questions linked to passages: ${questionsWithPassages.length}\n`);

  const questionsWithDuplicatePassage: Array<{
    question: Question;
    passage: Passage;
    hasFullPassageInText: boolean;
    hasPartialPassageInText: boolean;
  }> = [];

  for (const q of questionsWithPassages) {
    // Find the corresponding passage
    const passage = (passages as Passage[]).find(p => p.id === q.passage_id);

    if (!passage) continue;

    const questionText = q.question_text || '';
    const passageText = passage.content || '';

    // Check if the full passage (or significant portion) is in question_text
    // Look for the passage title or significant chunks of passage text
    const hasPassageTitle = passage.title && questionText.includes(passage.title);

    // Check for significant overlap (first 200 chars of passage)
    const passageStart = passageText.substring(0, 200).trim();
    const hasPassageStart = passageStart.length > 50 && questionText.includes(passageStart);

    // Check for "Passage:" or "Read the passage" indicating embedded passage
    const hasPassageIndicator = /Passage:|Read the passage/i.test(questionText);

    // Check if question text is unusually long (likely contains passage)
    const isUnusuallyLong = questionText.length > 800;

    if (hasPassageTitle || hasPassageStart || (hasPassageIndicator && isUnusuallyLong)) {
      questionsWithDuplicatePassage.push({
        question: q,
        passage: passage,
        hasFullPassageInText: hasPassageStart,
        hasPartialPassageInText: hasPassageTitle
      });
    }
  }

  console.log(`Found: ${questionsWithDuplicatePassage.length} questions with duplicate passages\n`);

  if (questionsWithDuplicatePassage.length > 0) {
    // Group by test type
    const byType: { [key: string]: number } = {};
    for (const item of questionsWithDuplicatePassage) {
      const key = `${item.question.test_type} - ${item.question.section_name}`;
      byType[key] = (byType[key] || 0) + 1;
    }

    console.log('Breakdown:');
    for (const [key, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${key}: ${count}`);
    }

    console.log('\nFirst 3 examples:');
    for (let i = 0; i < Math.min(3, questionsWithDuplicatePassage.length); i++) {
      const item = questionsWithDuplicatePassage[i];
      console.log(`\n  Question ID: ${item.question.id}`);
      console.log(`  Passage ID: ${item.passage.id}`);
      console.log(`  Passage Title: ${item.passage.title}`);
      console.log(`  ${item.question.test_type} - ${item.question.section_name}`);
      console.log(`  Question text length: ${item.question.question_text.length} chars`);
      console.log(`  Passage text length: ${item.passage.content.length} chars`);
      console.log(`  Has full passage: ${item.hasFullPassageInText}`);
      console.log(`  Question preview: ${item.question.question_text.substring(0, 150)}...`);
    }

    console.log(`\n  All Question IDs: ${questionsWithDuplicatePassage.map(i => i.question.id).join(',')}`);
  } else {
    console.log('✅ No questions found with duplicate passages!');
  }

  console.log('\n');

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions: ${allQuestions?.length || 0}`);
  console.log(`Questions with embedded options: ${questionsWithEmbeddedOptions.length}`);
  console.log(`Questions with duplicate passages: ${questionsWithDuplicatePassage.length}`);
  console.log(`Questions needing fixes: ${questionsWithEmbeddedOptions.length + questionsWithDuplicatePassage.length}`);
  console.log('='.repeat(80));
}

comprehensiveAudit();
