import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const products = ['VIC Selective Entry (Year 9 Entry)','EduTest Scholarship (Year 7 Entry)','NSW Selective Entry (Year 7 Entry)','ACER Scholarship (Year 7 Entry)','Year 5 NAPLAN','Year 7 NAPLAN'];

async function main() {
  for (const mode of ['diagnostic', 'drill']) {
    console.log(`\n=== ${mode.toUpperCase()} questions per product (single-query cap = 1000) ===`);
    for (const p of products) {
      const { count } = await supabase
        .from('questions_v2')
        .select('*', { count: 'exact', head: true })
        .eq('test_type', p)
        .eq('test_mode', mode);
      const flag = (count || 0) > 1000 ? '  <-- EXCEEDS 1000: old un-paginated query WAS truncating!' : '';
      console.log(`  ${count}\t${p}${flag}`);
    }
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
