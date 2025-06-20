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

async function debugDiagnosticSessions() {
  try {
    console.log('🔍 Debugging diagnostic sessions...');
    
    // Get all user_test_sessions for diagnostic mode
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('test_mode', 'diagnostic')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    console.log(`📊 Found ${sessions?.length || 0} diagnostic sessions:`);
    
    if (sessions && sessions.length > 0) {
      // Group by user and product
      const grouped = sessions.reduce((acc, session) => {
        const key = `${session.user_id}_${session.product_type}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(session);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([key, userSessions]) => {
        const [userId, productType] = key.split('_');
        console.log(`\n👤 User: ${userId.slice(0, 8)}... | Product: ${productType}`);
        console.log(`   Sessions: ${userSessions.length}`);
        
        userSessions.forEach((session, index) => {
          console.log(`   ${index + 1}. Section: "${session.section_name}" | Status: ${session.status} | Score: ${session.final_score} | Questions: ${session.questions_answered}/${session.total_questions}`);
        });

        // Check if analytics service would find this as "completed"
        const completedSessions = userSessions.filter(s => s.status === 'completed');
        console.log(`   ✅ Completed sections: ${completedSessions.length}/${userSessions.length}`);
        
        if (completedSessions.length > 0) {
          console.log(`   🎯 Analytics service would find: ${completedSessions.length} completed diagnostic sessions`);
          console.log(`   📈 First completed session would be used for analytics`);
        } else {
          console.log(`   ❌ Analytics service would find NO completed diagnostics`);
        }
      });
    }

    // Check user_progress table for diagnostic_completed flags
    console.log('\n🔍 Checking user_progress for diagnostic_completed flags...');
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('user_id, product_type, diagnostic_completed, total_questions_completed')
      .eq('diagnostic_completed', true);

    if (progressError) {
      console.error('❌ Error fetching progress:', progressError);
      return;
    }

    console.log(`📊 Found ${progress?.length || 0} users with diagnostic_completed = true:`);
    progress?.forEach(p => {
      console.log(`   👤 ${p.user_id.slice(0, 8)}... | ${p.product_type} | Questions: ${p.total_questions_completed}`);
    });

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugDiagnosticSessions();