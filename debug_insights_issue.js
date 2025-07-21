#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInsightsIssue() {
  console.log('🔍 COMPREHENSIVE INSIGHTS DEBUG AUDIT');
  console.log('=====================================\n');

  // 1. Check if save_question_attempt function exists
  console.log('1. Checking if save_question_attempt function exists...');
  try {
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_name', 'save_question_attempt')
      .eq('routine_type', 'FUNCTION');
    
    if (funcError) {
      console.log('❌ Cannot check functions (expected with anon key):', funcError.message);
    } else {
      console.log('✅ Function check result:', functions);
    }
  } catch (err) {
    console.log('❌ Function check failed:', err.message);
  }

  // 2. Check recent question attempts in last hour
  console.log('\n2. Checking recent question attempts...');
  try {
    const { data: attempts, error: attemptsError } = await supabase
      .from('question_attempt_history')
      .select('*')
      .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('attempted_at', { ascending: false })
      .limit(10);
    
    if (attemptsError) {
      console.log('❌ Question attempts error:', attemptsError);
    } else {
      console.log(`✅ Found ${attempts?.length || 0} recent question attempts`);
      if (attempts && attempts.length > 0) {
        console.log('Recent attempts:', attempts.map(a => ({
          user_id: a.user_id,
          session_id: a.session_id,
          is_correct: a.is_correct,
          attempted_at: a.attempted_at
        })));
      }
    }
  } catch (err) {
    console.log('❌ Question attempts check failed:', err.message);
  }

  // 3. Check recent test sessions
  console.log('\n3. Checking recent test sessions...');
  try {
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_test_sessions')
      .select('id, user_id, test_mode, section_name, status, correct_answers, total_questions, questions_answered, created_at')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sessionsError) {
      console.log('❌ Test sessions error:', sessionsError);
    } else {
      console.log(`✅ Found ${sessions?.length || 0} recent test sessions`);
      if (sessions && sessions.length > 0) {
        sessions.forEach(session => {
          console.log(`  Session ${session.id}:`);
          console.log(`    Mode: ${session.test_mode}, Section: ${session.section_name}`);
          console.log(`    Status: ${session.status}`);
          console.log(`    Score: ${session.correct_answers}/${session.total_questions}`);
          console.log(`    Answered: ${session.questions_answered}`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Test sessions check failed:', err.message);
  }

  // 4. Test if we can call save_question_attempt function
  console.log('\n4. Testing save_question_attempt function call...');
  try {
    // Get a sample question and user for testing
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .limit(1);
    
    const { data: sessions } = await supabase
      .from('user_test_sessions')
      .select('id, user_id')
      .limit(1);

    if (questions && questions.length > 0 && sessions && sessions.length > 0) {
      const { data, error } = await supabase.rpc('save_question_attempt', {
        p_user_id: sessions[0].user_id,
        p_question_id: questions[0].id,
        p_session_id: sessions[0].id,
        p_user_answer: 'A',
        p_is_correct: true,
        p_is_flagged: false,
        p_is_skipped: false,
        p_time_spent_seconds: 30
      });
      
      if (error) {
        console.log('❌ Function call failed:', error);
        console.log('   This likely means the function does not exist in production!');
      } else {
        console.log('✅ Function call succeeded:', data);
        // Clean up test record
        await supabase
          .from('question_attempt_history')
          .delete()
          .eq('user_id', sessions[0].user_id)
          .eq('question_id', questions[0].id)
          .eq('session_id', sessions[0].id);
      }
    } else {
      console.log('⚠️  No sample data found for testing function');
    }
  } catch (err) {
    console.log('❌ Function test failed:', err.message);
  }

  // 5. Check answers_data structure in recent sessions
  console.log('\n5. Checking answers_data structure...');
  try {
    const { data: sessionsWithAnswers, error } = await supabase
      .from('user_test_sessions')
      .select('id, section_name, answers_data, question_order, correct_answers, total_questions')
      .not('answers_data', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.log('❌ Answers data check error:', error);
    } else {
      console.log(`✅ Found ${sessionsWithAnswers?.length || 0} sessions with answers_data`);
      if (sessionsWithAnswers && sessionsWithAnswers.length > 0) {
        sessionsWithAnswers.forEach(session => {
          console.log(`  Session ${session.id} (${session.section_name}):`);
          console.log(`    Has answers_data: ${!!session.answers_data}`);
          console.log(`    Has question_order: ${!!session.question_order}`);
          console.log(`    Score recorded: ${session.correct_answers}/${session.total_questions}`);
          if (session.answers_data) {
            const answerCount = Object.keys(session.answers_data).length;
            console.log(`    Answers in data: ${answerCount}`);
          }
        });
      }
    }
  } catch (err) {
    console.log('❌ Answers data check failed:', err.message);
  }

  console.log('\n=====================================');
  console.log('🎯 DIAGNOSIS COMPLETE');
  console.log('=====================================');
}

debugInsightsIssue()
  .then(() => {
    console.log('\n✅ Debug audit complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Debug audit failed:', err);
    process.exit(1);
  });