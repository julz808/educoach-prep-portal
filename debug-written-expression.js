import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debugWrittenExpression() {
  console.log('🔍 DEBUGGING WRITTEN EXPRESSION SUB-SKILLS');
  console.log('==========================================');
  
  // Check Written Expression questions for EduTest
  const { data: writingQuestions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_text, sub_skill, section_name, max_points, test_mode')
    .eq('product_type', 'EduTest Scholarship (Year 7 Entry)')
    .ilike('section_name', '%written%')
    .limit(10);
    
  if (questionsError) {
    console.error('❌ Error fetching writing questions:', questionsError);
  } else {
    console.log('✅ Writing questions found:', writingQuestions?.length || 0);
    writingQuestions?.forEach((q, i) => {
      console.log(`${i+1}. ID: ${q.id}`);
      console.log(`   Section: ${q.section_name}`);
      console.log(`   Sub-skill: ${q.sub_skill}`);
      console.log(`   Format: ${q.format}`);
      console.log(`   Max Points: ${q.max_points}`);
      console.log(`   Test Mode: ${q.test_mode}`);
      console.log(`   Text Preview: ${q.question_text?.substring(0, 100)}...`);
      console.log('');
    });
  }
  
  // Check practice test sessions for writing
  console.log('\n🔍 CHECKING PRACTICE TEST SESSIONS:');
  const { data: practiceSessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('id, section_name, status')
    .eq('user_id', '2c2e5c44-d953-48bc-89d7-52b8333edbda')
    .eq('product_type', 'EduTest Scholarship (Year 7 Entry)')
    .eq('test_mode', 'practice_1')
    .ilike('section_name', '%written%');
    
  if (sessionsError) {
    console.error('❌ Error fetching practice sessions:', sessionsError);
  } else {
    console.log('✅ Writing practice sessions:', practiceSessions?.length || 0);
    practiceSessions?.forEach(session => {
      console.log(`- Session ${session.id}: ${session.section_name} (${session.status})`);
    });
  }
  
  // Check what questions are in practice_1 written expression
  console.log('\n🔍 CHECKING PRACTICE_1 WRITTEN EXPRESSION QUESTIONS:');
  const { data: practice1Questions, error: practice1Error } = await supabase
    .from('questions')
    .select('id, question_text, sub_skill, section_name, max_points')
    .eq('product_type', 'EduTest Scholarship (Year 7 Entry)')
    .eq('test_mode', 'practice_1')
    .ilike('section_name', '%written%');
    
  if (practice1Error) {
    console.error('❌ Error fetching practice_1 questions:', practice1Error);
  } else {
    console.log('✅ Practice_1 writing questions:', practice1Questions?.length || 0);
    practice1Questions?.forEach((q, i) => {
      console.log(`${i+1}. ID: ${q.id}`);
      console.log(`   Sub-skill: ${q.sub_skill}`);
      console.log(`   Max Points: ${q.max_points}`);
      console.log(`   Text Preview: ${q.question_text?.substring(0, 80)}...`);
      console.log('');
    });
  }
  
  // Check question attempts for writing questions  
  console.log('\n🔍 CHECKING QUESTION ATTEMPTS:');
  const { data: attempts, error: attemptsError } = await supabase
    .from('question_attempt_history')
    .select(`
      id,
      question_id,
      is_correct,
      questions!inner(sub_skill, section_name)
    `)
    .eq('user_id', '2c2e5c44-d953-48bc-89d7-52b8333edbda')
    .ilike('questions.section_name', '%written%')
    .limit(10);
    
  if (attemptsError) {
    console.error('❌ Error fetching attempts:', attemptsError);
  } else {
    console.log('✅ Writing question attempts:', attempts?.length || 0);
    attempts?.forEach((attempt, i) => {
      console.log(`${i+1}. Question ID: ${attempt.question_id}`);
      console.log(`   Sub-skill: ${attempt.questions.sub_skill}`);
      console.log(`   Section: ${attempt.questions.section_name}`);
      console.log(`   Correct: ${attempt.is_correct}`);
      console.log('');
    });
  }
}

debugWrittenExpression().then(() => process.exit(0)).catch(console.error);