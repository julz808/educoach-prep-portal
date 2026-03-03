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
}

async function findQuestionsWithEmbeddedOptions() {
  console.log('Searching for questions with options embedded in question_text...\n');

  // Get all questions
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, answer_options, test_type, section_name');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  // Patterns that indicate options in question text
  const patterns = [
    /\n[aA]\)/, // a) or A)
    /\n[aA]\./, // a. or A.
    /\n[aA]\s+[—\-]/, // a - or a —
    /\([aA]\)/, // (a)
    /^[aA]\)/, // Starting with a)
    /\n\s*[aA]\)\s*\w+/, // a) followed by text
    /\n\s*[aA]\.\s*\w+/, // a. followed by text
  ];

  const problematicQuestions: Question[] = [];
  const examplesByType: { [key: string]: Question[] } = {};

  for (const q of questions as Question[]) {
    const text = q.question_text || '';

    // Check if any pattern matches
    const hasEmbeddedOptions = patterns.some(pattern => pattern.test(text));

    // Also check if the text contains what looks like multiple choice options
    const hasMultipleOptions = (text.match(/\n[aA-dD][\)\.]/g) || []).length >= 2;

    if (hasEmbeddedOptions || hasMultipleOptions) {
      problematicQuestions.push(q);

      const key = `${q.test_type} - ${q.section_name}`;
      if (!examplesByType[key]) {
        examplesByType[key] = [];
      }
      if (examplesByType[key].length < 2) {
        examplesByType[key].push(q);
      }
    }
  }

  console.log(`Found ${problematicQuestions.length} questions with embedded options out of ${questions?.length || 0} total questions\n`);

  // Group by test type and section
  const byTypeAndSection: { [key: string]: number } = {};
  for (const q of problematicQuestions) {
    const key = `${q.test_type} - ${q.section_name}`;
    byTypeAndSection[key] = (byTypeAndSection[key] || 0) + 1;
  }

  console.log('Breakdown by test type and section:');
  console.log('=====================================');
  for (const [key, count] of Object.entries(byTypeAndSection).sort((a, b) => b[1] - a[1])) {
    console.log(`${key}: ${count} questions`);
  }

  console.log('\n\nExample questions from each affected section:');
  console.log('==============================================\n');

  for (const [key, examples] of Object.entries(examplesByType)) {
    console.log(`\n--- ${key} ---`);
    for (const q of examples) {
      console.log(`\nID: ${q.id}`);
      console.log(`Question text (first 500 chars):`);
      console.log(q.question_text.substring(0, 500));
      if (q.question_text.length > 500) console.log('...');
      console.log(`\nAnswer options:`);
      console.log(JSON.stringify(q.answer_options, null, 2));
      console.log('---');
    }
  }

  // Output list of IDs for deletion
  console.log('\n\nQuestion IDs to delete:');
  console.log('=======================');
  console.log(problematicQuestions.map(q => q.id).join(','));

  console.log('\n\nSQL to delete these questions:');
  console.log('==============================');
  console.log(`DELETE FROM questions_v2 WHERE id IN (${problematicQuestions.map(q => `'${q.id}'`).join(',')});`);

  return problematicQuestions;
}

findQuestionsWithEmbeddedOptions();
