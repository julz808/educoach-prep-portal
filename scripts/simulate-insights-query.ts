/**
 * Simulate exactly what Insights page does when loading practice test data
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const QUESTIONS_TABLE = 'questions_v2';

const PRODUCT_ID_TO_TYPE: Record<string, string> = {
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
};

async function simulateInsightsQuery() {
  console.log('🎯 SIMULATING INSIGHTS PRACTICE TEST QUERY');
  console.log('='.repeat(80));
  console.log('');

  // Get recent user
  const { data: recent } = await supabase
    .from('user_test_sessions')
    .select('user_id, product_type')
    .like('test_mode', 'practice%')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (!recent) {
    console.log('No practice tests found');
    return;
  }

  const userId = recent.user_id;
  const productType = recent.product_type;
  const productId = 'year-5-naplan'; // Assuming based on screenshot

  console.log(`User: ${userId.substring(0, 8)}...`);
  console.log(`Product: ${productType}`);
  console.log('');

  // THIS IS EXACTLY WHAT getPracticeTestResults DOES
  console.log('📊 Step 1: Get all practice sessions...');

  const { data: practiceSessions, error: sessionsError } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .in('test_mode', ['practice', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .order('created_at');

  console.log(`   Found ${practiceSessions?.length || 0} sessions`);

  if (!practiceSessions || practiceSessions.length === 0) {
    console.log('   ❌ No sessions - this is why Insights shows nothing!');
    return;
  }

  console.log(`   Sessions:`, practiceSessions.map(s => `${s.test_mode}/${s.section_name}`));
  console.log('');

  // Step 2: Get practice test structure from questions table
  console.log('📊 Step 2: Get practice test structure from questions_v2...');

  const { data: testStructureData } = await supabase
    .from(QUESTIONS_TABLE)
    .select('test_mode, section_name')
    .eq('product_type', productType)
    .like('test_mode', 'practice%');

  const testModeStructure = new Map<string, Set<string>>();
  testStructureData?.forEach(q => {
    if (q.test_mode?.startsWith('practice_')) {
      if (!testModeStructure.has(q.test_mode)) {
        testModeStructure.set(q.test_mode, new Set());
      }
      testModeStructure.get(q.test_mode)!.add(q.section_name);
    }
  });

  console.log('   Expected structure:');
  for (const [mode, sections] of testModeStructure) {
    console.log(`     ${mode}: ${Array.from(sections).join(', ')}`);
  }
  console.log('');

  // Step 3: Get sub-skills
  console.log('📊 Step 3: Get sub-skills...');

  const { data: subSkillsData, error: subSkillsError } = await supabase
    .from('sub_skills')
    .select(`
      id,
      name,
      product_type,
      test_sections!inner(section_name)
    `)
    .eq('product_type', productType);

  console.log(`   Found ${subSkillsData?.length || 0} sub-skills`);

  if (!subSkillsData || subSkillsData.length === 0) {
    console.log('   ⚠️  NO SUB-SKILLS FOUND!');
    console.log('   This might cause issues with scoring...');
  }

  console.log('');

  // Step 4: Process test 1 (like the analytics service does)
  console.log('📊 Step 4: Process Practice Test 1 (like analytics service)...');

  const testMode = 'practice_1';
  const test1Sessions = practiceSessions.filter(s => s.test_mode === testMode && s.status === 'completed');

  console.log(`   Found ${test1Sessions.length} completed sections for practice_1`);

  if (test1Sessions.length === 0) {
    console.log('   ❌ No completed sections!');
    return;
  }

  // Group by section and take latest
  const latestSessionsBySection = new Map<string, any>();
  test1Sessions.forEach(session => {
    const existing = latestSessionsBySection.get(session.section_name);
    if (!existing || new Date(session.created_at) > new Date(existing.created_at)) {
      latestSessionsBySection.set(session.section_name, session);
    }
  });

  const testSessions = Array.from(latestSessionsBySection.values());
  console.log(`   Using ${testSessions.length} latest unique sessions`);
  console.log('');

  // Check if using sub-skills approach
  if (subSkillsData && subSkillsData.length > 0) {
    console.log('📊 Step 5: Calculate using SUB-SKILLS approach...');

    const subSkillPerformance = [];
    const sectionTotals = new Map<string, {questionsCorrect: number, questionsTotal: number, questionsAttempted: number}>();

    for (const subSkill of subSkillsData) {
      // Get questions for this sub-skill in practice_1
      const { data: questions } = await supabase
        .from(QUESTIONS_TABLE)
        .select('id, section_name, max_points')
        .eq('sub_skill_id', subSkill.id)
        .eq('test_mode', testMode)
        .eq('product_type', productType);

      if (!questions || questions.length === 0) {
        continue;
      }

      const totalPoints = questions.reduce((sum, q) => sum + (q.max_points || 1), 0);
      const questionIds = questions.map(q => q.id);
      const latestSessionIds = testSessions.map(s => s.id);

      // Get user responses for these questions from LATEST sessions only
      const { data: responses } = await supabase
        .from('question_attempt_history')
        .select('question_id, is_correct, user_answer')
        .eq('user_id', userId)
        .eq('session_type', 'practice')
        .in('question_id', questionIds)
        .in('session_id', latestSessionIds);

      const questionsAttempted = responses?.length || 0;
      const questionsCorrect = responses?.filter(r => r.is_correct).length || 0;

      if (questionsAttempted > 0) {
        const sectionName = questions[0]?.section_name || 'Unknown';

        subSkillPerformance.push({
          subSkill: subSkill.name,
          questionsTotal: totalPoints,
          questionsAttempted,
          questionsCorrect,
          sectionName
        });

        if (!sectionTotals.has(sectionName)) {
          sectionTotals.set(sectionName, {questionsCorrect: 0, questionsTotal: 0, questionsAttempted: 0});
        }
        const sectionData = sectionTotals.get(sectionName)!;
        sectionData.questionsCorrect += questionsCorrect;
        sectionData.questionsTotal += totalPoints;
        sectionData.questionsAttempted += questionsAttempted;
      }
    }

    console.log(`   Found ${subSkillPerformance.length} sub-skills with attempts`);
    console.log('');

    console.log('   Section Totals:');
    for (const [section, data] of sectionTotals) {
      const score = data.questionsTotal > 0 ? Math.round((data.questionsCorrect / data.questionsTotal) * 100) : 0;
      console.log(`     ${section}: ${data.questionsCorrect}/${data.questionsTotal} = ${score}%`);
      console.log(`        (Attempted: ${data.questionsAttempted})`);
    }
    console.log('');

    const totalCorrect = Array.from(sectionTotals.values()).reduce((sum, s) => sum + s.questionsCorrect, 0);
    const totalQuestions = Array.from(sectionTotals.values()).reduce((sum, s) => sum + s.questionsTotal, 0);
    const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    console.log(`   OVERALL: ${totalCorrect}/${totalQuestions} = ${overallScore}%`);

    if (totalQuestions === 0 || totalCorrect === 0) {
      console.log('');
      console.log('   ❌ THIS IS THE PROBLEM!');
      console.log('   Totals are 0 because sub-skills approach found no data.');
    }

  } else {
    console.log('📊 Step 5: NO SUB-SKILLS - Using fallback approach...');
    console.log('   This should NOT happen for production data!');
  }

  console.log('');
  console.log('='.repeat(80));
}

simulateInsightsQuery().catch(console.error);
