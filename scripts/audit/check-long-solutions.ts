import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLongSolutions() {
  console.log('🔍 Checking for questions with long solutions...\n');

  // Get all questions
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, test_type, section_name, solution')
    .order('id');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  if (!questions) {
    console.log('No questions found');
    return;
  }

  // Analyze solutions
  const problemQuestions = questions
    .map(q => {
      const wordCount = q.solution ? q.solution.split(/\s+/).length : 0;
      const solutionLength = q.solution ? q.solution.length : 0;
      const hasHallucinations = q.solution ? (
        q.solution.toLowerCase().includes('wait, let me') ||
        q.solution.toLowerCase().includes('let me recalculate') ||
        q.solution.toLowerCase().includes('actually, wait') ||
        q.solution.toLowerCase().includes('i apologize') ||
        q.solution.toLowerCase().includes('my mistake')
      ) : false;

      return {
        id: q.id,
        test_type: q.test_type,
        section_name: q.section_name,
        wordCount,
        solutionLength,
        hasHallucinations,
        preview: q.solution ? q.solution.substring(0, 150) : ''
      };
    })
    .filter(q => q.wordCount > 200 || q.hasHallucinations);

  const over200 = problemQuestions.filter(q => q.wordCount > 200);
  const over300 = problemQuestions.filter(q => q.wordCount > 300);
  const withHallucinations = problemQuestions.filter(q => q.hasHallucinations);

  console.log('📊 SUMMARY:');
  console.log(`Total questions in database: ${questions.length}`);
  console.log(`Questions with solutions over 200 words: ${over200.length}`);
  console.log(`Questions with solutions over 300 words: ${over300.length}`);
  console.log(`Questions with hallucination phrases: ${withHallucinations.length}\n`);

  if (over200.length > 0) {
    console.log('🚨 QUESTIONS WITH SOLUTIONS OVER 200 WORDS:');
    console.log('='.repeat(80));
    over200.forEach(q => {
      console.log(`\nID: ${q.id}`);
      console.log(`Test Type: ${q.test_type}`);
      console.log(`Section: ${q.section_name}`);
      console.log(`Word Count: ${q.wordCount}`);
      console.log(`Character Length: ${q.solutionLength}`);
      console.log(`Has Hallucinations: ${q.hasHallucinations}`);
      console.log(`Preview: ${q.preview}...`);
    });
  }

  if (withHallucinations.length > 0) {
    console.log('\n\n🚨 QUESTIONS WITH HALLUCINATION PHRASES:');
    console.log('='.repeat(80));
    withHallucinations.forEach(q => {
      console.log(`\nID: ${q.id}`);
      console.log(`Test Type: ${q.test_type}`);
      console.log(`Section: ${q.section_name}`);
      console.log(`Word Count: ${q.wordCount}`);
      console.log(`Preview: ${q.preview}...`);
    });
  }

  // Show distribution
  console.log('\n\n📈 WORD COUNT DISTRIBUTION:');
  console.log('='.repeat(80));
  const distribution = {
    '0-50': 0,
    '51-100': 0,
    '101-150': 0,
    '151-200': 0,
    '201-250': 0,
    '251-300': 0,
    '301+': 0
  };

  questions.forEach(q => {
    const wordCount = q.solution ? q.solution.split(/\s+/).length : 0;
    if (wordCount <= 50) distribution['0-50']++;
    else if (wordCount <= 100) distribution['51-100']++;
    else if (wordCount <= 150) distribution['101-150']++;
    else if (wordCount <= 200) distribution['151-200']++;
    else if (wordCount <= 250) distribution['201-250']++;
    else if (wordCount <= 300) distribution['251-300']++;
    else distribution['301+']++;
  });

  Object.entries(distribution).forEach(([range, count]) => {
    const percentage = ((count / questions.length) * 100).toFixed(1);
    console.log(`${range} words: ${count} (${percentage}%)`);
  });
}

checkLongSolutions();
