// Debug script to check what getUserProgress returns
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugUserProgress() {
  console.log('🔍 Debugging getUserProgress function...\n');

  const testUserId = '1fd521a3-e462-41b6-a31c-5c8a806aad52'; // From previous logs
  const productType = 'VIC Selective Entry (Year 9 Entry)'; // From logs
  const testMode = 'diagnostic';

  try {
    // Check what sessions exist
    console.log('1. Checking existing user_test_sessions...');
    const { data: sessions, error: sessionError } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('user_id', testUserId)
      .eq('product_type', productType)
      .eq('test_mode', testMode)
      .order('updated_at', { ascending: false });

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError);
      return;
    }

    console.log(`Found ${sessions?.length || 0} sessions:`);
    sessions?.forEach(session => {
      console.log('  -', {
        id: session.id.substring(0, 8) + '...',
        section_name: session.section_name,
        status: session.status,
        questions_answered: session.questions_answered,
        total_questions: session.total_questions,
        updated_at: session.updated_at?.substring(0, 16)
      });
    });

    // Now simulate what getUserProgress does
    console.log('\n2. Simulating getUserProgress logic...');
    
    const progressMap = {};
    
    sessions?.forEach(session => {
      if (!session.section_name) return;
      
      console.log(`Processing session for "${session.section_name}":`, {
        id: session.id,
        status: session.status,
        updated_at: session.updated_at
      });
      
      const existing = progressMap[session.section_name];
      if (!existing || new Date(session.updated_at) > new Date(existing.lastUpdated)) {
        const mappedStatus = session.status === 'completed' ? 'completed' : 
                           session.status === 'active' ? 'in-progress' : 'not-started';
        
        console.log(`Mapping "${session.section_name}" status from "${session.status}" to "${mappedStatus}"`);
        
        progressMap[session.section_name] = {
          sectionName: session.section_name,
          sessionId: session.id,
          status: mappedStatus,
          questionsAnswered: session.questions_answered || 0,
          totalQuestions: session.total_questions || 0,
          lastUpdated: session.updated_at,
          questionsCompleted: session.questions_answered || 0
        };
      }
    });

    console.log('\n3. Final progress map:');
    console.log(progressMap);
    console.log('\nProgress keys:', Object.keys(progressMap));

  } catch (error) {
    console.error('Error in debug script:', error);
  }
}

debugUserProgress().catch(console.error);