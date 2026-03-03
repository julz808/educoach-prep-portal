import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateInsightsIssue() {
  const userId = '52efea0e-d9a8-4f7c-95bb-9e903dd9d3b6'; // Replace with actual user ID if needed
  const productType = 'year-5-naplan';

  console.log('\n=== INVESTIGATING INSIGHTS ISSUE ===\n');
  console.log(`User ID: ${userId}`);
  console.log(`Product Type: ${productType}\n`);

  // 1. Check what the RPC function returns
  console.log('1. Calling get_sub_skill_performance RPC function...\n');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_sub_skill_performance', {
    p_user_id: userId,
    p_product_type: productType
  });

  if (rpcError) {
    console.error('RPC Error:', rpcError);
  } else {
    console.log('RPC Result:');
    console.log(JSON.stringify(rpcData, null, 2));
    console.log(`\nTotal sub-skills returned: ${rpcData?.length || 0}\n`);

    // Show breakdown by section
    const bySection = rpcData?.reduce((acc: any, item: any) => {
      acc[item.section_name] = (acc[item.section_name] || 0) + 1;
      return acc;
    }, {});
    console.log('Breakdown by section:', bySection);
  }

  // 2. Check all test sessions for this user and product
  console.log('\n\n2. Checking all practice_test_sessions...\n');
  const { data: sessions, error: sessionsError } = await supabase
    .from('practice_test_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .order('created_at', { ascending: false });

  if (sessionsError) {
    console.error('Sessions Error:', sessionsError);
  } else {
    console.log(`Found ${sessions?.length || 0} test sessions:\n`);
    sessions?.forEach((session, idx) => {
      console.log(`Session ${idx + 1}:`);
      console.log(`  ID: ${session.id}`);
      console.log(`  Test Type: ${session.test_type}`);
      console.log(`  Section: ${session.section_name}`);
      console.log(`  Status: ${session.status}`);
      console.log(`  Completed: ${session.completed}`);
      console.log(`  Created: ${session.created_at}`);
      console.log(`  Updated: ${session.updated_at}\n`);
    });
  }

  // 3. Check question_attempts for this user and product
  console.log('\n3. Checking question_attempt_history...\n');
  const { data: attempts, error: attemptsError } = await supabase
    .from('question_attempt_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (attemptsError) {
    console.error('Attempts Error:', attemptsError);
  } else {
    console.log(`Found ${attempts?.length || 0} question attempts\n`);

    // Show all attempts for analysis
    console.log('Sample attempts:');
    attempts?.slice(0, 10).forEach((attempt: any, idx: number) => {
      console.log(`  ${idx + 1}. Session: ${attempt.session_id}, Question: ${attempt.question_id}, Created: ${attempt.created_at}`);
    });
  }

  // 4. Check if there are any orphaned attempts (attempts with deleted sessions)
  console.log('\n\n4. Checking for orphaned attempts...\n');
  const sessionIds = sessions?.map(s => s.id) || [];
  const orphanedAttempts = attempts?.filter((a: any) =>
    a.session_id && !sessionIds.includes(a.session_id)
  );

  if (orphanedAttempts && orphanedAttempts.length > 0) {
    console.log(`⚠️  Found ${orphanedAttempts.length} orphaned attempts (session no longer exists):\n`);
    orphanedAttempts.forEach((attempt: any) => {
      console.log(`  Attempt ID: ${attempt.id}`);
      console.log(`  Session ID: ${attempt.session_id} (DELETED)`);
      console.log(`  Question ID: ${attempt.question_id}`);
      console.log(`  Section: ${attempt.questions_v2?.section_name}`);
      console.log(`  Created: ${attempt.created_at}\n`);
    });
  } else {
    console.log('✓ No orphaned attempts found');
  }

  // 5. Check the RPC function definition
  console.log('\n\n5. Checking RPC function definition...\n');
  const { data: funcDef, error: funcError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'get_sub_skill_performance'
    `
  }).single();

  if (funcError) {
    console.log('Could not retrieve function definition (this is OK, checking alternative way)');

    // Try direct query instead
    const { data: funcInfo } = await supabase
      .from('pg_proc')
      .select('*')
      .eq('proname', 'get_sub_skill_performance')
      .limit(1);

    if (funcInfo && funcInfo.length > 0) {
      console.log('Function exists in database');
    }
  } else {
    console.log('Function definition:', funcDef?.definition);
  }

  console.log('\n=== END INVESTIGATION ===\n');
}

investigateInsightsIssue().catch(console.error);
