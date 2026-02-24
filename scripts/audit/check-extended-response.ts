import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExtendedResponse() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('response_type', 'extended_response')
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  data?.forEach((q: any, i: number) => {
    console.log(`\n=== Question ${i + 1} ===`);
    console.log('ID:', q.id);
    console.log('Question:', q.question_text?.substring(0, 100) + '...');
    console.log('Response Type:', q.response_type);
    console.log('Answer Options:', q.answer_options);
    console.log('Correct Answer:', q.correct_answer);
  });
}

checkExtendedResponse();
