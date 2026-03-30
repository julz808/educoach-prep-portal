import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findQuestion() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .ilike('question_text', '%bacteria%')
    .ilike('question_text', '%triples%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found', data.length, 'questions about bacteria tripling');
  data.forEach((q, i) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`QUESTION ${i+1}`);
    console.log('='.repeat(80));
    console.log('ID:', q.id);
    console.log('Sub-skill:', q.sub_skill);
    console.log('Test type:', q.test_type);
    console.log('\nQuestion:', q.question_text);
    console.log('\nOptions:', JSON.stringify(q.options, null, 2));
    console.log('\nCorrect Answer:', q.correct_answer);
    console.log('\nSolution:', q.solution);
  });
}

findQuestion().catch(console.error);
