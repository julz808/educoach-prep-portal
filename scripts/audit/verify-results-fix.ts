import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const pageSize = 1000;

// Replicates the FIXED fetchQuestionsFromSupabase: filtered by product + stable (question_order,id) sort.
async function fixedFetch(testType: string) {
  let all: any[] = [];
  let from = 0, more = true;
  while (more) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('id, test_type, test_mode, section_name')
      .eq('test_type', testType)
      .order('question_order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all = all.concat(data || []);
    more = !!data && data.length === pageSize;
    from += pageSize;
  }
  return all;
}

async function main() {
  const { data: sessions } = await supabase
    .from('user_test_sessions')
    .select('id, product_type, test_mode, section_name, total_questions, status, created_at')
    .like('test_mode', 'practice_%')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);

  // cache fixed fetches per product
  const cache: Record<string, any[]> = {};
  let allGood = true;

  for (const s of sessions || []) {
    if (!cache[s.product_type]) cache[s.product_type] = await fixedFetch(s.product_type);
    const app = cache[s.product_type];
    const appSet = new Set(app.map((q) => q.id));
    if (appSet.size !== app.length) { console.log('  ⚠️ duplicates in product fetch!', s.product_type); allGood = false; }

    const appSection = app.filter(
      (q) => q.test_mode === s.test_mode && q.section_name === s.section_name
    );

    const { count: truth } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', s.product_type)
      .eq('test_mode', s.test_mode)
      .eq('section_name', s.section_name);

    const ok = appSection.length === truth;
    if (!ok) allGood = false;
    console.log(
      `${ok ? '✅' : '❌'} ${s.product_type} | ${s.test_mode} | "${s.section_name}" -> fixed loader=${appSection.length} dbTruth=${truth}`
    );
  }

  // Also verify every product fetches its full count with zero loss
  console.log('\n=== Per-product completeness (fixed loader) ===');
  const products = [...new Set((sessions || []).map((s) => s.product_type))];
  for (const p of products) {
    const ids = cache[p].map((q) => q.id);
    const { count } = await supabase.from('questions_v2').select('*', { count: 'exact', head: true }).eq('test_type', p);
    const ok = new Set(ids).size === count;
    if (!ok) allGood = false;
    console.log(`${ok ? '✅' : '❌'} ${p}: fetched unique ${new Set(ids).size} / db ${count}`);
  }

  console.log('\n' + (allGood ? '✅ ALL CHECKS PASSED — no drops, no drift' : '❌ SOME CHECKS FAILED'));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
