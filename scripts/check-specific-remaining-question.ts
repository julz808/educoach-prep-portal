import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSpecific() {
  // Check one of the remaining issue IDs from the verification output
  const testIds = [
    '0e8d37bd-3608-4266-9633-04d9e817deb1',
    'bf429481-5b4f-4691-bc24-cd0992b0f270',
    '79dddcb6-b8b8-4025-8e3e-0be8f81e31a3'
  ];

  for (const id of testIds) {
    const { data: question } = await supabase
      .from('questions_v2')
      .select('id, question_text, passage_id, test_type, section_name')
      .eq('id', id)
      .single();

    if (question) {
      console.log('Question ID:', question.id);
      console.log('Test:', question.test_type, '|', question.section_name);
      console.log('Passage ID:', question.passage_id);
      console.log('Question length:', question.question_text.length, 'chars');
      console.log();
      console.log('Question text:');
      console.log('='.repeat(100));
      console.log(question.question_text);
      console.log('='.repeat(100));
      console.log();

      // Check if passage exists
      if (question.passage_id) {
        const { data: passage } = await supabase
          .from('passages_v2')
          .select('id, title, content')
          .eq('id', question.passage_id)
          .single();

        if (passage) {
          console.log('Passage found:');
          console.log('  Title:', passage.title);
          console.log('  Content length:', passage.content.length, 'chars');
          console.log('  Content preview:', passage.content.substring(0, 200));
          console.log();

          // Check if passage content is in question text
          const passageStart = passage.content.substring(0, 100);
          const isInQuestion = question.question_text.includes(passageStart);
          console.log('  Passage content IS in question text:', isInQuestion);
        } else {
          console.log('  ⚠️  Passage NOT found in database!');
        }
      }

      console.log();
      console.log('-'.repeat(100));
      console.log();
    }
  }
}

checkSpecific();
