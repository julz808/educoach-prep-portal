import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSpecificSession() {
  try {
    console.log('🔍 Debugging specific practice test session to find the 60 vs 222 question issue...\n');
    
    const productType = 'VIC Selective Entry (Year 9 Entry)';
    
    // 1. Find a completed practice test session
    console.log('1️⃣ Finding completed practice test sessions:');
    const { data: sessions, error: sessionError } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('product_type', productType)
      .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice'])
      .eq('status', 'completed')
      .limit(5);

    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('   No completed practice test sessions found.');
      return;
    }

    console.log(`   Found ${sessions.length} completed sessions:`);
    sessions.forEach((session, idx) => {
      console.log(`     ${idx + 1}. Session ${session.id}: ${session.test_mode}, Score: ${session.final_score}%, Questions: ${session.total_questions}, Correct: ${session.correct_answers}`);
    });

    // Use the first session for detailed analysis
    const session = sessions[0];
    console.log(`\n2️⃣ Analyzing session ${session.id} (${session.test_mode}):`);
    
    // Check session data structure
    console.log('   Session data:');
    console.log(`     - Total questions: ${session.total_questions}`);
    console.log(`     - Questions answered: ${session.questions_answered}`);
    console.log(`     - Correct answers: ${session.correct_answers}`);
    console.log(`     - Final score: ${session.final_score}%`);
    console.log(`     - Question order length: ${session.question_order?.length || 'null'}`);
    console.log(`     - Answers data keys: ${session.answers_data ? Object.keys(session.answers_data).length : 'null'}`);

    // Extract test number from test_mode
    const testNumber = session.test_mode?.startsWith('practice_') ? 
      parseInt(session.test_mode.split('_')[1]) : 1;
    
    console.log(`\n3️⃣ Running getRealPracticeTestData logic for test ${testNumber}:`);
    
    // Simulate the same logic as getRealPracticeTestData
    // Step 1: Get all sub-skills for this product
    const { data: subSkillsData, error: subSkillsError } = await supabase
      .from('sub_skills')
      .select(`
        id,
        name,
        test_sections!inner(
          id,
          section_name,
          product_type
        )
      `)
      .eq('test_sections.product_type', productType);

    if (subSkillsError) {
      console.error('❌ Error fetching sub-skills:', subSkillsError);
      return;
    }

    console.log(`   Found ${subSkillsData?.length || 0} sub-skills for ${productType}`);

    // Step 2: For each sub-skill, check practice questions
    const practiceTestMode = `practice_${testNumber}`;
    let totalQuestionsFound = 0;
    let questionsInSession = 0;
    
    console.log(`   Looking for questions with test_mode: "${practiceTestMode}"`);
    
    for (const subSkill of subSkillsData || []) {
      // Get practice questions for this sub-skill and test
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, section_name, correct_answer, test_mode')
        .eq('sub_skill_id', subSkill.id)
        .in('test_mode', [practiceTestMode, 'practice'])
        .eq('product_type', productType);

      if (questionsError) {
        console.error(`❌ Error fetching questions for sub-skill ${subSkill.name}:`, questionsError);
        continue;
      }

      const totalQuestions = questions?.length || 0;
      totalQuestionsFound += totalQuestions;
      
      if (totalQuestions > 0) {
        // Check how many of these questions are in this session
        const questionIds = questions?.map(q => q.id) || [];
        const questionOrder = session.question_order || [];
        
        const questionsInThisSession = questionIds.filter(id => questionOrder.includes(id)).length;
        questionsInSession += questionsInThisSession;
        
        console.log(`     ${subSkill.name} (${subSkill.test_sections?.section_name}): ${totalQuestions} available, ${questionsInThisSession} in session`);
      }
    }
    
    console.log(`\n4️⃣ Analysis Results:`);
    console.log(`   Total questions found across all sub-skills: ${totalQuestionsFound}`);
    console.log(`   Questions actually in this session: ${questionsInSession}`);
    console.log(`   Session's question_order length: ${session.question_order?.length || 'null'}`);
    console.log(`   Session's total_questions: ${session.total_questions}`);
    
    // The issue might be here - check if we're looking at the right test mode
    console.log(`\n5️⃣ Test mode investigation:`);
    console.log(`   Session test_mode: ${session.test_mode}`);
    console.log(`   Looking for questions with test_mode: ${practiceTestMode}`);
    
    // Check what test_modes actually exist for questions in this session
    if (session.question_order && session.question_order.length > 0) {
      const { data: sessionQuestions, error: sessionQuestionsError } = await supabase
        .from('questions')
        .select('id, test_mode, section_name, sub_skill_id')
        .in('id', session.question_order)
        .eq('product_type', productType);
      
      if (!sessionQuestionsError && sessionQuestions) {
        console.log(`   Questions in session by test_mode:`);
        const testModeBreakdown = {};
        sessionQuestions.forEach(q => {
          if (!testModeBreakdown[q.test_mode]) testModeBreakdown[q.test_mode] = 0;
          testModeBreakdown[q.test_mode]++;
        });
        Object.entries(testModeBreakdown).forEach(([mode, count]) => {
          console.log(`     - ${mode}: ${count} questions`);
        });
        
        // Check sub-skill assignment
        const withSubSkill = sessionQuestions.filter(q => q.sub_skill_id).length;
        const withoutSubSkill = sessionQuestions.filter(q => !q.sub_skill_id).length;
        console.log(`   Questions with sub_skill_id: ${withSubSkill}`);
        console.log(`   Questions without sub_skill_id: ${withoutSubSkill}`);
        
        if (withoutSubSkill > 0) {
          console.log('   ❌ FOUND THE ISSUE: Some questions are not assigned to sub-skills!');
        }
      }
    }
    
    console.log(`\n6️⃣ Conclusion:`);
    if (questionsInSession < (session.question_order?.length || 0)) {
      console.log(`   ❌ Issue confirmed: Analytics finds ${questionsInSession} questions, but session has ${session.question_order?.length || session.total_questions}`);
      console.log(`   Root cause: The getRealPracticeTestData function only counts questions that are assigned to sub-skills`);
      console.log(`   Solution: Either ensure all questions are assigned to sub-skills, or modify the analytics logic`);
    } else {
      console.log(`   ✅ Question counts match - issue may be elsewhere`);
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugSpecificSession();