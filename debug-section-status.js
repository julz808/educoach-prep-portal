import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugSectionStatus() {
  console.log('🔍 Debugging section status issue...\n');

  try {
    // First, let's see what test sessions exist
    const { data: sessions, error } = await supabase
      .from('user_test_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching sessions:', error);
      return;
    }

    console.log('📊 Total sessions found:', sessions.length);
    
    if (sessions.length === 0) {
      console.log('ℹ️ No test sessions found. This explains why buttons show "Start Section"');
      return;
    }

    console.log('\n📋 Recent sessions:');
    sessions.slice(0, 10).forEach((session, index) => {
      console.log(`${index + 1}. Section: "${session.section_name}"`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Product: ${session.product_type}`);
      console.log(`   Mode: ${session.test_mode}`);
      console.log(`   Questions answered: ${session.questions_answered || 0}/${session.total_questions || 0}`);
      console.log(`   Updated: ${session.updated_at}`);
      console.log('');
    });

    // Group by product and test mode
    const byProductMode = {};
    sessions.forEach(session => {
      const key = `${session.product_type}-${session.test_mode}`;
      if (!byProductMode[key]) {
        byProductMode[key] = [];
      }
      byProductMode[key].push(session);
    });

    console.log('\n📊 Sessions by Product & Mode:');
    Object.entries(byProductMode).forEach(([key, sessions]) => {
      console.log(`\n${key}:`);
      sessions.forEach(session => {
        console.log(`  - "${session.section_name}": ${session.status}`);
      });
    });

    // Check for status distribution
    const statusCounts = sessions.reduce((acc, session) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} sessions`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugSectionStatus();