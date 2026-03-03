import { createClient } from '@supabase/supabase-js';

(async () => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, test_mode, difficulty, question_text, sub_skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'General Ability - Quantitative')
    .eq('sub_skill', 'Number Grids & Matrices')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Total "Number Grids & Matrices" questions: ${data.length}\n`);

  const byMode: Record<string, number> = {};
  data.forEach(q => {
    byMode[q.test_mode] = (byMode[q.test_mode] || 0) + 1;
  });

  console.log('By mode:');
  Object.entries(byMode).sort().forEach(([mode, count]) => {
    console.log(`  ${mode}: ${count}`);
  });

  console.log('\nLast 5 questions generated:');
  data.slice(0, 5).forEach((q, i) => {
    const preview = q.question_text.substring(0, 100).replace(/\n/g, ' ');
    console.log(`${i + 1}. [${q.test_mode}] ${preview}...`);
  });
})();
