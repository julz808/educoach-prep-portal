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

async function fixNumeracyResponses() {
  console.log('\n🔧 CREATING RESPONSES FOR NUMERACY SESSION\n');

  const targetUserId = '320cf4a6-8914-4a25-8b1c-1007477d9adc';
  const sessionId = '1daa4be7-b2f0-4da9-820e-95938c6b714e';

  // Get session data
  const { data: session } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session || !session.question_order || !session.answers_data) {
    console.log('❌ Invalid session data');
    return;
  }

  const questionOrder = session.question_order as string[];
  const answersData = session.answers_data as Record<string, string>;

  console.log(`📊 Session has ${Object.keys(answersData).length} answers\n`);

  // Get ALL questions in one query
  const { data: questions } = await supabase
    .from('questions_v2')
    .select('id, correct_answer')
    .in('id', questionOrder);

  console.log(`📚 Found ${questions?.length || 0} questions in questions_v2\n`);

  if (!questions || questions.length === 0) {
    console.log('❌ No questions found!');
    return;
  }

  // Create a map for quick lookup
  const questionMap = new Map(questions.map(q => [q.id, q]));

  let successCount = 0;
  let failCount = 0;

  // Create responses for each answer
  for (const [indexStr, answerText] of Object.entries(answersData)) {
    const questionIndex = parseInt(indexStr);
    const questionId = questionOrder[questionIndex];
    const question = questionMap.get(questionId);

    if (!question) {
      console.log(`   ❌ Question ${questionId?.substring(0, 8)}... not in map`);
      failCount++;
      continue;
    }

    // Parse answer letter
    const userAnswerLetter = answerText.trim().charAt(0).toUpperCase();
    if (!'ABCD'.includes(userAnswerLetter)) {
      console.log(`   ⚠️  Invalid answer: ${answerText}`);
      failCount++;
      continue;
    }

    // Calculate correctness
    const userAnswerIndex = userAnswerLetter.charCodeAt(0) - 65;
    const isCorrect = userAnswerIndex === question.correct_answer;

    // Insert response
    const { error } = await supabase
      .from('question_attempt_history')
      .insert({
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
      });

    if (error) {
      console.log(`   ❌ Q${questionIndex}: ${error.message}`);
      failCount++;
    } else {
      console.log(`   ✅ Q${questionIndex}: ${userAnswerLetter} ${isCorrect ? '✓' : '✗'}`);
      successCount++;
    }
  }

  console.log(`\n📊 Final: ${successCount} created, ${failCount} failed\n`);
}

fixNumeracyResponses().catch(console.error);
