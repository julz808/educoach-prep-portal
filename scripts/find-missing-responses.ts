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

async function findMissingResponses() {
  console.log('\n🔍 FINDING MISSING RESPONSES\n');

  const targetSessionId = '4c1f50db-a415-4ea0-a7df-33bc693dfee7';
  const targetUserId = '320cf4a6-8914-4a25-8b1c-1007477d9adc';

  // Check if ANY responses exist for this user in practice mode
  const { data: anyResponses, error: anyError } = await supabase
    .from('question_attempt_history')
    .select('session_id, session_type, attempted_at, questions!inner(section_name)')
    .eq('user_id', targetUserId)
    .eq('session_type', 'practice')
    .order('attempted_at', { ascending: false })
    .limit(20);

  if (anyError) {
    console.error('❌ Error:', anyError);
    return;
  }

  console.log(`Found ${anyResponses?.length || 0} practice responses for user:\n`);

  anyResponses?.forEach((r: any, i) => {
    console.log(`Response ${i + 1}:`);
    console.log(`  Session ID: ${r.session_id}`);
    console.log(`  Section: ${r.questions.section_name}`);
    console.log(`  Attempted: ${new Date(r.attempted_at).toLocaleString()}`);
    console.log(`  ${r.session_id === targetSessionId ? '  ← THIS IS THE TARGET SESSION!' : ''}`);
    console.log();
  });

  // Check if session exists in user_test_sessions
  const { data: session, error: sessionError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('id', targetSessionId)
    .single();

  if (sessionError) {
    console.error('❌ Session error:', sessionError);
  } else {
    console.log('\n📋 Target Session Details:');
    console.log(`  Status: ${session.status}`);
    console.log(`  Section: ${session.section_name}`);
    console.log(`  Test Mode: ${session.test_mode}`);
    console.log(`  Product: ${session.product_type}`);
    console.log(`  Created: ${new Date(session.created_at).toLocaleString()}`);
    console.log(`  Updated: ${new Date(session.updated_at).toLocaleString()}`);
  }

  // Check test_section_states
  const { data: sectionState, error: stateError } = await supabase
    .from('test_section_states')
    .select('*')
    .eq('test_session_id', targetSessionId);

  console.log(`\n📊 Test Section States: ${sectionState?.length || 0} found`);
  sectionState?.forEach(state => {
    console.log(`  Current Question Index: ${state.current_question_index}`);
    console.log(`  Questions Answered: ${state.questions_answered?.length || 0}`);
    console.log(`  Section Complete: ${state.section_complete}`);
  });
}

findMissingResponses().catch(console.error);
