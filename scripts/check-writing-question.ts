import { supabase } from '../src/integrations/supabase/client';

async function checkWritingQuestion() {
  // Check if there's a writing question with this ID
  const questionId = '595be7b6-4369-4bf2-bd0c-6e4ada80e516';

  console.log('Checking question:', questionId);

  // Check environment variable
  const useV2 = process.env.VITE_USE_V2_QUESTIONS === 'true';
  console.log('VITE_USE_V2_QUESTIONS:', process.env.VITE_USE_V2_QUESTIONS);
  console.log('Using table:', useV2 ? 'questions_v2' : 'questions');

  // Try questions_v2 first
  console.log('\n=== Checking questions_v2 ===');
  const { data: v2Data, error: v2Error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', questionId)
    .maybeSingle();

  if (v2Error) {
    console.error('Error:', v2Error);
  } else if (v2Data) {
    console.log('\nFound in questions_v2:');
    console.log(JSON.stringify(v2Data, null, 2));
  } else {
    console.log('Not found in questions_v2');
  }

  // Try questions (old table)
  console.log('\n=== Checking questions (old table) ===');
  const { data: v1Data, error: v1Error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .maybeSingle();

  if (v1Error) {
    console.error('Error:', v1Error);
  } else if (v1Data) {
    console.log('\nFound in questions (old table):');
    console.log(JSON.stringify(v1Data, null, 2));

    console.log('\nColumns service is trying to select:');
    console.log('id, question_text, writing_prompt, sub_skill, section_name');
    console.log('\nActual columns available:');
    console.log(Object.keys(v1Data).join(', '));
  } else {
    console.log('Not found in questions (old table)');
  }
}

checkWritingQuestion();
