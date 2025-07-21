#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNullSessionAttempts() {
  console.log('🔍 CHECKING FOR QUESTION ATTEMPTS WITH NULL/UNDEFINED SESSION IDs');
  console.log('===============================================================\n');

  try {
    // Check for attempts with NULL session_id
    const { data: nullAttempts, error: nullError } = await supabase
      .from('question_attempt_history')
      .select('*')
      .is('session_id', null)
      .order('attempted_at', { ascending: false })
      .limit(10);
    
    if (nullError) {
      console.log('❌ Error checking NULL session attempts:', nullError);
    } else {
      console.log(`📊 Found ${nullAttempts?.length || 0} question attempts with NULL session_id`);
      if (nullAttempts && nullAttempts.length > 0) {
        nullAttempts.forEach(attempt => {
          console.log(`  - Question ${attempt.question_id}: ${attempt.user_answer} (${attempt.is_correct ? 'correct' : 'incorrect'}) at ${attempt.attempted_at}`);
        });
      }
    }

    // Check total question attempts
    const { count: totalAttempts, error: countError } = await supabase
      .from('question_attempt_history')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Error counting total attempts:', countError);
    } else {
      console.log(`📊 Total question attempts in database: ${totalAttempts || 0}`);
    }

    // Check recent attempts (any session_id)
    const { data: recentAttempts, error: recentError } = await supabase
      .from('question_attempt_history')
      .select('session_id, user_answer, is_correct, attempted_at')
      .order('attempted_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.log('❌ Error checking recent attempts:', recentError);
    } else {
      console.log(`📊 Recent question attempts (any session):`);
      if (recentAttempts && recentAttempts.length > 0) {
        recentAttempts.forEach(attempt => {
          console.log(`  - Session: ${attempt.session_id || 'NULL'} | Answer: ${attempt.user_answer} | Correct: ${attempt.is_correct} | Time: ${attempt.attempted_at}`);
        });
      } else {
        console.log('  - No recent attempts found');
      }
    }

    // Check if the practice test session was created
    console.log('\n🔍 Checking recent test sessions...');
    const { data: recentSessions, error: sessionError } = await supabase
      .from('user_test_sessions')
      .select('id, test_mode, section_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (sessionError) {
      console.log('❌ Error checking sessions:', sessionError);
    } else {
      console.log(`📊 Recent test sessions:`);
      if (recentSessions && recentSessions.length > 0) {
        recentSessions.forEach(session => {
          console.log(`  - ${session.id}: ${session.test_mode} ${session.section_name} (${session.status}) at ${session.created_at}`);
        });
      } else {
        console.log('  - No recent sessions found');
      }
    }

  } catch (err) {
    console.log('❌ Check failed:', err.message);
  }

  console.log('\n===============================================================');
  console.log('🎯 CHECK COMPLETE');
  console.log('===============================================================');
}

checkNullSessionAttempts()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Check failed:', err);
    process.exit(1);
  });