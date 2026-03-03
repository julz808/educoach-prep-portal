import { createClient } from '@supabase/supabase-js';

(async () => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('questions_v2')
    .select('question_text, correct_answer, solution, created_at')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'General Ability - Quantitative')
    .eq('sub_skill', 'Number Grids & Matrices')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`\n🔍 Last 5 Generated "Number Grids & Matrices" Questions:\n`);
  console.log('═'.repeat(80));

  data.forEach((q, i) => {
    console.log(`\n${i + 1}. Generated: ${new Date(q.created_at).toLocaleString()}`);
    console.log('─'.repeat(80));
    console.log(q.question_text);
    console.log(`\nCorrect Answer: ${q.correct_answer}`);
    console.log('\nSolution:', q.solution);
    console.log('═'.repeat(80));
  });
})();
