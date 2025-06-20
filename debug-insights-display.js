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

async function debugInsightsDisplay() {
  try {
    console.log('🔍 Debugging how practice test insights data flows from database to UI display...\n');
    
    // Since we found no real sessions, let's create a mock session to understand the flow
    const productType = 'VIC Selective Entry (Year 9 Entry)';
    const testNumber = 1;
    
    // First, get all practice_1 questions to create a realistic mock session
    const { data: practice1Questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, section_name, correct_answer')
      .eq('test_mode', 'practice_1')
      .eq('product_type', productType)
      .order('id');

    if (questionsError) {
      console.error('❌ Error fetching practice_1 questions:', questionsError);
      return;
    }

    console.log(`📊 Found ${practice1Questions?.length || 0} questions for practice_1`);

    if (!practice1Questions || practice1Questions.length === 0) {
      console.log('❌ No practice_1 questions found - cannot simulate session');
      return;
    }

    // Create a mock session with realistic data
    const mockSession = {
      id: 'mock-session-123',
      test_mode: 'practice_1',
      status: 'completed',
      total_questions: practice1Questions.length,
      questions_answered: Math.floor(practice1Questions.length * 0.9), // 90% completion
      correct_answers: Math.floor(practice1Questions.length * 0.75), // 75% accuracy
      final_score: 75,
      question_order: practice1Questions.map(q => q.id),
      answers_data: {}
    };

    // Fill in some mock answers
    practice1Questions.forEach((question, index) => {
      if (index < mockSession.questions_answered) {
        // Create realistic answer pattern (some correct, some incorrect)
        const isCorrect = Math.random() < 0.75; // 75% accuracy
        mockSession.answers_data[index] = isCorrect ? question.correct_answer : 'A'; // Mock wrong answer
      }
    });

    console.log(`📊 Mock session created:`, {
      totalQuestions: mockSession.total_questions,
      questionsAnswered: mockSession.questions_answered,
      correctAnswers: mockSession.correct_answers,
      finalScore: mockSession.final_score,
      questionOrderLength: mockSession.question_order.length,
      answersDataKeys: Object.keys(mockSession.answers_data).length
    });

    // Now simulate the getRealPracticeTestData function
    console.log(`\n🔄 Simulating getRealPracticeTestData with mock session...`);
    
    // Get sub-skills for this product
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

    // Simulate the processing loop
    const subSkillPerformance = [];
    const practiceTestMode = `practice_${testNumber}`;
    
    for (const subSkill of subSkillsData || []) {
      // Get questions for this sub-skill
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
      
      if (totalQuestions === 0) continue;

      // Simulate answer checking (this is where the real logic happens)
      const questionIds = questions?.map(q => q.id) || [];
      const questionOrder = mockSession.question_order || [];
      const answersData = mockSession.answers_data || {};
      
      let questionsAttempted = 0;
      let questionsCorrect = 0;
      
      questionIds.forEach((questionId) => {
        const questionIndex = questionOrder.indexOf(questionId);
        
        if (questionIndex >= 0) {
          const userAnswer = answersData[questionIndex];
          
          if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
            questionsAttempted++;
            
            const question = questions.find(q => q.id === questionId);
            if (question && userAnswer.toString().trim().toUpperCase() === question.correct_answer?.toString().trim().toUpperCase()) {
              questionsCorrect++;
            }
          }
        }
      });
      
      const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;
      const score = totalQuestions > 0 ? Math.round((questionsCorrect / totalQuestions) * 100) : 0;
      const sectionName = questions?.[0]?.section_name || 'Unknown';

      subSkillPerformance.push({
        subSkill: subSkill.name,
        subSkillId: subSkill.id,
        questionsTotal: totalQuestions,
        questionsAttempted,
        questionsCorrect,
        accuracy,
        score,
        sectionName
      });
    }

    console.log(`📊 Sub-skill performance calculated: ${subSkillPerformance.length} sub-skills`);

    // Build section breakdown (how the UI sees the data)
    const sectionStats = new Map();
    
    subSkillPerformance.forEach(skill => {
      const sectionName = skill.sectionName;
      
      if (!sectionStats.has(sectionName)) {
        sectionStats.set(sectionName, { total: 0, attempted: 0, correct: 0 });
      }
      
      const stats = sectionStats.get(sectionName);
      stats.total += skill.questionsTotal;
      stats.attempted += skill.questionsAttempted;
      stats.correct += skill.questionsCorrect;
    });

    // Build final results
    const sectionBreakdown = [];
    for (const [sectionName, stats] of sectionStats) {
      const score = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;

      sectionBreakdown.push({
        sectionName,
        score,
        accuracy,
        questionsCorrect: stats.correct,
        questionsTotal: stats.total,
        questionsAttempted: stats.attempted
      });
    }

    // Calculate overall totals
    const totalQuestions = sectionBreakdown.reduce((sum, section) => sum + section.questionsTotal, 0);
    const totalCorrect = sectionBreakdown.reduce((sum, section) => sum + section.questionsCorrect, 0);
    const totalAttempted = sectionBreakdown.reduce((sum, section) => sum + section.questionsAttempted, 0);
    const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    console.log(`\n📊 FINAL RESULTS (what the UI would display):`);
    console.log(`   Total questions: ${totalQuestions}`);
    console.log(`   Questions attempted: ${totalAttempted}`);
    console.log(`   Questions correct: ${totalCorrect}`);
    console.log(`   Overall score: ${overallScore}%`);
    console.log(`   Overall accuracy: ${overallAccuracy}%`);
    
    console.log(`\n📊 Section breakdown:`);
    sectionBreakdown.forEach(section => {
      console.log(`     ${section.sectionName}: ${section.questionsCorrect}/${section.questionsTotal} = ${section.score}%`);
    });

    console.log(`\n📊 Sub-skill breakdown (first 10):`);
    subSkillPerformance.slice(0, 10).forEach(skill => {
      console.log(`     ${skill.subSkill}: ${skill.questionsCorrect}/${skill.questionsTotal} = ${skill.score}%`);
    });

    console.log(`\n🎯 ANALYSIS:`);
    if (totalQuestions === 222) {
      console.log(`   ✅ Correct question count: ${totalQuestions} questions found`);
      console.log(`   ✅ All practice_1 questions are being processed correctly`);
      console.log(`   📊 If user sees ~60 questions, issue is likely:`);
      console.log(`       1. User is looking at a different test (not practice_1)`);
      console.log(`       2. User has incomplete session data`);
      console.log(`       3. User is seeing sub-skill count (${subSkillPerformance.length}) not question count`);
    } else {
      console.log(`   ❌ Issue found: Expected 222, got ${totalQuestions}`);
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugInsightsDisplay();