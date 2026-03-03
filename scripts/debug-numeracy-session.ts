import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugNumeracySession() {
  console.log('\n🔍 DEBUGGING NUMERACY SESSION\n');

  const targetUserId = '320cf4a6-8914-4a25-8b1c-1007477d9adc';

  // Get the most recent Numeracy session
  const { data: sessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('product_type', 'Year 5 NAPLAN')
    .like('test_mode', 'practice_%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sessionsError) {
    console.error('❌ Error fetching sessions:', sessionsError);
    return;
  }

  console.log(`\n📊 Found ${sessions?.length || 0} recent practice sessions:\n`);

  sessions?.forEach((s, i) => {
    console.log(`${i + 1}. Session ${s.id.substring(0, 8)}...`);
    console.log(`   Section: ${s.section_name}`);
    console.log(`   Test Mode: ${s.test_mode}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Created: ${new Date(s.created_at).toLocaleString()}`);
    console.log(`   Completed: ${s.completed_at ? new Date(s.completed_at).toLocaleString() : 'N/A'}`);
    console.log(`   Questions Answered: ${s.questions_answered || 0}`);
    console.log(`   Correct Answers: ${s.correct_answers || 0}`);
    console.log(`   Total Questions: ${s.total_questions || 0}`);
    console.log(`   Final Score: ${s.final_score || 0}%`);
    console.log(`   Answers Data Keys: ${s.answers_data ? Object.keys(s.answers_data).length : 0}`);
    console.log();
  });

  // Get responses for the most recent session
  if (sessions && sessions.length > 0) {
    const mostRecentSession = sessions[0];
    console.log(`\n🔍 Checking responses for most recent session: ${mostRecentSession.id.substring(0, 8)}...`);
    console.log(`   Section: ${mostRecentSession.section_name}\n`);

    const { data: responses, error: responsesError } = await supabase
      .from('question_attempt_history')
      .select(`
        id,
        question_id,
        user_answer,
        is_correct,
        session_type,
        attempted_at,
        questions!inner(
          section_name,
          sub_skill,
          test_mode
        )
      `)
      .eq('session_id', mostRecentSession.id)
      .eq('user_id', targetUserId);

    console.log(`📝 Found ${responses?.length || 0} responses in question_attempt_history\n`);

    if (responses && responses.length > 0) {
      responses.forEach((r: any, i) => {
        console.log(`Response ${i + 1}:`);
        console.log(`  Question ID: ${r.question_id.substring(0, 8)}...`);
        console.log(`  User Answer: ${r.user_answer}`);
        console.log(`  Is Correct: ${r.is_correct}`);
        console.log(`  Section: ${r.questions.section_name}`);
        console.log(`  Sub-skill: ${r.questions.sub_skill}`);
        console.log(`  Test Mode: ${r.questions.test_mode}`);
        console.log();
      });

      const correctCount = responses.filter((r: any) => r.is_correct).length;
      console.log(`✅ Summary: ${correctCount}/${responses.length} correct\n`);
    } else {
      console.log(`❌ NO RESPONSES FOUND! This is the problem.\n`);
      console.log(`Session data shows:`);
      console.log(`  - questions_answered: ${mostRecentSession.questions_answered}`);
      console.log(`  - correct_answers: ${mostRecentSession.correct_answers}`);
      console.log(`  - answers_data: ${mostRecentSession.answers_data ? JSON.stringify(mostRecentSession.answers_data, null, 2) : 'null'}`);
      console.log(`\nBut no records in question_attempt_history table!`);
    }

    // Check if questions exist for this section
    console.log(`\n🔍 Checking questions for section "${mostRecentSession.section_name}"...\n`);

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, section_name, sub_skill, test_mode, max_points')
      .eq('product_type', 'Year 5 NAPLAN')
      .eq('test_mode', mostRecentSession.test_mode)
      .limit(5);

    console.log(`📚 Sample questions from test_mode "${mostRecentSession.test_mode}":\n`);
    questions?.forEach((q, i) => {
      console.log(`${i + 1}. Section: ${q.section_name}, Sub-skill: ${q.sub_skill}, Max Points: ${q.max_points}`);
    });

    // Check what section names exist
    const { data: allSections, error: sectionsError } = await supabase
      .from('questions')
      .select('section_name')
      .eq('product_type', 'Year 5 NAPLAN')
      .eq('test_mode', mostRecentSession.test_mode);

    const uniqueSections = new Set(allSections?.map(q => q.section_name));
    console.log(`\n📋 Unique section names in ${mostRecentSession.test_mode}:`, Array.from(uniqueSections));

    // Count questions by section
    console.log(`\n📊 Question counts by section:\n`);
    for (const section of uniqueSections) {
      const { data: sectionQuestions } = await supabase
        .from('questions')
        .select('max_points')
        .eq('product_type', 'Year 5 NAPLAN')
        .eq('test_mode', mostRecentSession.test_mode)
        .eq('section_name', section);

      const total = sectionQuestions?.reduce((sum, q) => sum + (q.max_points || 1), 0) || 0;
      console.log(`  ${section}: ${sectionQuestions?.length} questions, ${total} total points`);
    }
  }
}

debugNumeracySession().catch(console.error);
