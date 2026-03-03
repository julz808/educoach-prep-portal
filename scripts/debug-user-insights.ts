import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserInsights() {
  // Use the actual user ID
  const userId = '52efea0e-d9a8-4f7c-95bb-9e903dd9d3b6';
  const productType = 'year-5-naplan';

  console.log('=== DEBUGGING USER INSIGHTS ===\n');
  console.log(`User ID: ${userId}`);
  console.log(`Product: ${productType}\n`);

  // 1. Call the RPC function
  console.log('1. Calling get_sub_skill_performance RPC...\n');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_sub_skill_performance', {
    p_user_id: userId,
    p_product_type: productType
  });

  if (rpcError) {
    console.error('RPC Error:', rpcError);
  } else {
    console.log(`Returned ${rpcData?.length || 0} sub-skills\n`);
    if (rpcData && rpcData.length > 0) {
      console.log('Sample data:');
      rpcData.slice(0, 5).forEach((item: any) => {
        console.log(JSON.stringify(item, null, 2));
      });
    }
  }

  // 2. Check user_test_sessions
  console.log('\n\n2. Checking user_test_sessions...\n');
  const { data: sessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .order('created_at', { ascending: false });

  if (sessionsError) {
    console.error('Error:', sessionsError);
  } else {
    console.log(`Found ${sessions?.length || 0} sessions\n`);
    sessions?.forEach((session: any, idx: number) => {
      console.log(`Session ${idx + 1}:`);
      console.log(`  ID: ${session.id}`);
      console.log(`  Test Mode: ${session.test_mode}`);
      console.log(`  Section: ${session.section_name}`);
      console.log(`  Status: ${session.status}`);
      console.log(`  Completed: ${session.completed}`);
      console.log(`  Created: ${session.created_at}`);
      console.log('');
    });
  }

  // 3. Check question_attempt_history
  console.log('3. Checking question_attempt_history...\n');
  const { data: attempts, error: attemptsError } = await supabase
    .from('question_attempt_history')
    .select('*')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(20);

  if (attemptsError) {
    console.error('Error:', attemptsError);
  } else {
    console.log(`Found ${attempts?.length || 0} attempts\n`);

    // Group by session
    const bySession = attempts?.reduce((acc: any, a: any) => {
      if (!acc[a.session_id]) acc[a.session_id] = [];
      acc[a.session_id].push(a);
      return acc;
    }, {});

    console.log('Attempts by session:');
    Object.entries(bySession || {}).forEach(([sessionId, atts]: [string, any]) => {
      console.log(`  Session ${sessionId}: ${atts.length} attempts`);
    });

    console.log('\nRecent attempts:');
    attempts?.slice(0, 5).forEach((attempt: any, idx: number) => {
      console.log(`  ${idx + 1}. Session: ${attempt.session_id}, Type: ${attempt.session_type}, Correct: ${attempt.is_correct}`);
    });
  }

  // 4. Check user_sub_skill_performance table directly
  console.log('\n\n4. Checking user_sub_skill_performance table...\n');
  const { data: subSkillPerf, error: subSkillError } = await supabase
    .from('user_sub_skill_performance')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', productType);

  if (subSkillError) {
    console.error('Error:', subSkillError);
  } else {
    console.log(`Found ${subSkillPerf?.length || 0} sub-skill performance records\n`);
    if (subSkillPerf && subSkillPerf.length > 0) {
      subSkillPerf.forEach((perf: any, idx: number) => {
        console.log(`${idx + 1}. Sub-skill ID: ${perf.sub_skill_id}`);
        console.log(`   Total: ${perf.total_questions}, Attempted: ${perf.attempted_questions}, Correct: ${perf.correct_answers}`);
        console.log('');
      });
    }
  }

  // 5. Check if there are any orphaned sessions (deleted but attempts remain)
  console.log('5. Checking for data inconsistencies...\n');

  const sessionIds = sessions?.map((s: any) => s.id) || [];
  const attemptSessionIds = [...new Set(attempts?.map((a: any) => a.session_id))];

  const orphanedSessionIds = attemptSessionIds.filter(id => !sessionIds.includes(id));

  if (orphanedSessionIds.length > 0) {
    console.log(`⚠️  Found ${orphanedSessionIds.length} orphaned session IDs in question_attempt_history:`);
    orphanedSessionIds.forEach(id => console.log(`  - ${id}`));
    console.log('\nThese attempts exist but their sessions have been deleted!');
    console.log('This is likely causing the insights issue.\n');

    // Check if RPC is using these orphaned attempts
    console.log('Checking if these orphaned attempts affect sub-skill performance...');

    // Get question details for orphaned attempts
    const orphanedAttempts = attempts?.filter((a: any) => orphanedSessionIds.includes(a.session_id));
    console.log(`Total orphaned attempts: ${orphanedAttempts?.length || 0}`);
  } else {
    console.log('✓ No orphaned sessions found');
  }

  console.log('\n=== END DEBUG ===\n');
}

debugUserInsights().catch(console.error);
