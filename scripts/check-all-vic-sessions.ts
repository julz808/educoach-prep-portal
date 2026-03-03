/**
 * Check ALL VIC practice sessions regardless of status
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkAllVICSessions() {
  console.log('Checking ALL VIC practice sessions...\n');

  const { data: allSessions } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .like('test_mode', 'practice%')
    .order('created_at', { ascending: false });

  console.log(`Found ${allSessions?.length || 0} total sessions\n`);

  allSessions?.forEach((session, i) => {
    console.log(`Session ${i + 1}:`);
    console.log(`  ID: ${session.id}`);
    console.log(`  Section: ${session.section_name}`);
    console.log(`  Test mode: ${session.test_mode}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Total questions: ${session.total_questions}`);
    console.log(`  Questions answered: ${session.questions_answered}`);
    console.log(`  Correct answers: ${session.correct_answers}`);
    console.log(`  Final score: ${session.final_score}%`);
    console.log(`  Question order length: ${session.question_order?.length || 0}`);
    console.log(`  Created: ${session.created_at}`);
    console.log();
  });

  // Calculate what the UI might be seeing
  const completedSessions = allSessions?.filter(s => s.status === 'completed') || [];
  console.log('='.repeat(80));
  console.log(`Completed sessions: ${completedSessions.length}`);

  if (completedSessions.length > 0) {
    const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.total_questions || 0), 0);
    const totalAnswered = completedSessions.reduce((sum, s) => sum + (s.questions_answered || 0), 0);
    const totalCorrect = completedSessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);

    console.log(`  Total questions (sum of total_questions): ${totalQuestions}`);
    console.log(`  Total answered: ${totalAnswered}`);
    console.log(`  Total correct: ${totalCorrect}`);
  }
}

checkAllVICSessions();
