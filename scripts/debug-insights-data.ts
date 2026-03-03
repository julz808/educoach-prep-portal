/**
 * Debug script to check Insights data mismatch
 *
 * This script checks:
 * 1. What's stored in user_test_sessions table
 * 2. What's in question_attempt_history table
 * 3. What Insights analytics service calculates
 * 4. Comparison between test results and insights display
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

// Use v2 questions table
const QUESTIONS_TABLE = 'questions_v2';

async function debugInsightsData() {
  console.log('🔍 INSIGHTS DATA DEBUG REPORT');
  console.log('=' .repeat(80));
  console.log('');

  // Get the most recent user who completed tests
  const { data: recentSessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(10);

  if (sessionsError) {
    console.error('❌ Error fetching sessions:', sessionsError);
    return;
  }

  if (!recentSessions || recentSessions.length === 0) {
    console.log('⚠️  No completed sessions found');
    return;
  }

  // Group by user and product
  const userProducts = new Map<string, Set<string>>();
  recentSessions.forEach(session => {
    if (!userProducts.has(session.user_id)) {
      userProducts.set(session.user_id, new Set());
    }
    userProducts.get(session.user_id)!.add(session.product_type);
  });

  // Analyze the first user/product combination
  const [userId, products] = Array.from(userProducts.entries())[0];
  const productType = Array.from(products)[0];

  console.log(`📊 Analyzing user: ${userId.substring(0, 8)}...`);
  console.log(`📦 Product: ${productType}`);
  console.log('');

  // Get all sessions for this user/product
  const { data: allSessions, error: allSessionsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (allSessionsError || !allSessions) {
    console.error('❌ Error fetching all sessions:', allSessionsError);
    return;
  }

  console.log(`📝 Found ${allSessions.length} completed sessions`);
  console.log('');

  // Check each session
  for (const session of allSessions.slice(0, 5)) { // Check first 5 sessions
    console.log('-'.repeat(80));
    console.log(`\n🎯 SESSION: ${session.section_name || 'Unknown Section'}`);
    console.log(`   Test Mode: ${session.test_mode}`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Completed: ${session.completed_at || session.updated_at}`);
    console.log('');

    // 1. Check what's in the session record
    console.log('   📋 SESSION RECORD (user_test_sessions table):');
    console.log(`      - final_score: ${session.final_score}`);
    console.log(`      - correct_answers: ${session.correct_answers}`);
    console.log(`      - total_questions: ${session.total_questions}`);
    console.log(`      - questions_answered: ${session.questions_answered}`);
    console.log(`      - questions_correct: ${session.questions_correct}`);
    console.log('');

    // 2. Check question_attempt_history
    const { data: attempts, error: attemptsError } = await supabase
      .from('question_attempt_history')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', session.id);

    if (!attemptsError && attempts) {
      const correctAttempts = attempts.filter(a => a.is_correct).length;
      console.log(`   ✅ QUESTION ATTEMPTS (question_attempt_history table):`);
      console.log(`      - Total attempts: ${attempts.length}`);
      console.log(`      - Correct: ${correctAttempts}`);
      console.log(`      - Incorrect: ${attempts.length - correctAttempts}`);
      console.log(`      - Calculated accuracy: ${attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0}%`);
      console.log('');

      // Check for mismatch
      if (session.correct_answers !== correctAttempts) {
        console.log(`   ⚠️  MISMATCH DETECTED!`);
        console.log(`      - Session says: ${session.correct_answers} correct`);
        console.log(`      - Attempts say: ${correctAttempts} correct`);
        console.log(`      - DIFFERENCE: ${Math.abs((session.correct_answers || 0) - correctAttempts)}`);
        console.log('');
      }

      if (session.total_questions !== attempts.length) {
        console.log(`   ⚠️  TOTAL QUESTIONS MISMATCH!`);
        console.log(`      - Session says: ${session.total_questions} total`);
        console.log(`      - Attempts say: ${attempts.length} total`);
        console.log('');
      }
    } else {
      console.log(`   ❌ Error fetching attempts:`, attemptsError);
      console.log('');
    }

    // 3. Check writing assessments if it's a writing section
    const isWritingSection = session.section_name?.toLowerCase().includes('writing') ||
                            session.section_name?.toLowerCase().includes('written expression');

    if (isWritingSection) {
      const { data: assessments, error: assessError } = await supabase
        .from('writing_assessments')
        .select('*')
        .eq('session_id', session.id);

      if (!assessError && assessments && assessments.length > 0) {
        const totalPossible = assessments.reduce((sum, a) => sum + (a.max_possible_score || 0), 0);
        const totalEarned = assessments.reduce((sum, a) => sum + (a.total_score || 0), 0);

        console.log(`   ✍️  WRITING ASSESSMENTS (writing_assessments table):`);
        console.log(`      - Number of assessments: ${assessments.length}`);
        console.log(`      - Total possible score: ${totalPossible}`);
        console.log(`      - Total earned score: ${totalEarned}`);
        console.log(`      - Percentage: ${totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0}%`);
        console.log('');
      }
    }

    // 4. Get actual questions for this section from database
    const { data: sectionQuestions, error: questionsError } = await supabase
      .from(QUESTIONS_TABLE)
      .select('id, max_points, sub_skill')
      .eq('product_type', productType)
      .eq('test_mode', session.test_mode)
      .eq('section_name', session.section_name);

    if (!questionsError && sectionQuestions) {
      const totalMaxPoints = sectionQuestions.reduce((sum, q) => sum + (q.max_points || 1), 0);
      console.log(`   📚 QUESTIONS IN DATABASE (${QUESTIONS_TABLE} table):`);
      console.log(`      - Total questions: ${sectionQuestions.length}`);
      console.log(`      - Total max_points: ${totalMaxPoints}`);
      console.log(`      - Average points per question: ${sectionQuestions.length > 0 ? (totalMaxPoints / sectionQuestions.length).toFixed(1) : 0}`);
      console.log('');
    } else {
      console.log(`   ⚠️  No questions found in database for this section`);
      console.log('');
    }

    // 5. Simulate what Insights would calculate
    console.log(`   🔮 WHAT INSIGHTS WOULD SHOW:`);
    if (!attemptsError && attempts) {
      const correctFromAttempts = attempts.filter(a => a.is_correct).length;
      const totalFromAttempts = attempts.length;

      // Get actual max_points for correct calculation
      if (!questionsError && sectionQuestions) {
        const totalMaxPoints = sectionQuestions.reduce((sum, q) => sum + (q.max_points || 1), 0);
        const scorePercentage = totalMaxPoints > 0 ? Math.round((correctFromAttempts / totalMaxPoints) * 100) : 0;
        const accuracyPercentage = totalFromAttempts > 0 ? Math.round((correctFromAttempts / totalFromAttempts) * 100) : 0;

        console.log(`      - Score: ${correctFromAttempts}/${totalMaxPoints} = ${scorePercentage}%`);
        console.log(`      - Accuracy: ${correctFromAttempts}/${totalFromAttempts} = ${accuracyPercentage}%`);
      }
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('\n✅ Debug report complete');
}

debugInsightsData().catch(console.error);
