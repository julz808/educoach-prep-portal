/**
 * Comprehensive Practice Test Insights Audit
 *
 * This script checks EVERYTHING to find why Insights shows 0/0
 * for completed practice tests.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditPracticeTests() {
  console.log('🔍 COMPREHENSIVE PRACTICE TEST INSIGHTS AUDIT');
  console.log('='.repeat(80));
  console.log('');

  // Get the most recent user with completed practice tests
  const { data: recentPractice, error: practiceError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .like('test_mode', 'practice%')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(10);

  if (practiceError || !recentPractice || recentPractice.length === 0) {
    console.log('⚠️  No completed practice tests found');
    return;
  }

  const userId = recentPractice[0].user_id;
  const productType = recentPractice[0].product_type;

  console.log(`📊 Analyzing Practice Tests for:`);
  console.log(`   User: ${userId.substring(0, 8)}...`);
  console.log(`   Product: ${productType}`);
  console.log('');

  // Get ALL practice test sessions for this user/product
  const { data: allPracticeSessions } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .like('test_mode', 'practice%')
    .order('test_mode, section_name');

  console.log(`📝 Total Practice Sessions: ${allPracticeSessions?.length || 0}`);
  console.log('');

  if (!allPracticeSessions || allPracticeSessions.length === 0) {
    return;
  }

  // Group by test mode
  const byTestMode = new Map<string, any[]>();
  allPracticeSessions.forEach(s => {
    const key = s.test_mode || 'unknown';
    if (!byTestMode.has(key)) byTestMode.set(key, []);
    byTestMode.get(key)!.push(s);
  });

  console.log('📋 SESSIONS BY TEST MODE:');
  console.log('─'.repeat(80));

  for (const [testMode, sessions] of byTestMode) {
    console.log(`\n${testMode}:`);
    sessions.forEach(s => {
      console.log(`   - ${s.section_name} (${s.status})`);
      console.log(`     ID: ${s.id.substring(0, 8)}...`);
      console.log(`     Score: ${s.final_score}% (${s.correct_answers}/${s.total_questions})`);
      console.log(`     Completed: ${s.completed_at || 'Not completed'}`);
      console.log(`     Has question_order: ${!!(s.question_order && Array.isArray(s.question_order) && s.question_order.length > 0)}`);
      console.log(`     Has answers_data: ${!!(s.answers_data && Object.keys(s.answers_data).length > 0)}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 CHECKING WHAT INSIGHTS WOULD QUERY:\n');

  // Simulate what getPracticeTestResults does
  console.log('📊 Step 1: Querying practice sessions (like Insights does)...');

  const { data: insightsSessions, error: insightsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .in('test_mode', ['practice', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .order('created_at');

  console.log(`   Found ${insightsSessions?.length || 0} sessions`);
  console.log('');

  if (insightsSessions && insightsSessions.length > 0) {
    console.log('   Test modes found:', [...new Set(insightsSessions.map(s => s.test_mode))]);
    console.log('   Sections found:', [...new Set(insightsSessions.map(s => s.section_name))]);
    console.log('');
  }

  // Check question_attempt_history for these sessions
  console.log('📊 Step 2: Checking question_attempt_history...');

  const sessionIds = allPracticeSessions.map(s => s.id);
  const { data: attempts, error: attemptsError } = await supabase
    .from('question_attempt_history')
    .select('session_id, question_id, is_correct')
    .in('session_id', sessionIds);

  console.log(`   Total question attempts: ${attempts?.length || 0}`);

  if (attempts && attempts.length > 0) {
    const bySession = new Map<string, number>();
    attempts.forEach(a => {
      bySession.set(a.session_id, (bySession.get(a.session_id) || 0) + 1);
    });

    console.log('   Attempts by session:');
    for (const [sessionId, count] of bySession) {
      const session = allPracticeSessions.find(s => s.id === sessionId);
      console.log(`     ${session?.section_name || 'Unknown'}: ${count} attempts`);
    }
  } else {
    console.log('   ⚠️  NO QUESTION ATTEMPTS FOUND!');
    console.log('   This is why Insights shows 0/0!');
  }

  console.log('');

  // Check sub_skills table
  console.log('📊 Step 3: Checking sub_skills table...');

  const { data: subSkills, error: subSkillsError } = await supabase
    .from('sub_skills')
    .select('id, name, product_type')
    .eq('product_type', productType);

  console.log(`   Sub-skills in database: ${subSkills?.length || 0}`);
  console.log('');

  // Check questions_v2 for practice tests
  console.log('📊 Step 4: Checking questions_v2 for practice tests...');

  const { data: practiceQuestions, error: questionsError } = await supabase
    .from('questions_v2')
    .select('test_mode, section_name')
    .eq('product_type', productType)
    .like('test_mode', 'practice%');

  if (practiceQuestions && practiceQuestions.length > 0) {
    const questionsByMode = new Map<string, Set<string>>();
    practiceQuestions.forEach(q => {
      if (!questionsByMode.has(q.test_mode)) {
        questionsByMode.set(q.test_mode, new Set());
      }
      questionsByMode.get(q.test_mode)!.add(q.section_name);
    });

    console.log('   Questions in database:');
    for (const [mode, sections] of questionsByMode) {
      console.log(`     ${mode}: ${Array.from(sections).join(', ')}`);
    }
  } else {
    console.log('   ⚠️  NO PRACTICE QUESTIONS FOUND IN questions_v2!');
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('\n🔍 ROOT CAUSE ANALYSIS:\n');

  // Identify the issues
  const issues = [];

  if (!attempts || attempts.length === 0) {
    issues.push('❌ NO QUESTION ATTEMPTS - DeveloperToolsReplicaService not saving attempts');
  }

  if (!subSkills || subSkills.length === 0) {
    issues.push('❌ NO SUB-SKILLS - Analytics service needs sub-skills to calculate scores');
  }

  if (!practiceQuestions || practiceQuestions.length === 0) {
    issues.push('❌ NO PRACTICE QUESTIONS IN questions_v2 - Cannot calculate totals');
  }

  const hasValidStructure = allPracticeSessions.every(s =>
    s.question_order && Array.isArray(s.question_order) && s.question_order.length > 0 &&
    s.answers_data && Object.keys(s.answers_data).length > 0
  );

  if (!hasValidStructure) {
    issues.push('❌ INVALID SESSION STRUCTURE - Missing question_order or answers_data');
  }

  if (issues.length > 0) {
    console.log('🚨 ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log('✅ No obvious issues found - need deeper investigation');
  }

  console.log('');
  console.log('='.repeat(80));
}

auditPracticeTests().catch(console.error);
