import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyFix() {
  const questionId = '06651a6a-f2b0-46a7-a92e-e2d051396c77';

  const { data: question, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, test_type, section_name')
    .eq('id', questionId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== FIXED QUESTION ===\n');
  console.log('Question text:', question.question_text);
  console.log('\nQuestion text length:', question.question_text.length);

  if (question.passage_id) {
    const { data: passage } = await supabase
      .from('passages_v2')
      .select('title, content')
      .eq('id', question.passage_id)
      .single();

    console.log('\n=== PASSAGE (stored separately) ===');
    console.log('Title:', passage?.title);
    console.log('Content length:', passage?.content?.length);
    console.log('\nFirst 200 chars:', passage?.content?.substring(0, 200));
  }
}

verifyFix();
