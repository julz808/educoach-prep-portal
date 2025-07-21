#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSessionCreation() {
  console.log('🧪 TESTING create_or_resume_test_session FUNCTION');
  console.log('===================================================\n');

  try {
    // Get current user or use a test user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ No authenticated user found. Please login first.');
      return;
    }

    console.log('👤 Using user:', user.id);

    // Test creating a session with the exact parameters from TestTaking.tsx
    console.log('\n🔧 Testing session creation...');
    const { data: sessionId, error } = await supabase.rpc('create_or_resume_test_session', {
      p_user_id: user.id,
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
      } else {
        console.log('✅ Session verified in database:', {
          id: sessions[0]?.id,
          test_mode: sessions[0]?.test_mode,
          section_name: sessions[0]?.section_name,
          status: sessions[0]?.status,
          created_at: sessions[0]?.created_at
        });
      }
      
      // Clean up test session
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

  } catch (err) {
    console.log('❌ Test failed:', err.message);
    console.log('❌ Stack trace:', err.stack);
  }

  console.log('\n===================================================');
  console.log('🎯 SESSION CREATION TEST COMPLETE');
  console.log('===================================================');
}

testSessionCreation()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });