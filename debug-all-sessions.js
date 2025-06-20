import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAllSessions() {
  try {
    console.log('🔍 Checking all practice test sessions in database...\n');
    
    const productType = 'VIC Selective Entry (Year 9 Entry)';
    
    // Get all practice test sessions
    const { data: allSessions, error: sessionError } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('product_type', productType)
      .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice'])
      .order('created_at', { ascending: false });

    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return;
    }

    console.log(`Found ${allSessions?.length || 0} practice test sessions total:`);
    
    if (!allSessions || allSessions.length === 0) {
      console.log('   No practice test sessions found at all.');
      
      // Check if there are ANY sessions for this product
      const { data: anySessions, error: anyError } = await supabase
        .from('user_test_sessions')
        .select('test_mode, status, count(*)')
        .eq('product_type', productType);

      if (!anyError && anySessions) {
        console.log('\n   All sessions for this product:');
        anySessions.forEach(s => {
          console.log(`     - ${s.test_mode}: ${s.status} (${s.count} sessions)`);
        });
      }
      
      // Check what products and test modes exist in the database
      const { data: allProducts, error: productsError } = await supabase
        .from('user_test_sessions')
        .select('product_type, test_mode, status')
        .limit(20);

      if (!productsError && allProducts) {
        console.log('\n   Sample of all sessions in database:');
        allProducts.forEach((s, idx) => {
          console.log(`     ${idx + 1}. Product: ${s.product_type}, Mode: ${s.test_mode}, Status: ${s.status}`);
        });
      }
      
      return;
    }

    // Group by status
    const byStatus = {};
    allSessions.forEach(session => {
      if (!byStatus[session.status]) byStatus[session.status] = [];
      byStatus[session.status].push(session);
    });

    Object.entries(byStatus).forEach(([status, sessions]) => {
      console.log(`\n   ${status.toUpperCase()} sessions (${sessions.length}):`);
      sessions.forEach(session => {
        console.log(`     - Session ${session.id}: ${session.test_mode}, User: ${session.user_id}, Score: ${session.final_score}%, Created: ${session.created_at}`);
      });
    });

    // If there are any sessions, let's use the most recent one for analysis
    if (allSessions.length > 0) {
      const session = allSessions[0];
      console.log(`\n📊 Analyzing most recent session ${session.id}:`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Test mode: ${session.test_mode}`);
      console.log(`   Total questions: ${session.total_questions}`);
      console.log(`   Questions answered: ${session.questions_answered}`);
      console.log(`   Correct answers: ${session.correct_answers}`);
      console.log(`   Final score: ${session.final_score}%`);
      console.log(`   Question order: ${session.question_order ? `${session.question_order.length} questions` : 'null'}`);
      console.log(`   Answers data: ${session.answers_data ? `${Object.keys(session.answers_data).length} answers` : 'null'}`);
      
      // Check if question_order contains valid question IDs
      if (session.question_order && session.question_order.length > 0) {
        console.log(`\n   Sample question IDs from question_order: ${session.question_order.slice(0, 5).join(', ')}...`);
        
        // Verify these questions exist in the database
        const { data: questionCheck, error: questionError } = await supabase
          .from('questions')
          .select('id, test_mode, section_name')
          .in('id', session.question_order.slice(0, 10));
          
        if (!questionError && questionCheck) {
          console.log(`   First 10 questions exist in database: ${questionCheck.length}/10`);
          questionCheck.forEach((q, idx) => {
            console.log(`     ${idx + 1}. ID ${q.id}: ${q.test_mode}, ${q.section_name}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugAllSessions();