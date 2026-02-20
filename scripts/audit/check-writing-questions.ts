import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWritingQuestions() {
  console.log('Checking Writing/Written Expression questions in database...\n');

  const { data: allWriting, error } = await supabase
    .from('questions_v2')
    .select('*')
    .or('section_name.eq.Writing,section_name.eq.Written Expression')
    .order('test_type, section_name, created_at');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total Writing questions found: ${allWriting?.length}\n`);

  // Group by test type
  const byTest: Record<string, any[]> = {};
  for (const q of allWriting || []) {
    if (!byTest[q.test_type]) byTest[q.test_type] = [];
    byTest[q.test_type].push(q);
  }

  for (const [testType, questions] of Object.entries(byTest)) {
    console.log(`\n${'='.repeat(100)}`);
    console.log(`${testType} - ${questions.length} questions`);
    console.log('='.repeat(100));

    for (const q of questions.slice(0, 3)) { // Show first 3 for each test
      console.log(`\nID: ${q.id}`);
      console.log(`Section: ${q.section_name}`);
      console.log(`Mode: ${q.test_mode}`);
      console.log(`Sub-skill: ${q.sub_skill}`);
      console.log(`Response Type: ${q.response_type}`);
      console.log(`Question: ${q.question_text.substring(0, 200)}...`);
      console.log(`Answer Options: ${q.answer_options}`);
      console.log(`Correct Answer: ${q.correct_answer}`);
      console.log(`Has Visual: ${q.has_visual}`);
      console.log(`Created: ${q.created_at}`);
    }

    if (questions.length > 3) {
      console.log(`\n... and ${questions.length - 3} more questions`);
    }
  }

  // Check EduTest specifically
  console.log(`\n\n${'='.repeat(100)}`);
  console.log('EduTest Written Expression - Should have 0 but need to generate 12');
  console.log('='.repeat(100));

  const { data: edutest, error: edutestError } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'EduTest Scholarship (Year 7 Entry)')
    .eq('section_name', 'Written Expression');

  console.log(`Found: ${edutest?.length || 0} questions`);
  if (edutest && edutest.length > 0) {
    console.log('\nUnexpected! EduTest Written Expression should be empty but found:', edutest.length);
  } else {
    console.log('\nConfirmed: EduTest Written Expression is empty (expected)');
  }
}

checkWritingQuestions().catch(console.error);
