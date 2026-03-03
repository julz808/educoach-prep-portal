import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const remainingIds = [
  "fbc08706-a564-4061-881b-69a978b9f392",
  "cb96197c-da94-401c-872f-9ca2bd726e38",
  "48c1a39a-b75f-4875-b38e-d6b4791ca33e",
  "6db49112-92ba-4ade-91cd-4aebf8c4a9f8",
  "ae321a4d-2b5e-4aaf-9ce6-c229723da83b",
  "f9feb86f-8a0a-4e53-8523-76a6f9c29b3c",
  "fcbfa39d-c352-4f3a-90be-fca5e51250bf",
  "c3f8c9ec-6ee5-4d98-8cd6-43d15f2463ef",
  "1c013a8f-ecbc-4b74-acab-0b05cdc8b6b0",
];

async function investigateRemainingQuestions() {
  console.log('Investigating remaining 9 questions...\n');

  for (const id of remainingIds) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching ${id}:`, error);
      continue;
    }

    console.log('\n=================================');
    console.log(`ID: ${id}`);
    console.log(`Section: ${data.section_name}`);
    console.log(`Test Type: ${data.test_type}`);
    console.log(`\nQuestion Text:`);
    console.log(data.question_text);
    console.log(`\nPassage ID: ${data.passage_id}`);
    console.log(`Answer Options: ${JSON.stringify(data.answer_options)}`);
    console.log(`Correct Answer: ${data.correct_answer}`);

    // Check if there's a passage
    if (data.passage_id) {
      const { data: passage } = await supabase
        .from('passages_v2')
        .select('content')
        .eq('id', data.passage_id)
        .single();

      if (passage) {
        console.log(`\nPassage (first 300 chars):`);
        console.log(passage.content.substring(0, 300) + '...');
      }
    }
  }
}

investigateRemainingQuestions();
