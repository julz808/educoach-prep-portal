// Debug script to check constraints and triggers
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugConstraints() {
  console.log('🔍 Debugging constraints and policies...\n');

  // Test if we can actually delete from user_test_sessions directly
  console.log('1. Testing direct deletion from user_test_sessions...');
  
  try {
    // First, let's create a test session and then try to delete it
    const testUserId = '1fd521a3-e462-41b6-a31c-5c8a806aad52'; // From error message
    
    console.log(`Testing with user ID: ${testUserId}`);
    
    // Check if there are any sessions for this user
    const { data: existingSessions, error: queryError } = await supabase
      .from('user_test_sessions')
      .select('id, status, product_type, section_name')
      .eq('user_id', testUserId);
      
    if (queryError) {
      console.error('Error querying sessions:', queryError);
      return;
    }
    
    console.log(`Found ${existingSessions?.length || 0} existing sessions:`, existingSessions);
    
    if (existingSessions && existingSessions.length > 0) {
      // Try to delete one session at a time to isolate the issue
      for (const session of existingSessions) {
        console.log(`\n2. Attempting to delete session ${session.id}...`);
        
        // First check what references this session
        console.log('  Checking references to this session...');
        
        // Check test_section_states
        const { data: sectionStates } = await supabase
          .from('test_section_states')
          .select('id')
          .eq('test_session_id', session.id);
          
        console.log(`  - test_section_states: ${sectionStates?.length || 0} records`);
        
        // Check question_attempt_history
        const { data: attempts } = await supabase
          .from('question_attempt_history')
          .select('id')
          .eq('session_id', session.id);
          
        console.log(`  - question_attempt_history: ${attempts?.length || 0} records`);
        
        // Check writing_assessments
        const { data: assessments } = await supabase
          .from('writing_assessments')
          .select('id')
          .eq('session_id', session.id);
          
        console.log(`  - writing_assessments: ${assessments?.length || 0} records`);
        
        // Try to delete the session
        const { error: deleteError } = await supabase
          .from('user_test_sessions')
          .delete()
          .eq('id', session.id);
          
        if (deleteError) {
          console.error(`  ❌ Failed to delete session ${session.id}:`, deleteError);
          
          // If it's a foreign key constraint, the error should tell us which table
          if (deleteError.code === '23503') {
            console.log('  This is a foreign key constraint violation');
          } else if (deleteError.code === '409') {
            console.log('  This is a conflict error (409)');
          }
        } else {
          console.log(`  ✅ Successfully deleted session ${session.id}`);
        }
      }
    } else {
      console.log('No existing sessions found for this user');
      
      // Create a test session and then try to delete it
      console.log('\n3. Creating test session...');
      const { data: newSession, error: createError } = await supabase
        .from('user_test_sessions')
        .insert({
          user_id: testUserId,
          product_type: 'Year 5 NAPLAN',
          test_mode: 'diagnostic',
          section_name: 'Test Section',
          total_questions: 10,
          status: 'active',
          current_question_index: 0,
          questions_answered: 0,
          answers_data: {},
          flagged_questions: [],
          time_remaining_seconds: 3600
        })
        .select('id')
        .single();
        
      if (createError) {
        console.error('Failed to create test session:', createError);
        return;
      }
      
      console.log('Created test session:', newSession.id);
      
      // Now try to delete it
      console.log('\n4. Attempting to delete test session...');
      const { error: deleteError } = await supabase
        .from('user_test_sessions')
        .delete()
        .eq('id', newSession.id);
        
      if (deleteError) {
        console.error('❌ Failed to delete test session:', deleteError);
      } else {
        console.log('✅ Successfully deleted test session');
      }
    }

  } catch (error) {
    console.error('Error in constraint debugging:', error);
  }
}

debugConstraints().catch(console.error);