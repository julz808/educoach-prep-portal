import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function checkUserAttempts() {
  console.log('Checking user attempts and responses tables...\n');
  
  // Test 1: Try to access question_responses
  try {
    const { data: responses, error: responseError, count } = await supabase
      .from('question_responses')
      .select('*', { count: 'exact', head: true });
      
    if (responseError) {
      console.log('❌ question_responses table error:', responseError.message);
    } else {
      console.log('✅ question_responses table exists with', count, 'records');
    }
  } catch (e) {
    console.log('❌ question_responses table access failed:', e);
  }
  
  // Test 2: Try test_attempts
  try {
    const { data: attempts, error: attemptError, count } = await supabase
      .from('test_attempts')
      .select('*', { count: 'exact', head: true });
      
    if (attemptError) {
      console.log('❌ test_attempts table error:', attemptError.message);
    } else {
      console.log('✅ test_attempts table exists with', count, 'records');
    }
  } catch (e) {
    console.log('❌ test_attempts table access failed:', e);
  }
  
  // Test 3: Try drill_sessions
  try {
    const { data: drills, error: drillError, count } = await supabase
      .from('drill_sessions')
      .select('*', { count: 'exact', head: true });
      
    if (drillError) {
      console.log('❌ drill_sessions table error:', drillError.message);
    } else {
      console.log('✅ drill_sessions table exists with', count, 'records');
    }
  } catch (e) {
    console.log('❌ drill_sessions table access failed:', e);
  }
  
  // Test 4: Try writing_assessments
  try {
    const { data: assessments, error: assessmentError, count } = await supabase
      .from('writing_assessments')
      .select('*', { count: 'exact', head: true });
      
    if (assessmentError) {
      console.log('❌ writing_assessments table error:', assessmentError.message);
    } else {
      console.log('✅ writing_assessments table exists with', count, 'records');
    }
  } catch (e) {
    console.log('❌ writing_assessments table access failed:', e);
  }
  
  // Test 5: Check for user data related to writing questions
  try {
    console.log('\n=== CHECKING FOR WRITING QUESTION USER DATA ===\n');
    
    // Get all writing question IDs first
    const { data: writingQuestions } = await supabase
      .from('questions')
      .select('id, test_type, section_name, test_mode')
      .or('section_name.ilike.%writing%,section_name.ilike.%written expression%');
      
    console.log(`Found ${writingQuestions?.length || 0} writing questions`);
    
    if (writingQuestions && writingQuestions.length > 0) {
      const writingQuestionIds = writingQuestions.map(q => q.id);
      
      // Check each table for references to these questions
      const tablesToCheck = ['question_responses', 'test_attempts', 'drill_sessions', 'writing_assessments'];
      
      for (const tableName of tablesToCheck) {
        try {
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .in('question_id', writingQuestionIds);
            
          console.log(`${tableName}: ${count || 0} records reference writing questions`);
        } catch (e) {
          console.log(`${tableName}: Could not check (${e})`);
        }
      }
    }
    
  } catch (e) {
    console.log('Error checking writing question references:', e);
  }
  
  process.exit(0);
}

checkUserAttempts().catch(console.error);