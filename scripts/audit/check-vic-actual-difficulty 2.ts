import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkVicDifficulty() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('VIC SELECTIVE: ACTUAL DIFFICULTY VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // First, get the distribution
  const { data: allQuestions } = await supabase
    .from('questions_v2')
    .select('difficulty, section_name, sub_skill')
    .eq('product_type', 'VIC Selective (Year 9 Entry)');

  if (!allQuestions) {
    console.log('No VIC questions found');
    return;
  }

  // Count by difficulty
  const diffCounts = { 1: 0, 2: 0, 3: 0 };
  allQuestions.forEach(q => {
    diffCounts[q.difficulty as 1 | 2 | 3]++;
  });

  const total = allQuestions.length;
  console.log('📊 VIC SELECTIVE DIFFICULTY DISTRIBUTION:');
  console.log('─'.repeat(80));
  console.log(`Easy (1):   ${diffCounts[1].toString().padStart(4)} / ${total} (${((diffCounts[1]/total)*100).toFixed(1)}%)`);
  console.log(`Medium (2): ${diffCounts[2].toString().padStart(4)} / ${total} (${((diffCounts[2]/total)*100).toFixed(1)}%)`);
  console.log(`Hard (3):   ${diffCounts[3].toString().padStart(4)} / ${total} (${((diffCounts[3]/total)*100).toFixed(1)}%)`);
  console.log(`Total:      ${total}`);

  // Now get actual examples from Verbal Reasoning
  const subSkill = 'Analogies';

  console.log('\n\n' + '▓'.repeat(80));
  console.log(`VERBAL REASONING - ${subSkill.toUpperCase()}`);
  console.log('▓'.repeat(80) + '\n');

  for (const difficulty of [1, 2, 3]) {
    const { data } = await supabase
      .from('questions_v2')
      .select('question_text, answer_options, correct_answer, solution')
      .eq('product_type', 'VIC Selective (Year 9 Entry)')
      .eq('section_name', 'Verbal Reasoning')
      .eq('sub_skill', subSkill)
      .eq('difficulty', difficulty)
      .limit(1)
      .single();

    if (data) {
      const diffLabel = difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : 'HARD';
      console.log(`┌${'─'.repeat(78)}┐`);
      console.log(`│ ${diffLabel} (Difficulty ${difficulty})`.padEnd(79) + '│');
      console.log(`└${'─'.repeat(78)}┘\n`);

      console.log('QUESTION:');
      console.log('─'.repeat(80));
      console.log(data.question_text);

      console.log('\nANSWER OPTIONS:');
      console.log('─'.repeat(80));
      if (data.answer_options && Array.isArray(data.answer_options)) {
        data.answer_options.forEach(opt => console.log(opt));
      }

      console.log(`\nCORRECT ANSWER: ${data.correct_answer}`);

      console.log('\nSOLUTION:');
      console.log('─'.repeat(80));
      console.log(data.solution);
      console.log('\n');
    } else {
      const diffLabel = difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : 'HARD';
      console.log(`❌ No ${diffLabel} questions found for "${subSkill}"\n`);
    }
  }

  // Now check Numerical Reasoning
  const numSubSkill = 'Number Patterns';

  console.log('\n' + '▓'.repeat(80));
  console.log(`NUMERICAL REASONING - ${numSubSkill.toUpperCase()}`);
  console.log('▓'.repeat(80) + '\n');

  for (const difficulty of [1, 2, 3]) {
    const { data } = await supabase
      .from('questions_v2')
      .select('question_text, answer_options, correct_answer, solution')
      .eq('product_type', 'VIC Selective (Year 9 Entry)')
      .eq('section_name', 'Numerical Reasoning')
      .eq('sub_skill', numSubSkill)
      .eq('difficulty', difficulty)
      .limit(1)
      .single();

    if (data) {
      const diffLabel = difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : 'HARD';
      console.log(`┌${'─'.repeat(78)}┐`);
      console.log(`│ ${diffLabel} (Difficulty ${difficulty})`.padEnd(79) + '│');
      console.log(`└${'─'.repeat(78)}┘\n`);

      console.log('QUESTION:');
      console.log('─'.repeat(80));
      console.log(data.question_text);

      console.log('\nANSWER OPTIONS:');
      console.log('─'.repeat(80));
      if (data.answer_options && Array.isArray(data.answer_options)) {
        data.answer_options.forEach(opt => console.log(opt));
      }

      console.log(`\nCORRECT ANSWER: ${data.correct_answer}`);

      console.log('\nSOLUTION:');
      console.log('─'.repeat(80));
      console.log(data.solution);
      console.log('\n');
    } else {
      const diffLabel = difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : 'HARD';
      console.log(`❌ No ${diffLabel} questions found for "${numSubSkill}"\n`);
    }
  }

  console.log('═'.repeat(80));
  console.log('END OF VIC SELECTIVE DIFFICULTY CHECK');
  console.log('═'.repeat(80));
}

checkVicDifficulty()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
