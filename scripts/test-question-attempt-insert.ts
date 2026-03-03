/**
 * Test script to manually insert into question_attempt_history
 * to find out what's preventing inserts from working
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuestionAttemptInsert() {
  console.log('🧪 TESTING QUESTION ATTEMPT INSERT');
  console.log('='.repeat(80));

  // Get a recent completed session with answers
  const { data: session, error: sessionError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('status', 'completed')
    .not('answers_data', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !session) {
    console.error('❌ Error fetching session:', sessionError);
    return;
  }

  console.log(`\n📝 Found session: ${session.id}`);
  console.log(`   User: ${session.user_id.substring(0, 8)}...`);
  console.log(`   Product: ${session.product_type}`);
  console.log(`   Test Mode: ${session.test_mode}`);
  console.log(`   Section: ${session.section_name}`);
  console.log(`   Answers: ${Object.keys(session.answers_data || {}).length}`);
  console.log('');

  // Get the questions for this session
  if (!session.question_order || !Array.isArray(session.question_order) || session.question_order.length === 0) {
    console.error('❌ No question_order found in session');
    return;
  }

  const questionId = session.question_order[0];
  console.log(`\n🔍 Testing with first question: ${questionId}`);

  // Get the question details
  const { data: question, error: questionError } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', questionId)
    .single();

  if (questionError || !question) {
    console.error('❌ Error fetching question:', questionError);
    return;
  }

  console.log(`   Question text: ${question.question_text?.substring(0, 50)}...`);
  console.log(`   Correct answer: ${question.correct_answer}`);
  console.log('');

  // Try to insert a test attempt
  const sessionType = session.test_mode?.startsWith('practice_') ? 'practice' : session.test_mode;

  const attemptData = {
    user_id: session.user_id,
    question_id: questionId,
    session_id: session.id,
    session_type: sessionType,
    user_answer: 'A', // Test answer
    is_correct: false,
    is_flagged: false,
    is_skipped: false,
    time_spent_seconds: 120
  };

  console.log('🧪 Attempting to insert test record...');
  console.log('   Data:', {
    user_id: attemptData.user_id.substring(0, 8) + '...',
    question_id: attemptData.question_id.substring(0, 8) + '...',
    session_id: attemptData.session_id.substring(0, 8) + '...',
    session_type: attemptData.session_type,
    user_answer: attemptData.user_answer
  });
  console.log('');

  const { data: insertResult, error: insertError } = await supabase
    .from('question_attempt_history')
    .insert(attemptData)
    .select();

  if (insertError) {
    console.error('❌ INSERT FAILED!');
    console.error('   Error code:', insertError.code);
    console.error('   Error message:', insertError.message);
    console.error('   Error details:', insertError.details);
    console.error('   Error hint:', insertError.hint);
    console.error('');

    // Check if it's a foreign key constraint error
    if (insertError.message?.includes('foreign key') || insertError.code === '23503') {
      console.log('🔍 FOREIGN KEY ERROR DETECTED - Checking constraints...\n');

      // Check if question_id exists in questions table
      const { data: questionCheck } = await supabase
        .from('questions_v2')
        .select('id')
        .eq('id', questionId)
        .single();

      console.log(`   ✓ Question ${questionId.substring(0, 8)}... exists in questions_v2: ${!!questionCheck}`);

      // Check if session_id exists in user_test_sessions table
      const { data: sessionCheck } = await supabase
        .from('user_test_sessions')
        .select('id')
        .eq('id', session.id)
        .single();

      console.log(`   ✓ Session ${session.id.substring(0, 8)}... exists in user_test_sessions: ${!!sessionCheck}`);

      // Check the foreign key constraints on the table
      const { data: constraints } = await supabase.rpc('get_table_constraints', {
        table_name: 'question_attempt_history'
      }).catch(() => ({ data: null }));

      console.log('\n🔍 Checking table schema...');

      // Get table info
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'question_attempt_history' })
        .catch(() => ({ data: null, error: 'RPC not found' }));

      if (tableError) {
        console.log('   ⚠️  Could not get table schema via RPC');
        console.log('   Let me check the migration files for foreign key constraints...');
      }
    }
  } else {
    console.log('✅ INSERT SUCCESSFUL!');
    console.log('   Inserted record:', insertResult);
    console.log('');

    // Clean up - delete the test record
    await supabase
      .from('question_attempt_history')
      .delete()
      .eq('user_id', session.user_id)
      .eq('question_id', questionId)
      .eq('session_id', session.id);

    console.log('🧹 Test record deleted');
  }

  console.log('='.repeat(80));
}

testQuestionAttemptInsert().catch(console.error);
