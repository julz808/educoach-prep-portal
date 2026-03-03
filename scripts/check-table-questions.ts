import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkTableQuestions() {
  console.log('Searching for questions with markdown table formatting...\n');

  // Search for all questions first, then filter in memory for markdown table pattern
  const { data: allQuestions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, visual_svg, test_type, section_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Filter for questions containing table patterns in question_text
  const tableInQuestionText = allQuestions?.filter(q =>
    q.question_text?.includes('|')
  ) || [];

  // Filter for questions containing table patterns in visual_svg
  const tableInVisualSvg = allQuestions?.filter(q =>
    q.visual_svg?.includes('|') || q.visual_svg?.includes('<table') || q.visual_svg?.includes('---')
  ) || [];

  console.log(`Found ${tableInQuestionText.length} questions with pipe characters in question_text`);
  console.log(`Found ${tableInVisualSvg.length} questions with table-like content in visual_svg\n`);

  const tableQuestions = [...tableInQuestionText, ...tableInVisualSvg];

  // Remove duplicates
  const uniqueTableQuestions = Array.from(new Map(tableQuestions.map(q => [q.id, q])).values());

  if (uniqueTableQuestions.length === 0) {
    console.log('No questions found with table formatting');
    return;
  }

  console.log(`Found ${uniqueTableQuestions.length} unique questions with table formatting:\n`);

  // Show first 5 as examples
  uniqueTableQuestions.slice(0, 5).forEach((q, index) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Question ${index + 1} of ${uniqueTableQuestions.length}:`);
    console.log(`ID: ${q.id}`);
    console.log(`Test Type: ${q.test_type}`);
    console.log(`Section: ${q.section_name}`);

    if (q.question_text?.includes('|')) {
      console.log(`\n[TABLE IN QUESTION_TEXT]`);
      console.log(`Question Text:`);
      console.log(q.question_text);
    }

    if (q.visual_svg?.includes('|') || q.visual_svg?.includes('<table') || q.visual_svg?.includes('---')) {
      console.log(`\n[TABLE IN VISUAL_SVG]`);
      console.log(`Visual SVG (first 500 chars):`);
      console.log(q.visual_svg?.substring(0, 500));
    }

    console.log(`${'='.repeat(80)}\n`);
  });

  console.log(`\nTotal questions with tables: ${uniqueTableQuestions.length}`);
  console.log(`\nBreakdown by test type:`);

  const byTestType = uniqueTableQuestions.reduce((acc, q) => {
    acc[q.test_type] = (acc[q.test_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byTestType).forEach(([testType, count]) => {
    console.log(`  ${testType}: ${count} questions`);
  });
}

checkTableQuestions();
