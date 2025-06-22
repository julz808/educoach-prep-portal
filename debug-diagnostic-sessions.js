// Debug script to check diagnostic session states
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugDiagnosticSessions() {
  console.log('🔍 Debugging Diagnostic Sessions...\n');

  // Get all test sessions
  const { data: sessions, error } = await supabase
    .from('user_test_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching sessions:', error);
    return;
  }

  console.log(`Found ${sessions.length} test sessions:\n`);

  sessions.forEach(session => {
    console.log('Session:', {
      id: session.id.substring(0, 8) + '...',
      user_id: session.user_id.substring(0, 8) + '...',
      product_type: session.product_type,
      section_name: session.section_name,
      test_mode: session.test_mode,
      status: session.status,
      questions_answered: session.questions_answered,
      total_questions: session.total_questions,
      current_question: session.current_question_index,
      created: new Date(session.created_at).toLocaleString(),
      updated: new Date(session.updated_at).toLocaleString()
    });
    console.log('---');
  });

  // Check for duplicate active sessions
  const activeSessions = sessions.filter(s => s.status === 'active');
  const sectionGroups = {};
  
  activeSessions.forEach(session => {
    const key = `${session.user_id}-${session.product_type}-${session.section_name}`;
    if (!sectionGroups[key]) {
      sectionGroups[key] = [];
    }
    sectionGroups[key].push(session);
  });

  console.log('\n🔍 Checking for duplicate active sessions:');
  Object.entries(sectionGroups).forEach(([key, sessions]) => {
    if (sessions.length > 1) {
      console.log(`\n⚠️  Found ${sessions.length} active sessions for:`, key);
      sessions.forEach(s => {
        console.log('  - Session:', s.id.substring(0, 8), 'created:', new Date(s.created_at).toLocaleString());
      });
    }
  });

  // Check product type distribution
  console.log('\n📊 Product Type Distribution:');
  const productTypes = {};
  sessions.forEach(s => {
    productTypes[s.product_type] = (productTypes[s.product_type] || 0) + 1;
  });
  Object.entries(productTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} sessions`);
  });
}

debugDiagnosticSessions().catch(console.error);