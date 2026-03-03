import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteMismatchedQuestions() {
  const questionIds = [
    '39b3f949-4e28-4021-a9c6-3f249668b26e', // The Mystery of the Abandoned Laboratory
    '7c04e54e-8cc9-4c35-ad78-e5e9960fd1a7', // The Return of the Wolves
    '06651a6a-f2b0-46a7-a92e-e2d051396c77'  // The Invention That Almost Wasn't
  ];

  console.log('Deleting 3 VIC questions with mismatched passages...\n');

  for (const id of questionIds) {
    const { error } = await supabase
      .from('questions_v2')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting ${id}:`, error);
    } else {
      console.log(`✓ Deleted question ${id}`);
    }
  }

  console.log('\n✓ All mismatched questions deleted');
  console.log('These can be regenerated with the proper passage separation.');
}

deleteMismatchedQuestions();
