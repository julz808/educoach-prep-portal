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

async function checkLatestResponses() {
  console.log('\n🔍 CHECKING LATEST TEST COMPLETION\n');

  const targetUserId = '320cf4a6-8914-4a25-8b1c-1007477d9adc';

  // Get the absolute latest session
  const { data: latestSession, error: sessionError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !latestSession) {
    console.error('❌ Error fetching latest session:', sessionError);
    return;
  }

  console.log('📊 LATEST SESSION:');
  console.log(`   ID: ${latestSession.id}`);
  console.log(`   Product: ${latestSession.product_type}`);
  console.log(`   Test Mode: ${latestSession.test_mode}`);
  console.log(`   Section: ${latestSession.section_name}`);
  console.log(`   Status: ${latestSession.status}`);
  console.log(`   Created: ${new Date(latestSession.created_at).toLocaleString()}`);
  console.log(`   Questions Answered: ${latestSession.questions_answered || 0}`);
  console.log(`   Correct Answers: ${latestSession.correct_answers || 0}`);
  console.log(`   Total Questions: ${latestSession.total_questions || 0}`);
  console.log(`   Answers Data: ${latestSession.answers_data ? Object.keys(latestSession.answers_data).length + ' answers' : 'none'}`);

  // Check for responses in question_attempt_history
  const { data: responses, error: responsesError } = await supabase
    .from('question_attempt_history')
    .select('*')
    .eq('session_id', latestSession.id)
    .eq('user_id', targetUserId);

  console.log(`\n📝 RESPONSES IN DATABASE:`);
  console.log(`   Count: ${responses?.length || 0}`);

  if (responses && responses.length > 0) {
    console.log(`   ✅ SUCCESS! Responses are being saved!\n`);
    responses.slice(0, 3).forEach((r, i) => {
      console.log(`   ${i + 1}. Question: ${r.question_id.substring(0, 8)}..., Answer: ${r.user_answer}, Correct: ${r.is_correct}`);
    });
    if (responses.length > 3) {
      console.log(`   ... and ${responses.length - 3} more`);
    }
  } else {
    console.log(`   ❌ STILL NO RESPONSES! Fix didn't work or need to complete new test.\n`);
  }

  // Now check what insights would see
  console.log(`\n🔍 WHAT INSIGHTS QUERY WOULD FIND:\n`);

  const { data: subSkills } = await supabase
    .from('sub_skills')
    .select('id, name')
    .eq('product_type', latestSession.product_type)
    .limit(5);

  console.log(`   Sub-skills for ${latestSession.product_type}:`);
  if (subSkills && subSkills.length > 0) {
    for (const subSkill of subSkills) {
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('sub_skill_id', subSkill.id)
        .eq('test_mode', latestSession.test_mode)
        .eq('product_type', latestSession.product_type);

      const questionIds = questions?.map(q => q.id) || [];

      const { data: subSkillResponses } = await supabase
        .from('question_attempt_history')
        .select('is_correct')
        .eq('user_id', targetUserId)
        .eq('session_id', latestSession.id)
        .in('question_id', questionIds);

      console.log(`   - ${subSkill.name}: ${questionIds.length} questions, ${subSkillResponses?.length || 0} responses`);
    }
  } else {
    console.log(`   ❌ No sub-skills found!`);
  }
}

checkLatestResponses().catch(console.error);
