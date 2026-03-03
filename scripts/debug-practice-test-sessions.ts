import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPracticeTestSessions() {
  console.log('\n🔍 DEBUGGING PRACTICE TEST SESSIONS\n');

  // Get all practice_1 sessions for Year 5 NAPLAN (recent ones)
  const { data: sessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('test_mode', 'practice_1')
    .eq('product_type', 'Year 5 NAPLAN')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sessionsError) {
    console.error('❌ Error fetching sessions:', sessionsError);
    return;
  }

  console.log(`📊 Found ${sessions?.length || 0} practice_1 sessions:\n`);

  if (!sessions || sessions.length === 0) {
    console.log('⚠️  No sessions found!\n');
    return;
  }

  sessions.forEach((session, index) => {
    console.log(`\n--- Session ${index + 1} ---`);
    console.log(`ID: ${session.id}`);
    console.log(`User ID: ${session.user_id}`);
    console.log(`Section Name: "${session.section_name}"`);
    console.log(`Status: ${session.status}`);
    console.log(`Created: ${new Date(session.created_at).toLocaleString()}`);
    console.log(`Updated: ${new Date(session.updated_at).toLocaleString()}`);
  });

  // Get questions for Language Conventions to verify their section_name
  console.log('\n\n🔍 Checking Language Conventions questions:\n');

  const { data: lcQuestions, error: lcError } = await supabase
    .from('questions')
    .select('id, section_name, sub_skill, question_text')
    .eq('product_type', 'Year 5 NAPLAN')
    .eq('test_mode', 'practice_1')
    .ilike('section_name', '%language%')
    .limit(5);

  if (lcError) {
    console.error('❌ Error fetching LC questions:', lcError);
  } else {
    console.log(`Found ${lcQuestions?.length || 0} Language Conventions questions`);
    lcQuestions?.forEach((q, i) => {
      console.log(`\nQuestion ${i + 1}:`);
      console.log(`  Section Name: "${q.section_name}"`);
      console.log(`  Sub-skill: ${q.sub_skill}`);
      console.log(`  Text: ${q.question_text?.substring(0, 60)}...`);
    });
  }

  // Get questions for Numeracy to compare
  console.log('\n\n🔍 Checking Numeracy questions:\n');

  const { data: numQuestions, error: numError } = await supabase
    .from('questions')
    .select('id, section_name, sub_skill, question_text')
    .eq('product_type', 'Year 5 NAPLAN')
    .eq('test_mode', 'practice_1')
    .ilike('section_name', '%numeracy%')
    .limit(5);

  if (numError) {
    console.error('❌ Error fetching Numeracy questions:', numError);
  } else {
    console.log(`Found ${numQuestions?.length || 0} Numeracy questions`);
    numQuestions?.forEach((q, i) => {
      console.log(`\nQuestion ${i + 1}:`);
      console.log(`  Section Name: "${q.section_name}"`);
      console.log(`  Sub-skill: ${q.sub_skill}`);
      console.log(`  Text: ${q.question_text?.substring(0, 60)}...`);
    });
  }

  // Check question responses for the completed session
  if (sessions && sessions.length > 0) {
    console.log('\n\n🔍 Checking question responses for latest session:\n');

    const latestSession = sessions[0];
    const { data: responses, error: respError } = await supabase
      .from('question_attempt_history')
      .select(`
        question_id,
        is_correct,
        user_answer,
        questions!inner(section_name, sub_skill)
      `)
      .eq('session_id', latestSession.id)
      .limit(10);

    if (respError) {
      console.error('❌ Error fetching responses:', respError);
    } else {
      console.log(`Found ${responses?.length || 0} responses for session ${latestSession.id}`);
      console.log(`Session section_name: "${latestSession.section_name}"`);

      if (responses && responses.length > 0) {
        console.log('\nActual questions answered:');
        responses.forEach((r: any, i) => {
          console.log(`\nResponse ${i + 1}:`);
          console.log(`  Question section: "${r.questions.section_name}"`);
          console.log(`  Question sub-skill: ${r.questions.sub_skill}`);
          console.log(`  Correct: ${r.is_correct}`);
        });
      }
    }
  }

  console.log('\n\n✅ Debug complete!\n');
}

debugPracticeTestSessions().catch(console.error);
