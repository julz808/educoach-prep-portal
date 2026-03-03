/**
 * Debug where the 309 total questions count is coming from
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function debug309Count() {
  console.log('Debugging the 309 total questions count...\n');

  // Get all practice_1 questions
  const { data: allQuestions } = await supabase
    .from('questions')
    .select('section_name, max_points')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1');

  console.log('All practice_1 questions:');
  const sectionTotals = new Map<string, { count: number, maxPoints: number }>();

  allQuestions?.forEach(q => {
    const section = q.section_name || 'Unknown';
    if (!sectionTotals.has(section)) {
      sectionTotals.set(section, { count: 0, maxPoints: 0 });
    }
    const stats = sectionTotals.get(section)!;
    stats.count++;
    stats.maxPoints += (q.max_points || 1);
  });

  let totalCount = 0;
  let totalMaxPoints = 0;

  Array.from(sectionTotals.entries()).forEach(([section, stats]) => {
    console.log(`  ${section}: ${stats.count} questions, ${stats.maxPoints} max_points`);
    totalCount += stats.count;
    totalMaxPoints += stats.maxPoints;
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total question count: ${totalCount}`);
  console.log(`Total max_points: ${totalMaxPoints}`);

  // Check user's completed sessions
  const { data: sessions } = await supabase
    .from('user_test_sessions')
    .select('section_name, total_questions, questions_answered')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1')
    .eq('status', 'completed');

  console.log('\n' + '='.repeat(80));
  console.log('User completed sessions:');
  let sessionTotalQuestions = 0;
  sessions?.forEach(s => {
    console.log(`  ${s.section_name}: total_questions=${s.total_questions}, answered=${s.questions_answered}`);
    sessionTotalQuestions += (s.total_questions || 0);
  });

  console.log(`\nSum of total_questions from sessions: ${sessionTotalQuestions}`);

  // Check if 309 could be from some calculation
  console.log('\n' + '='.repeat(80));
  console.log('Checking possible sources of 309:');
  console.log(`  All sections total: ${totalMaxPoints}`);
  console.log(`  Completed sections (GA-Q + Math): ${50 + 60} = 110`);
  console.log(`  220 + 60 + 29 = 309? (trying different combinations)`);
  console.log(`  280 + 29 = 309? No...`);
  console.log(`  Could 309 be sum of ALL question IDs in question_order arrays?`);

  // Check question_order arrays
  const { data: fullSessions } = await supabase
    .from('user_test_sessions')
    .select('section_name, question_order, total_questions')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1');

  console.log('\nQuestion order arrays:');
  let totalQuestionOrderLength = 0;
  fullSessions?.forEach(s => {
    const orderLength = s.question_order?.length || 0;
    console.log(`  ${s.section_name}: question_order.length=${orderLength}, total_questions=${s.total_questions}`);
    totalQuestionOrderLength += orderLength;
  });
  console.log(`\nSum of all question_order lengths: ${totalQuestionOrderLength}`);
}

debug309Count();
