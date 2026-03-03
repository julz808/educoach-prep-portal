import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findQuestion() {
  console.log('🔍 Searching for the specific question about numbers in a grid...\n');

  // Search for questions with this exact pattern
  const searchTerms = [
    'numbers in the grid go together in a certain way',
    'number should be in the square marked by the question mark',
    '5 10 15',
    '8 13 18',
    '11 16 ?'
  ];

  for (const term of searchTerms) {
    console.log(`Searching for: "${term}"`);

    const { data, error } = await supabase
      .from('questions_v2')
      .select('*')
      .ilike('question_text', `%${term}%`);

    if (error) {
      console.error('Error:', error);
      continue;
    }

    if (data && data.length > 0) {
      console.log(`\n✅ Found ${data.length} matches!`);
      data.forEach(q => {
        console.log(`\n  ID: ${q.id}`);
        console.log(`  Test: ${q.test_type}`);
        console.log(`  Section: ${q.section_name}`);
        console.log(`  Mode: ${q.test_mode}`);
        console.log(`  Question: ${q.question_text}`);
        console.log(`  Options: ${JSON.stringify(q.answer_options)}`);
        console.log(`  Created: ${new Date(q.created_at).toLocaleString()}`);
      });
    } else {
      console.log('  No matches found');
    }
    console.log();
  }

  // Also check if there are any questions with these specific numbers in answer options
  console.log('\nSearching for questions with options "5 10 15"...');

  const { data: allQuestions } = await supabase
    .from('questions_v2')
    .select('*');

  const matchingQuestions = allQuestions?.filter(q => {
    const optionsStr = JSON.stringify(q.answer_options || {}).toLowerCase();
    return optionsStr.includes('5') && optionsStr.includes('10') && optionsStr.includes('15');
  });

  if (matchingQuestions && matchingQuestions.length > 0) {
    console.log(`\nFound ${matchingQuestions.length} questions with these numbers:`);
    matchingQuestions.forEach(q => {
      console.log(`\n  ID: ${q.id}`);
      console.log(`  Test: ${q.test_type}`);
      console.log(`  Section: ${q.section_name}`);
      console.log(`  Mode: ${q.test_mode}`);
      console.log(`  Question: ${q.question_text.substring(0, 200)}...`);
    });
  }
}

async function main() {
  await findQuestion();
}

main();
