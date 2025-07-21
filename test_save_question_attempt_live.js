#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLiveSaveQuestionAttempt() {
  console.log('🧪 TESTING save_question_attempt FUNCTION');
  console.log('=========================================\n');

  try {
    // 1. First, get the most recent test session
    const { data: sessions, error: sessionError } = await supabase
      .from('user_test_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (sessionError || !sessions || sessions.length === 0) {
      console.log('❌ No test sessions found. Please take a test first.');
      return;
    }

    const session = sessions[0];
    console.log('📋 Found session:', {
      id: session.id,
      test_mode: session.test_mode,
      section_name: session.section_name,
      status: session.status,
      created_at: session.created_at
    });

    // 2. Get a sample question
    const { data: questions, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);
    
    if (questionError || !questions || questions.length === 0) {
      console.log('❌ No questions found');
      return;
    }

    const questionId = questions[0].id;
    console.log('📋 Found question:', questionId);

    // 3. Try to call save_question_attempt with the real session data
    console.log('\n🔧 Testing save_question_attempt with real data...');
    const { data, error } = await supabase.rpc('save_question_attempt', {
      p_user_id: session.user_id,
      p_question_id: questionId,
      p_session_id: session.id,
      p_user_answer: 'B',
      p_is_correct: false,
      p_is_flagged: false,
      p_is_skipped: false,
      p_time_spent_seconds: 45
    });
    
    if (error) {
      console.log('❌ Function call failed:', error);
      console.log('   Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Function call succeeded!');
      
      // 4. Verify the record was created
      const { data: attempts, error: verifyError } = await supabase
        .from('question_attempt_history')
        .select('*')
        .eq('session_id', session.id)
        .eq('question_id', questionId);
      
      if (verifyError) {
        console.log('❌ Could not verify record:', verifyError);
      } else {
        console.log('✅ Verification - Found', attempts.length, 'attempt records');
        if (attempts.length > 0) {
          console.log('   Latest attempt:', {
            user_answer: attempts[0].user_answer,
            is_correct: attempts[0].is_correct,
            session_type: attempts[0].session_type,
            attempted_at: attempts[0].attempted_at
          });
        }
      }
      
      // 5. Clean up test record
      await supabase
        .from('question_attempt_history')
        .delete()
        .eq('session_id', session.id)
        .eq('question_id', questionId);
      
      console.log('🧹 Cleaned up test record');
    }

    // 6. Check if there are ANY question attempts for this session
    console.log('\n📊 Checking all question attempts for this session...');
    const { data: allAttempts, error: allError } = await supabase
      .from('question_attempt_history')
      .select('*')
      .eq('session_id', session.id);
    
    if (allError) {
      console.log('❌ Could not check attempts:', allError);
    } else {
      console.log('📊 Total attempts for this session:', allAttempts.length);
      if (allAttempts.length === 0) {
        console.log('⚠️  WARNING: No question attempts found for this session!');
        console.log('   This means the frontend is NOT calling save_question_attempt');
        console.log('   or the calls are failing silently.');
      }
    }

  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }

  console.log('\n=========================================');
  console.log('🎯 TEST COMPLETE');
  console.log('=========================================');
}

testLiveSaveQuestionAttempt()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });