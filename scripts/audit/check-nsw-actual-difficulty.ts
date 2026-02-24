import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkNSWDifficulty() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('NSW SELECTIVE: ACTUAL DIFFICULTY VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // Get examples from Verbal Reasoning - Analogies
  const subSkill = 'Analogies';

  console.log('▓'.repeat(80));
  console.log(`VERBAL REASONING - ${subSkill.toUpperCase()}`);
  console.log('▓'.repeat(80) + '\n');

  for (const difficulty of [1, 2, 3]) {
    const { data } = await supabase
      .from('questions_v2')
      .select('question_text, answer_options, correct_answer, solution')
      .eq('product_type', 'NSW Selective Entry (Year 7 Entry)')
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

  console.log('═'.repeat(80));
  console.log('END OF NSW SELECTIVE DIFFICULTY CHECK');
  console.log('═'.repeat(80));
}

checkNSWDifficulty()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
