import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkActualDifficulty() {
  console.log('🔍 Checking Actual ACER Humanities Question Difficulty\n');
  console.log('Comparing questions labeled "Easy" vs "Medium" to see if they differ\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Fetch some Easy questions
  const { data: easyQuestions } = await supabase
    .from('questions_v2')
    .select('id, question_text, difficulty, sub_skill, answer_options, solution')
    .eq('product_type', 'ACER Scholarship (Year 7 Entry)')
    .eq('section_name', 'Humanities')
    .eq('difficulty', 1)
    .limit(5);

  // Fetch some Medium questions
  const { data: mediumQuestions } = await supabase
    .from('questions_v2')
    .select('id, question_text, difficulty, sub_skill, answer_options, solution')
    .eq('product_type', 'ACER Scholarship (Year 7 Entry)')
    .eq('section_name', 'Humanities')
    .eq('difficulty', 2)
    .limit(5);

  console.log('📋 EASY QUESTIONS (labeled difficulty = 1):\n');
  console.log('─'.repeat(80) + '\n');

  easyQuestions?.forEach((q, idx) => {
    console.log(`Example ${idx + 1}: ${q.sub_skill}`);
    console.log(`Question: ${q.question_text.substring(0, 300)}...`);
    console.log(`Options: ${q.answer_options?.length || 0} choices`);
    console.log(`Solution length: ${q.solution?.length || 0} characters`);
    console.log('');
  });

  console.log('\n' + '═'.repeat(80) + '\n');
  console.log('📋 MEDIUM QUESTIONS (labeled difficulty = 2):\n');
  console.log('─'.repeat(80) + '\n');

  mediumQuestions?.forEach((q, idx) => {
    console.log(`Example ${idx + 1}: ${q.sub_skill}`);
    console.log(`Question: ${q.question_text.substring(0, 300)}...`);
    console.log(`Options: ${q.answer_options?.length || 0} choices`);
    console.log(`Solution length: ${q.solution?.length || 0} characters`);
    console.log('');
  });

  console.log('\n' + '═'.repeat(80) + '\n');
  console.log('🤔 ANALYSIS:\n');
  console.log('Compare the complexity of "Easy" vs "Medium" questions above.');
  console.log('If they look similar in complexity, then it\'s just a labeling issue.');
  console.log('If "Easy" questions are genuinely simpler, Claude made them easier.\n');
}

checkActualDifficulty()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
