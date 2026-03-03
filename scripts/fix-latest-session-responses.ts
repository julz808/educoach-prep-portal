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

async function fixLatestSession() {
  console.log('\n🔧 FIXING LATEST SESSION RESPONSES\n');

  const targetUserId = '320cf4a6-8914-4a25-8b1c-1007477d9adc';
  const sessionId = '1daa4be7-b2f0-4da9-820e-95938c6b714e';

  // Get session data
  const { data: session } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    console.log('❌ Session not found');
    return;
  }

  console.log('📊 Session found:');
  console.log(`   Section: ${session.section_name}`);
  console.log(`   Answers: ${session.answers_data ? Object.keys(session.answers_data).length : 0}`);
  console.log(`   Question order: ${session.question_order ? session.question_order.length : 0}`);

  if (!session.question_order || !session.answers_data) {
    console.log('❌ Missing question_order or answers_data');
    return;
  }

  const questionOrder = session.question_order as string[];
  const answersData = session.answers_data as Record<string, string>;

  let successCount = 0;
  let failCount = 0;

  // Create responses for each answer
  for (const [indexStr, answerText] of Object.entries(answersData)) {
    const questionIndex = parseInt(indexStr);
    const questionId = questionOrder[questionIndex];

    if (!questionId) {
      console.log(`   ⚠️  No question ID for index ${questionIndex}`);
      failCount++;
      continue;
    }

    // Get the question from questions_v2 table (not questions!)
    const { data: question, error: questionError } = await supabase
      .from('questions_v2')
      .select('correct_answer, options')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      console.log(`   ⚠️  Question ${questionId.substring(0, 8)}... not found in questions_v2`);
      failCount++;
      continue;
    }

    // Parse the answer (format is "A) text" or just "A")
    let userAnswerLetter = answerText.trim().charAt(0).toUpperCase();
    if (!'ABCD'.includes(userAnswerLetter)) {
      console.log(`   ⚠️  Invalid answer format: ${answerText}`);
      failCount++;
      continue;
    }

    // Convert letter to index (A=0, B=1, C=2, D=3)
    const userAnswerIndex = userAnswerLetter.charCodeAt(0) - 65;
    const isCorrect = userAnswerIndex === question.correct_answer;

    const attemptData = {
      user_id: targetUserId,
      question_id: questionId,
      session_id: sessionId,
      session_type: 'practice',
      user_answer: userAnswerLetter,
      is_correct: isCorrect,
      is_flagged: false,
      is_skipped: false,
      time_spent_seconds: 120,
      attempted_at: session.completed_at || session.created_at
    };

    const { error: insertError } = await supabase
      .from('question_attempt_history')
      .insert(attemptData);

    if (insertError) {
      console.log(`   ❌ Failed to insert response ${questionIndex}: ${insertError.message}`);
      failCount++;
    } else {
      successCount++;
      console.log(`   ✅ Created response ${questionIndex}: ${userAnswerLetter} (${isCorrect ? 'correct' : 'wrong'})`);
    }
  }

  console.log(`\n📊 Results: ${successCount} created, ${failCount} failed\n`);

  if (successCount > 0) {
    console.log('✅ Responses created! Now check insights page.\n');
  }
}

fixLatestSession().catch(console.error);
