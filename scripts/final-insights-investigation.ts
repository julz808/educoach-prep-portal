import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalInvestigation() {
  const userId = '52efea0e-d9a8-4f7c-95bb-9e903dd9d3b6';
  const productType = 'year-5-naplan';

  console.log('=== FINAL INVESTIGATION ===\n');
  console.log(`Checking ALL data sources for user: ${userId}\n`);

  // 1. user_sub_skill_performance
  console.log('1. user_sub_skill_performance table:');
  const { data: subSkillPerf, error: e1 } = await supabase
    .from('user_sub_skill_performance')
    .select('*')
    .eq('user_id', userId);

  if (e1) console.error('Error:', e1);
  else {
    console.log(`  Found ${subSkillPerf?.length || 0} rows`);
    if (subSkillPerf && subSkillPerf.length > 0) {
      subSkillPerf.forEach(row => {
        console.log(`    Product: ${row.product_type}, SubSkill: ${row.sub_skill_id}, Total: ${row.total_questions}, Attempted: ${row.attempted_questions}`);
      });
    }
  }

  // 2. user_test_sessions
  console.log('\n2. user_test_sessions table:');
  const { data: sessions, error: e2 } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', userId);

  if (e2) console.error('Error:', e2);
  else {
    console.log(`  Found ${sessions?.length || 0} rows`);
    if (sessions && sessions.length > 0) {
      sessions.forEach(s => {
        console.log(`    Product: ${s.product_type}, Mode: ${s.test_mode}, Section: ${s.section_name}, Status: ${s.status}`);
      });
    }
  }

  // 3. question_attempt_history
  console.log('\n3. question_attempt_history table:');
  const { data: attempts, error: e3 } = await supabase
    .from('question_attempt_history')
    .select('*')
    .eq('user_id', userId);

  if (e3) console.error('Error:', e3);
  else {
    console.log(`  Found ${attempts?.length || 0} rows`);
    if (attempts && attempts.length > 0) {
      const byType = attempts.reduce((acc: any, a: any) => {
        acc[a.session_type] = (acc[a.session_type] || 0) + 1;
        return acc;
      }, {});
      console.log('    By session type:', byType);
    }
  }

  // 4. drill_sessions
  console.log('\n4. drill_sessions table:');
  const { data: drills, error: e4 } = await supabase
    .from('drill_sessions')
    .select('*')
    .eq('user_id', userId);

  if (e4) console.error('Error:', e4);
  else {
    console.log(`  Found ${drills?.length || 0} rows`);
    if (drills && drills.length > 0) {
      drills.forEach(d => {
        console.log(`    Product: ${d.product_type}, SubSkill: ${d.sub_skill_id}, Status: ${d.status}`);
      });
    }
  }

  // 5. Check what the Insights page actually shows
  console.log('\n5. Simulating Insights page data load:\n');

  // First get sub-skill performance
  const { data: insights, error: e5 } = await supabase.rpc('get_sub_skill_performance', {
    p_user_id: userId,
    p_product_type: productType
  });

  if (e5) {
    console.error('  RPC Error:', e5);
  } else {
    console.log(`  get_sub_skill_performance returned: ${insights?.length || 0} rows`);
    if (insights && insights.length > 0) {
      console.log('\n  FOUND THE ISSUE! The RPC is returning data:');
      insights.forEach((item: any, idx: number) => {
        console.log(`\n    ${idx + 1}. ${item.skill_name || item.sub_skill_name}`);
        console.log(`       Section: ${item.section_name}`);
        console.log(`       Total: ${item.total_questions}`);
        console.log(`       Attempted: ${item.attempted_questions}`);
        console.log(`       Correct: ${item.correct_answers}`);
      });
    }
  }

  // 6. Check if maybe there's a caching issue or the Insights component is using local storage
  console.log('\n\n6. Additional checks:');
  console.log('  - The Insights page might be caching data in browser localStorage');
  console.log('  - Or the data might be coming from a different user_id');
  console.log('  - Or the RPC function might be looking at a different table');

  console.log('\n=== END INVESTIGATION ===\n');
}

finalInvestigation().catch(console.error);
