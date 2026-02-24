import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function showExamples() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('ACER HUMANITIES: DIFFICULTY COMPARISON BY SUB-SKILL');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // Sub-skills to examine
  const subSkills = [
    'Vocabulary in Context',
    'Main Idea & Theme Identification',
    'Analysis & Comparison'
  ];

  for (const subSkill of subSkills) {
    console.log('\n' + '▓'.repeat(80));
    console.log(`SUB-SKILL: ${subSkill.toUpperCase()}`);
    console.log('▓'.repeat(80) + '\n');

    // Get one example of each difficulty level
    for (const difficulty of [1, 2, 3]) {
      const { data } = await supabase
        .from('questions_v2')
        .select('question_text, answer_options, correct_answer, solution')
        .eq('product_type', 'ACER Scholarship (Year 7 Entry)')
        .eq('section_name', 'Humanities')
        .eq('sub_skill', subSkill)
        .eq('difficulty', difficulty)
        .limit(1)
        .single();

      if (data) {
        const diffLabel = difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : 'HARD';
        console.log(`\n┌${'─'.repeat(78)}┐`);
        console.log(`│ ${diffLabel} (Difficulty ${difficulty})`.padEnd(79) + '│');
        console.log(`└${'─'.repeat(78)}┘\n`);

        console.log('QUESTION:');
        console.log('─'.repeat(80));
        console.log(data.question_text);

        console.log('\nANSWER OPTIONS:');
        console.log('─'.repeat(80));
        if (data.answer_options && Array.isArray(data.answer_options)) {
          data.answer_options.forEach(opt => console.log(opt));
        } else {
          console.log('(No options stored - likely passage-based)');
        }

        console.log(`\nCORRECT ANSWER: ${data.correct_answer}`);

        console.log('\nSOLUTION/EXPLANATION:');
        console.log('─'.repeat(80));
        console.log(data.solution);

      } else {
        const diffLabel = difficulty === 1 ? 'EASY' : difficulty === 2 ? 'MEDIUM' : 'HARD';
        console.log(`\n┌${'─'.repeat(78)}┐`);
        console.log(`│ ${diffLabel} (Difficulty ${difficulty}) - NOT FOUND`.padEnd(79) + '│');
        console.log(`└${'─'.repeat(78)}┘\n`);
        console.log(`❌ No ${diffLabel} questions found for "${subSkill}"\n`);
      }
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('END OF EXAMPLES');
  console.log('═'.repeat(80) + '\n');
}

showExamples()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
