import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkNSWDetails() {
  const { data: questions } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('product_type', 'NSW Selective Entry (Year 7 Entry)');

  if (!questions || questions.length === 0) {
    console.log('No NSW questions found!');
    return;
  }

  console.log(`Total NSW questions: ${questions.length}\n`);

  // Group by section and sub-skill
  const bySection: Record<string, any[]> = {};
  questions.forEach(q => {
    const key = `${q.section_name} > ${q.sub_skill}`;
    if (!bySection[key]) bySection[key] = [];
    bySection[key].push(q);
  });

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('NSW SELECTIVE: BREAKDOWN BY SECTION & SUB-SKILL');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  for (const [key, qs] of Object.entries(bySection)) {
    const diff1 = qs.filter(q => q.difficulty === 1).length;
    const diff2 = qs.filter(q => q.difficulty === 2).length;
    const diff3 = qs.filter(q => q.difficulty === 3).length;

    console.log(`${key}: ${qs.length} questions`);
    console.log(`  Difficulty 1: ${diff1}, Difficulty 2: ${diff2}, Difficulty 3: ${diff3}`);
    console.log();
  }

  // Show 3 example questions with different difficulties
  console.log('\n' + '▓'.repeat(80));
  console.log('SAMPLE QUESTIONS AT EACH DIFFICULTY LEVEL');
  console.log('▓'.repeat(80) + '\n');

  for (const difficulty of [1, 2, 3]) {
    const q = questions.find(q => q.difficulty === difficulty);
    if (q) {
      const diffLabel = difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : 'HARD';
      console.log(`┌${'─'.repeat(78)}┐`);
      console.log(`│ ${diffLabel} (Difficulty ${difficulty}) - ${q.sub_skill}`.padEnd(79) + '│');
      console.log(`└${'─'.repeat(78)}┘\n`);

      console.log('QUESTION:');
      console.log('─'.repeat(80));
      console.log(q.question_text.substring(0, 300) + (q.question_text.length > 300 ? '...' : ''));

      console.log('\nANSWER OPTIONS:');
      console.log('─'.repeat(80));
      if (q.answer_options && Array.isArray(q.answer_options)) {
        q.answer_options.forEach((opt: string) => console.log(opt));
      }

      console.log(`\nCORRECT ANSWER: ${q.correct_answer}`);
      console.log('\n');
    }
  }
}

checkNSWDetails()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
