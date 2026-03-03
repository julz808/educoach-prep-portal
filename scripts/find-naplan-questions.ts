import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findNaplanQuestions() {
  console.log('🔍 Searching for NAPLAN questions...\n');

  // Search for questions with NAPLAN in test_type
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name')
    .ilike('test_type', '%naplan%')
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} NAPLAN questions\n`);

  if (questions && questions.length > 0) {
    // Get unique combinations
    const uniqueCombos = new Set(questions.map(q => `${q.test_type} | ${q.section_name}`));

    console.log('Test type | Section combinations:');
    Array.from(uniqueCombos).sort().forEach(combo => {
      const count = questions.filter(q => `${q.test_type} | ${q.section_name}` === combo).length;
      console.log(`  ${combo} (${count} questions)`);
    });
  } else {
    console.log('No NAPLAN questions found. Let me search all test types...\n');

    const { data: allQuestions } = await supabase
      .from('questions_v2')
      .select('test_type')
      .limit(2000);

    const uniqueTypes = new Set(allQuestions?.map(q => q.test_type) || []);
    console.log('All unique test types:');
    Array.from(uniqueTypes).sort().forEach(type => console.log(`  - ${type}`));
  }
}

findNaplanQuestions();
