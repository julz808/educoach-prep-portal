import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugQuestionMismatch() {
  console.log('\n🔍 DEBUGGING QUESTION ID MISMATCH\n');

  const sessionId = '1daa4be7-b2f0-4da9-820e-95938c6b714e';

  // Get session
  const { data: session } = await supabase
    .from('user_test_sessions')
    .select('question_order, answers_data')
    .eq('id', sessionId)
    .single();

  if (!session || !session.question_order) {
    console.log('❌ No session or question_order');
    return;
  }

  const questionOrder = session.question_order as string[];
  const answersData = session.answers_data as Record<string, string>;

  console.log(`📊 Session has ${questionOrder.length} questions in question_order`);
  console.log(`📊 Session has ${Object.keys(answersData).length} answers\n`);

  console.log('First 10 question IDs from session:');
  questionOrder.slice(0, 10).forEach((id, i) => {
    const hasAnswer = answersData[i.toString()] !== undefined;
    console.log(`  ${i}. ${id} ${hasAnswer ? '(answered)' : ''}`);
  });

  // Check if these IDs exist in questions_v2
  console.log('\n🔍 Checking if these IDs exist in questions_v2...\n');

  const firstTenIds = questionOrder.slice(0, 10);

  for (const id of firstTenIds) {
    const { data: inV2 } = await supabase
      .from('questions_v2')
      .select('id, section_name, sub_skill')
      .eq('id', id)
      .single();

    const { data: inV1 } = await supabase
      .from('questions')
      .select('id, section_name, sub_skill')
      .eq('id', id)
      .single();

    console.log(`ID: ${id.substring(0, 8)}...`);
    console.log(`  In questions_v2: ${inV2 ? '✅ YES' : '❌ NO'}`);
    console.log(`  In questions (old): ${inV1 ? '✅ YES' : '❌ NO'}`);
    if (inV2) {
      console.log(`  Details: ${inV2.section_name} - ${inV2.sub_skill}`);
    } else if (inV1) {
      console.log(`  Details: ${inV1.section_name} - ${inV1.sub_skill}`);
    }
    console.log();
  }

  // Check error ID specifically
  const errorId = '80e4a1a5-60ec-4a36-a1db-0a9da40bdb93';
  console.log(`\n🔍 Checking error ID: ${errorId}\n`);

  const { data: errorInV2 } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', errorId)
    .single();

  const { data: errorInV1 } = await supabase
    .from('questions')
    .select('*')
    .eq('id', errorId)
    .single();

  console.log(`  In questions_v2: ${errorInV2 ? '✅ YES' : '❌ NO'}`);
  console.log(`  In questions (old): ${errorInV1 ? '✅ YES' : '❌ NO'}`);

  if (questionOrder.includes(errorId)) {
    console.log(`  In session question_order: ✅ YES`);
  } else {
    console.log(`  In session question_order: ❌ NO`);
  }
}

debugQuestionMismatch().catch(console.error);
