import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All problematic question IDs identified in the analysis
const PROBLEMATIC_QUESTION_IDS = [
  // High Priority (long + hallucinations)
  '092baaa1-6bfa-43c6-91d0-06b5650ee73f',
  '4f397f52-ac63-4c83-b0ec-19a81f52841b',
  '5903229c-d313-4a42-8055-632cfb2b1998',
  '7200ea4d-2cb4-4f4a-9975-d77fe9a1f45e',

  // Medium Priority (hallucinations but reasonable length)
  '172b90f0-2cd5-4bf2-a7b9-1b849e18278d',
  '247f158e-48f7-4c88-bdf9-4e0c85b32456',
  '42f0a277-9314-4be6-bd17-8b38870911c3',

  // Low Priority (long but no hallucinations)
  '3cce0632-6310-4933-94c6-ff3afb867e15',
  '41178c86-5451-49fd-a1d6-57c48e9ee6ba',
  '45b05da3-faea-4d2c-8281-c667cdd66323',
  '4a99ea5d-8745-43fa-bc91-a20eee58a089',
  '5c17b90a-1e66-4c10-bb51-2896c6df5d95',
  '77af9c7f-384f-468f-b77e-35c94e1e81cf',
  '7eb9e62b-7b81-497d-b7be-346a6b08b687'
];

async function deleteProblematicQuestions() {
  console.log('🗑️  Deleting problematic questions from questions_v2...\n');
  console.log(`Total questions to delete: ${PROBLEMATIC_QUESTION_IDS.length}\n`);

  // First, let's verify these questions exist and show what we're deleting
  console.log('📋 Fetching question details before deletion...\n');

  const { data: questions, error: fetchError } = await supabase
    .from('questions_v2')
    .select('id, test_type, section_name, sub_skill')
    .in('id', PROBLEMATIC_QUESTION_IDS);

  if (fetchError) {
    console.error('❌ Error fetching questions:', fetchError);
    return;
  }

  if (!questions || questions.length === 0) {
    console.log('⚠️  No questions found with these IDs. They may have already been deleted.');
    return;
  }

  console.log(`Found ${questions.length} questions to delete:\n`);
  questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q.id}`);
    console.log(`   Test: ${q.test_type}`);
    console.log(`   Section: ${q.section_name}`);
    console.log(`   Sub-skill: ${q.sub_skill}\n`);
  });

  console.log('⏳ Proceeding with deletion...\n');

  // Delete the questions
  const { error: deleteError } = await supabase
    .from('questions_v2')
    .delete()
    .in('id', PROBLEMATIC_QUESTION_IDS);

  if (deleteError) {
    console.error('❌ Error deleting questions:', deleteError);
    return;
  }

  console.log(`✅ Successfully deleted ${questions.length} problematic questions!\n`);

  // Verify deletion
  const { count } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Remaining questions in database: ${count}`);
}

deleteProblematicQuestions();
