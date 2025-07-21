#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllData() {
  console.log('🔍 CHECKING ALL SYSTEM DATA');
  console.log('============================\n');

  // 1. Check ALL question attempts (not just recent)
  console.log('1. Checking ALL question attempts...');
  try {
    const { data: attempts, error } = await supabase
      .from('question_attempt_history')
      .select('*', { count: 'exact' })
      .limit(0);
    
    if (error) {
      console.log('❌ Error:', error);
    } else {
      console.log(`✅ Total question attempts in system: ${attempts?.length || 0}`);
    }
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }

  // 2. Check ALL test sessions (not just recent)
  console.log('\n2. Checking ALL test sessions...');
  try {
    const { data: sessions, error } = await supabase
      .from('user_test_sessions')
      .select('*', { count: 'exact' })
      .limit(0);
    
    if (error) {
      console.log('❌ Error:', error);
    } else {
      console.log(`✅ Total test sessions in system: ${sessions?.length || 0}`);
    }
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }

  // 3. Get actual count using count query
  console.log('\n3. Getting exact counts...');
  try {
    const { count: attemptCount, error: attemptError } = await supabase
      .from('question_attempt_history')
      .select('*', { count: 'exact', head: true });
    
    const { count: sessionCount, error: sessionError } = await supabase
      .from('user_test_sessions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Question attempts: ${attemptCount || 0}`);
    console.log(`Test sessions: ${sessionCount || 0}`);
    
    if (attemptError) console.log('Attempt count error:', attemptError);
    if (sessionError) console.log('Session count error:', sessionError);
  } catch (err) {
    console.log('❌ Count check failed:', err.message);
  }

  // 4. Check if there are completed diagnostic sessions specifically
  console.log('\n4. Checking completed diagnostic sessions...');
  try {
    const { data: diagnostics, error } = await supabase
      .from('user_test_sessions')
      .select('id, user_id, section_name, status, correct_answers, total_questions, created_at')
      .eq('test_mode', 'diagnostic')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Error:', error);
    } else {
      console.log(`✅ Found ${diagnostics?.length || 0} completed diagnostic sessions`);
      if (diagnostics && diagnostics.length > 0) {
        diagnostics.forEach(session => {
          console.log(`  ${session.id}: ${session.section_name} - ${session.correct_answers}/${session.total_questions} (${session.created_at})`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }

  // 5. Test the save_question_attempt function with sample data
  console.log('\n5. Testing if save_question_attempt function exists...');
  try {
    // Try to call the function with dummy data to see if it exists
    const { data, error } = await supabase.rpc('save_question_attempt', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_question_id: '00000000-0000-0000-0000-000000000000',
      p_session_id: '00000000-0000-0000-0000-000000000000',
      p_user_answer: 'A',
      p_is_correct: true,
      p_is_flagged: false,
      p_is_skipped: false,
      p_time_spent_seconds: 30
    });
    
    if (error) {
      console.log('❌ Function call error:', error);
      if (error.message.includes('function "save_question_attempt" does not exist')) {
        console.log('🚨 CRITICAL: save_question_attempt function does NOT exist in production!');
      }
    } else {
      console.log('✅ Function exists (would return data):', data);
    }
  } catch (err) {
    console.log('❌ Function test failed:', err.message);
  }

  console.log('\n============================');
  console.log('🎯 DATA CHECK COMPLETE');
  console.log('============================');
}

checkAllData()
  .then(() => {
    console.log('\n✅ Data check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Data check failed:', err);
    process.exit(1);
  });