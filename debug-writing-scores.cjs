const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWritingScores() {
  try {
    console.log('🔍 Debugging Writing Scores in Analytics...\n');

    // 1. Check writing questions in the database
    const { data: writingQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id, sub_skill, section_name, product_type, test_mode')
      .or('sub_skill.ilike.%writing%,section_name.ilike.%writing%')
      .limit(10);

    if (questionsError) {
      console.error('❌ Error fetching writing questions:', questionsError);
      return;
    }

    console.log(`📝 Found ${writingQuestions?.length || 0} writing questions`);
    if (writingQuestions?.length > 0) {
      console.log('Sample writing questions:');
      writingQuestions.slice(0, 3).forEach(q => {
        console.log(`  - ID: ${q.id}, Sub-skill: ${q.sub_skill}, Section: ${q.section_name}`);
      });
    }

    // 2. Check writing assessments
    const { data: writingAssessments, error: assessmentsError } = await supabase
      .from('writing_assessments')
      .select('id, question_id, session_id, total_score, max_possible_score, percentage_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (assessmentsError) {
      console.error('❌ Error fetching writing assessments:', assessmentsError);
      return;
    }

    console.log(`\n📊 Found ${writingAssessments?.length || 0} writing assessments`);
    if (writingAssessments?.length > 0) {
      console.log('Recent writing assessments:');
      writingAssessments.forEach(a => {
        console.log(`  - Question: ${a.question_id}, Score: ${a.total_score}/${a.max_possible_score} (${a.percentage_score}%)`);
      });
    }

    // 3. Check diagnostic sessions with writing sections
    const { data: writingSessions, error: sessionsError } = await supabase
      .from('user_test_sessions')
      .select('id, section_name, questions_answered, correct_answers, total_questions, final_score, status')
      .eq('test_mode', 'diagnostic')
      .ilike('section_name', '%writing%')
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error fetching writing sessions:', sessionsError);
      return;
    }

    console.log(`\n🎯 Found ${writingSessions?.length || 0} diagnostic writing sessions`);
    if (writingSessions?.length > 0) {
      console.log('Writing sessions:');
      writingSessions.forEach(s => {
        console.log(`  - Session: ${s.id}, Section: ${s.section_name}`);
        console.log(`    Questions: ${s.questions_answered}/${s.total_questions}, Score: ${s.final_score}%, Status: ${s.status}`);
      });
    }

    // 4. Check if writing assessments are linked to sessions
    if (writingSessions?.length > 0 && writingAssessments?.length > 0) {
      console.log('\n🔗 Checking assessment-session linkage...');
      
      const sessionIds = writingSessions.map(s => s.id);
      const linkedAssessments = writingAssessments.filter(a => sessionIds.includes(a.session_id));
      
      console.log(`Found ${linkedAssessments.length} assessments linked to writing sessions`);
      if (linkedAssessments.length === 0) {
        console.log('⚠️  WARNING: No writing assessments are linked to writing sessions!');
        console.log('   This might explain why writing scores show as 0% or default values.');
      }
    }

    // 5. Test the analytics query for a specific user
    const { data: testUser } = await supabase
      .from('user_test_sessions')
      .select('user_id')
      .eq('test_mode', 'diagnostic')
      .not('user_id', 'is', null)
      .limit(1)
      .single();

    if (testUser) {
      console.log(`\n🧪 Testing analytics query for user: ${testUser.user_id}`);
      
      // Get writing sub-skills
      const { data: writingSubSkills } = await supabase
        .from('sub_skills')
        .select('id, name, test_sections!inner(section_name)')
        .ilike('name', '%writing%')
        .limit(3);

      if (writingSubSkills?.length > 0) {
        console.log(`Found ${writingSubSkills.length} writing sub-skills`);
        
        // Test the analytics query for one sub-skill
        const testSubSkill = writingSubSkills[0];
        console.log(`\nTesting sub-skill: ${testSubSkill.name}`);
        
        // Get questions for this sub-skill
        const { data: subSkillQuestions } = await supabase
          .from('questions')
          .select('id')
          .eq('sub_skill_id', testSubSkill.id)
          .eq('test_mode', 'diagnostic');
        
        console.log(`  - Questions: ${subSkillQuestions?.length || 0}`);
        
        if (subSkillQuestions?.length > 0) {
          const questionIds = subSkillQuestions.map(q => q.id);
          
          // Get responses
          const { data: responses } = await supabase
            .from('question_attempt_history')
            .select('question_id, is_correct')
            .eq('user_id', testUser.user_id)
            .in('question_id', questionIds);
          
          console.log(`  - Responses: ${responses?.length || 0}`);
          
          // Get writing assessments
          const { data: assessments } = await supabase
            .from('writing_assessments')
            .select('question_id, percentage_score')
            .eq('user_id', testUser.user_id)
            .in('question_id', questionIds);
          
          console.log(`  - Writing assessments: ${assessments?.length || 0}`);
          
          if (assessments?.length > 0) {
            const avgScore = assessments.reduce((sum, a) => sum + a.percentage_score, 0) / assessments.length;
            console.log(`  - Average writing score: ${Math.round(avgScore)}%`);
          }
        }
      }
    }

    console.log('\n✅ Debug complete');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugWritingScores();