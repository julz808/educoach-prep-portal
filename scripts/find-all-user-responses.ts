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

async function findAllUserResponses() {
  console.log('\n🔍 FINDING ALL USER RESPONSES\n');

  const targetUserId = '320cf4a6-8914-4a25-8b1c-1007477d9adc';

  // Get ALL sessions for this user
  const { data: allSessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('product_type', 'Year 5 NAPLAN')
    .order('created_at', { ascending: false });

  console.log(`\n📊 All Year 5 NAPLAN sessions for user:\n`);
  allSessions?.forEach((s, i) => {
    console.log(`${i + 1}. ${s.test_mode} - ${s.section_name} (${s.status})`);
    console.log(`   ID: ${s.id}`);
    console.log(`   Created: ${new Date(s.created_at).toLocaleString()}\n`);
  });

  // Get ALL responses for this user for Year 5 NAPLAN
  const { data: responses, error: respError } = await supabase
    .from('question_attempt_history')
    .select(`
      id,
      session_id,
      session_type,
      is_correct,
      attempted_at,
      questions!inner(
        section_name,
        sub_skill,
        test_mode,
        product_type
      )
    `)
    .eq('user_id', targetUserId)
    .eq('questions.product_type', 'Year 5 NAPLAN')
    .order('attempted_at', { ascending: false })
    .limit(50);

  console.log(`\n💡 Found ${responses?.length || 0} total responses:\n`);

  // Group by session_id
  const bySession = new Map<string, any[]>();
  responses?.forEach((r: any) => {
    if (!bySession.has(r.session_id)) {
      bySession.set(r.session_id, []);
    }
    bySession.get(r.session_id)!.push(r);
  });

  console.log(`Grouped into ${bySession.size} different sessions:\n`);

  for (const [sessionId, resps] of bySession.entries()) {
    const firstResp = resps[0];
    const sections = new Set(resps.map((r: any) => r.questions.section_name));
    const testModes = new Set(resps.map((r: any) => r.questions.test_mode));
    const correct = resps.filter((r: any) => r.is_correct).length;

    console.log(`📋 Session: ${sessionId}`);
    console.log(`   Type: ${firstResp.session_type}`);
    console.log(`   Test Modes: ${Array.from(testModes).join(', ')}`);
    console.log(`   Sections: ${Array.from(sections).join(', ')}`);
    console.log(`   Questions: ${resps.length} (${correct} correct)`);
    console.log(`   Last attempted: ${new Date(resps[0].attempted_at).toLocaleString()}\n`);
  }
}

findAllUserResponses().catch(console.error);
