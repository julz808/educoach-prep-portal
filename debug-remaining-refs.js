// Debug script to find what's still referencing user_test_sessions
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugRemainingReferences() {
  console.log('🔍 Debugging remaining references to user_test_sessions...\n');

  const testUserId = '1fd521a3-e462-41b6-a31c-5c8a806aad52'; // From error

  try {
    // Check current sessions
    const { data: sessions } = await supabase
      .from('user_test_sessions')
      .select('id')
      .eq('user_id', testUserId);
      
    console.log(`Found ${sessions?.length || 0} user_test_sessions`);
    
    if (sessions && sessions.length > 0) {
      console.log('Session IDs:', sessions.map(s => s.id));
      
      // For each session, check what's still referencing it
      for (const session of sessions.slice(0, 3)) { // Check first 3 sessions
        console.log(`\n🔍 Checking references to session ${session.id}:`);
        
        // Check writing_assessments
        const { data: assessments } = await supabase
          .from('writing_assessments')
          .select('*')
          .eq('session_id', session.id);
          
        console.log(`  writing_assessments: ${assessments?.length || 0} records`);
        if (assessments && assessments.length > 0) {
          console.log('    Sample:', assessments[0]);
        }
        
        // Check test_section_states
        const { data: states } = await supabase
          .from('test_section_states')
          .select('*')
          .eq('test_session_id', session.id);
          
        console.log(`  test_section_states: ${states?.length || 0} records`);
        if (states && states.length > 0) {
          console.log('    Sample:', states[0]);
        }
        
        // Check question_attempt_history
        const { data: attempts } = await supabase
          .from('question_attempt_history')
          .select('*')
          .eq('session_id', session.id);
          
        console.log(`  question_attempt_history: ${attempts?.length || 0} records`);
        if (attempts && attempts.length > 0) {
          console.log('    Sample:', attempts[0]);
        }
      }
      
      // Let's also try to manually delete writing_assessments to see what happens
      console.log('\n🧪 Testing manual deletion of writing_assessments...');
      const { error: deleteError } = await supabase
        .from('writing_assessments')
        .delete()
        .in('session_id', sessions.map(s => s.id));
        
      if (deleteError) {
        console.error('❌ Failed to delete writing_assessments:', deleteError);
      } else {
        console.log('✅ Successfully deleted writing_assessments');
        
        // Now try deleting a single session
        console.log('\n🧪 Testing deletion of single session...');
        const { error: sessionError } = await supabase
          .from('user_test_sessions')
          .delete()
          .eq('id', sessions[0].id);
          
        if (sessionError) {
          console.error('❌ Still failed to delete session:', sessionError);
        } else {
          console.log('✅ Successfully deleted single session');
        }
      }
    }

  } catch (error) {
    console.error('Error in debugging:', error);
  }
}

debugRemainingReferences().catch(console.error);