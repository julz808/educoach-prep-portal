import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkQuestion() {
  const questionId = '06651a6a-f2b0-46a7-a92e-e2d051396c77'; // From the duplicate passages found

  const { data: question, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', questionId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== FULL QUESTION ===\n');
  console.log('ID:', question.id);
  console.log('Test Type:', question.test_type);
  console.log('Section:', question.section_name);
  console.log('Sub-skill:', question.sub_skill);
  console.log('Passage ID:', question.passage_id);
  console.log('\n=== QUESTION TEXT ===');
  console.log(question.question_text);
  console.log('\n=== END ===');
  console.log('\nQuestion text length:', question.question_text.length);

  // Also check the passage
  if (question.passage_id) {
    const { data: passage, error: passageError } = await supabase
      .from('passages_v2')
      .select('*')
      .eq('id', question.passage_id)
      .single();

    if (!passageError && passage) {
      console.log('\n=== PASSAGE FROM PASSAGES_V2 ===');
      console.log('Title:', passage.title);
      console.log('Content length:', passage.content?.length || 0);
      console.log('\nPassage content:');
      console.log(passage.content?.substring(0, 500) || 'N/A');
    }
  }
}

checkQuestion();
