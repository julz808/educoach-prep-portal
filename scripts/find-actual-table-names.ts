import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTables() {
  const tablesToCheck = [
    'user_test_sessions',
    'user_sub_skill_performance',
    'user_progress',
    'question_attempt_history',
    'questions_v2',
    'writing_assessments',
    'drill_sessions',
    'sub_skills'
  ];

  console.log('Checking which tables exist...\n');

  for (const tableName of tablesToCheck) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (!error) {
      console.log(`✓ ${tableName} exists`);

      if (data && data.length > 0) {
        console.log(`  Sample columns: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
      }
    } else if (error.code === '42P01') {
      console.log(`✗ ${tableName} does NOT exist`);
    } else {
      console.log(`? ${tableName} - Error: ${error.message}`);
    }
  }

  // Check if the RPC function exists
  console.log('\n\nChecking if get_sub_skill_performance RPC function exists...\n');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_sub_skill_performance', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_product_type: 'test'
  });

  if (rpcError) {
    if (rpcError.code === 'PGRST202') {
      console.log('✗ get_sub_skill_performance RPC function does NOT exist');
      console.log('  This is the ROOT CAUSE of the insights issue!');
    } else {
      console.log(`? Error calling RPC: ${rpcError.message}`);
    }
  } else {
    console.log('✓ get_sub_skill_performance RPC function exists');
  }
}

findTables().catch(console.error);
