/**
 * Check the most recent practice test session in detail
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentSession() {
  console.log('🔍 CHECKING MOST RECENT PRACTICE TEST SESSION');
  console.log('='.repeat(80));
  console.log('');

  // Get the most recent completed practice session
  const { data: session } = await supabase
    .from('user_test_sessions')
    .select('*')
    .like('test_mode', 'practice%')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (!session) {
    console.log('No practice sessions found');
    return;
  }

  console.log(`📊 Session: ${session.section_name}`);
  console.log(`   ID: ${session.id}`);
  console.log(`   Test Mode: ${session.test_mode}`);
  console.log(`   Status: ${session.status}`);
  console.log(`   Completed: ${session.completed_at}`);
  console.log('');

  console.log('📋 STORED DATA:');
  console.log(`   final_score: ${session.final_score}%`);
  console.log(`   correct_answers: ${session.correct_answers}`);
  console.log(`   total_questions: ${session.total_questions}`);
  console.log(`   questions_answered: ${session.questions_answered}`);
  console.log('');

  console.log('📝 QUESTION ORDER:');
  if (session.question_order && Array.isArray(session.question_order)) {
    console.log(`   Total questions in order: ${session.question_order.length}`);
    console.log(`   First 5 question IDs:`);
    session.question_order.slice(0, 5).forEach((id, idx) => {
      console.log(`     ${idx + 1}. ${id.substring(0, 16)}...`);
    });
  } else {
    console.log(`   ⚠️  NO question_order!`);
  }
  console.log('');

  console.log('📊 ANSWERS DATA:');
  if (session.answers_data && typeof session.answers_data === 'object') {
    const answerKeys = Object.keys(session.answers_data);
    console.log(`   Total answers stored: ${answerKeys.length}`);
    console.log(`   Answer keys: ${answerKeys.slice(0, 10).join(', ')}...`);
  } else {
    console.log(`   ⚠️  NO answers_data!`);
  }
  console.log('');

  // Check question attempts for this session
  console.log('🔍 QUESTION ATTEMPTS FOR THIS SESSION:');
  const { data: attempts } = await supabase
    .from('question_attempt_history')
    .select('*')
    .eq('session_id', session.id)
    .order('attempted_at');

  console.log(`   Total attempts saved: ${attempts?.length || 0}`);

  if (attempts && attempts.length > 0) {
    console.log(`   First 5 attempts:`);
    attempts.slice(0, 5).forEach((a, idx) => {
      console.log(`     ${idx + 1}. Q: ${a.question_id.substring(0, 16)}... | Answer: ${a.user_answer} | Correct: ${a.is_correct}`);
    });

    const correctCount = attempts.filter(a => a.is_correct).length;
    console.log(`   Correct: ${correctCount}/${attempts.length}`);
  }

  console.log('');

  // Compare
  console.log('❗ COMPARISON:');
  const expectedAttempts = session.question_order?.length || 0;
  const actualAttempts = attempts?.length || 0;
  const storedAnswers = session.answers_data ? Object.keys(session.answers_data).length : 0;

  console.log(`   Questions in test: ${expectedAttempts}`);
  console.log(`   Answers in session.answers_data: ${storedAnswers}`);
  console.log(`   Attempts in question_attempt_history: ${actualAttempts}`);
  console.log('');

  if (actualAttempts < expectedAttempts) {
    console.log(`   ⚠️  MISMATCH: Only ${actualAttempts} of ${expectedAttempts} attempts were saved!`);
    console.log(`   Missing: ${expectedAttempts - actualAttempts} question attempts`);
    console.log('');
    console.log('   This means DeveloperToolsReplicaService did not save all attempts.');
    console.log('   Likely cause: Loop only processed answers_data, not all questions.');
  } else {
    console.log(`   ✅ All attempts saved correctly`);
  }

  console.log('');
  console.log('='.repeat(80));

  // Check what question IDs are in the session vs what got saved
  if (session.question_order && session.answers_data && attempts) {
    console.log('\n🔍 DETAILED MATCH ANALYSIS:\n');

    const questionOrderSet = new Set(session.question_order);
    const answersSet = new Set(Object.keys(session.answers_data).map(idx => {
      const qIndex = parseInt(idx);
      return session.question_order[qIndex];
    }));
    const attemptsSet = new Set(attempts.map(a => a.question_id));

    console.log(`Questions in question_order: ${questionOrderSet.size}`);
    console.log(`Questions with answers in answers_data: ${answersSet.size}`);
    console.log(`Questions with attempts saved: ${attemptsSet.size}`);
    console.log('');

    // Find which questions have answers but no attempts
    const answeredButNotSaved = Array.from(answersSet).filter(qId => !attemptsSet.has(qId));
    if (answeredButNotSaved.length > 0) {
      console.log(`❌ Answered questions WITHOUT saved attempts: ${answeredButNotSaved.length}`);
      console.log(`   Examples: ${answeredButNotSaved.slice(0, 3).map(id => id.substring(0, 12) + '...').join(', ')}`);
    }

    console.log('');
  }

  console.log('='.repeat(80));
}

checkRecentSession().catch(console.error);
