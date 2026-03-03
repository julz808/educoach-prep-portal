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

async function fixMissingResponses() {
  console.log('\n🔧 FIXING MISSING RESPONSES\n');

  const targetUserId = '320cf4a6-8914-4a25-8b1c-1007477d9adc';

  // Get all completed practice sessions that have answers_data but no responses
  const { data: sessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('status', 'completed')
    .like('test_mode', 'practice_%')
    .not('answers_data', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (sessionsError || !sessions) {
    console.error('❌ Error fetching sessions:', sessionsError);
    return;
  }

  console.log(`📊 Found ${sessions.length} completed sessions with answers_data\n`);

  for (const session of sessions) {
    console.log(`\n🔍 Checking session ${session.id.substring(0, 8)}...`);
    console.log(`   Section: ${session.section_name}, Test Mode: ${session.test_mode}`);
    console.log(`   Answers in session: ${session.answers_data ? Object.keys(session.answers_data).length : 0}`);

    // Check if responses already exist
    const { data: existingResponses } = await supabase
      .from('question_attempt_history')
      .select('id')
      .eq('session_id', session.id);

    if (existingResponses && existingResponses.length > 0) {
      console.log(`   ✓ Already has ${existingResponses.length} responses - skipping`);
      continue;
    }

    console.log(`   ❌ Missing responses - will create them`);

    if (!session.question_order || !Array.isArray(session.question_order)) {
      console.log(`   ⚠️  No question_order found - cannot create responses`);
      continue;
    }

    const questionOrder = session.question_order as string[];
    const answersData = session.answers_data as Record<string, string>;

    console.log(`   📝 Question order: ${questionOrder.length} questions`);
    console.log(`   📝 Answers data: ${Object.keys(answersData).length} answers`);

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

      // Get the question to check correct answer
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('correct_answer, options')
        .eq('id', questionId)
        .single();

      if (questionError || !question) {
        console.log(`   ⚠️  Question ${questionId.substring(0, 8)}... not found`);
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
        session_id: session.id,
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
        console.log(`   ❌ Failed to insert response for question ${questionIndex}: ${insertError.message}`);
        failCount++;
      } else {
        successCount++;
      }
    }

    console.log(`   📊 Results: ${successCount} created, ${failCount} failed`);
  }

  console.log('\n✅ Fix complete!\n');
}

fixMissingResponses().catch(console.error);
