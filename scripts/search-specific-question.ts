import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchSpecificQuestion() {
  console.log('🔍 Searching for question with options: 81, 81, 69, 73...\n');

  // Fetch ALL questions (no limit)
  const { data: questions, error, count } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`✅ Fetched ${questions?.length || 0} questions (total: ${count})\n`);

  if (!questions || questions.length === 0) {
    console.log('No questions found.');
    return;
  }

  // Search for questions containing "81" in any option
  const questionsWithEighty1 = questions.filter((q: any) => {
    if (!q.options || q.options.length === 0) return false;
    return q.options.some((opt: string) => opt.includes('81'));
  });

  console.log(`Found ${questionsWithEighty1.length} questions containing "81" in options\n`);

  // Look for the specific pattern: 81, 81, 69, 73 (in any order)
  const specificPattern = questionsWithEighty1.filter((q: any) => {
    const optionsSet = new Set(q.options.map((o: string) => o.trim()));
    return (
      optionsSet.has('81') &&
      optionsSet.has('69') &&
      optionsSet.has('73') &&
      q.options.filter((o: string) => o.trim() === '81').length >= 2
    );
  });

  if (specificPattern.length > 0) {
    console.log('🎯 Found the specific question mentioned by user:\n');
    specificPattern.forEach((q: any) => {
      console.log('='.repeat(80));
      console.log(`ID: ${q.id}`);
      console.log(`Test: ${q.test_type} - ${q.test_mode} Q${q.question_number}`);
      console.log(`Sub-skill: ${q.sub_skill}`);
      console.log(`Question: ${q.question_text}`);
      console.log(`Options: ${q.options.join(', ')}`);
      console.log(`Correct Answer: ${q.correct_answer}`);
      console.log('='.repeat(80));
      console.log();
    });
  } else {
    console.log('❌ Did not find the specific pattern (81, 81, 69, 73)');
  }

  // Show all questions with 81
  if (questionsWithEighty1.length > 0 && questionsWithEighty1.length <= 20) {
    console.log('\n📋 All questions containing "81":\n');
    questionsWithEighty1.forEach((q: any) => {
      console.log(`ID ${q.id}: ${q.sub_skill} - Options: ${q.options.join(', ')}`);
    });
  }
}

searchSpecificQuestion();
