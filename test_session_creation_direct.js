#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSessionCreationDirect() {
  console.log('🧪 TESTING create_or_resume_test_session FUNCTION (DIRECT)');
  console.log('========================================================\n');

  try {
    // Get any user profile to test with
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (profileError || !profiles || profiles.length === 0) {
      console.log('❌ No user profiles found');
      return;
    }

    const testUserId = profiles[0].id;
    console.log('👤 Using test user:', testUserId);

    // Test creating a session with the exact parameters from TestTaking.tsx
    console.log('\n🔧 Testing session creation...');
    const { data: sessionId, error } = await supabase.rpc('create_or_resume_test_session', {
      p_user_id: testUserId,
      p_product_type: 'VIC Selective Entry (Year 9 Entry)', // Example product
      p_test_mode: 'diagnostic',
      p_section_name: 'Mathematics',
      p_total_questions: 60,
      p_question_order: [] // Empty array for now
    });
    
    if (error) {
      console.log('❌ Function call failed:', error);
      console.log('   Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.message.includes('function "create_or_resume_test_session" does not exist')) {
        console.log('🚨 CRITICAL: create_or_resume_test_session function does NOT exist in production!');
      } else if (error.code === '42883') {
        console.log('🚨 CRITICAL: Function signature mismatch or function missing!');
      }
    } else {
      console.log('✅ Session created successfully!');
      console.log('   Session ID:', sessionId);
      
      // Verify the session was created
      const { data: sessions, error: verifyError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('id', sessionId);
      
      if (verifyError) {
        console.log('❌ Could not verify session:', verifyError);
      } else if (sessions && sessions.length > 0) {
        console.log('✅ Session verified in database:', {
          id: sessions[0].id,
          test_mode: sessions[0].test_mode,
          section_name: sessions[0].section_name,
          status: sessions[0].status,
          created_at: sessions[0].created_at
        });
      } else {
        console.log('⚠️  Session ID returned but no session found in database');
      }
      
      // Clean up test session
      if (sessionId) {
        await supabase
          .from('test_section_states')
          .delete()
          .eq('test_session_id', sessionId);
        
        await supabase
          .from('user_test_sessions')
          .delete()
          .eq('id', sessionId);
        
        console.log('🧹 Cleaned up test session');
      }
    }

    // Also test calling with dummy UUID to see if function exists
    console.log('\n🔧 Testing function existence with dummy UUID...');
    const { data: dummyResult, error: dummyError } = await supabase.rpc('create_or_resume_test_session', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_product_type: 'Test Product',
      p_test_mode: 'diagnostic',
      p_section_name: 'Test Section',
      p_total_questions: 1,
      p_question_order: []
    });
    
    if (dummyError) {
      if (dummyError.message.includes('function "create_or_resume_test_session" does not exist')) {
        console.log('🚨 CONFIRMED: Function does NOT exist in production database!');
      } else if (dummyError.code === '23503' || dummyError.message.includes('foreign key')) {
        console.log('✅ Function exists (foreign key error is expected with dummy UUID)');
      } else {
        console.log('⚠️  Function exists but returned error:', dummyError.message);
      }
    } else {
      console.log('✅ Function exists and worked with dummy data:', dummyResult);
    }

  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }

  console.log('\n========================================================');
  console.log('🎯 SESSION CREATION TEST COMPLETE');
  console.log('========================================================');
}

testSessionCreationDirect()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });