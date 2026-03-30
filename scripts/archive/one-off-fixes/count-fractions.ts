import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, count } = await supabase
    .from('questions_v2')
    .select('test_mode', { count: 'exact' })
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Fractions, Decimals & Percentages');

  console.log(`\nTotal Fractions, Decimals & Percentages questions: ${count}`);

  const modes: Record<string, number> = {};
  data?.forEach((q: any) => {
    modes[q.test_mode] = (modes[q.test_mode] || 0) + 1;
  });

  console.log('\nBy test mode:');
  Object.entries(modes).sort((a, b) => b[1] - a[1]).forEach(([mode, cnt]) => {
    console.log(`  ${mode}: ${cnt} questions`);
  });
}

main();
