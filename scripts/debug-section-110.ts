/**
 * Debug why General Ability - Quantitative shows 4/110
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function debugSection110() {
  console.log('Debugging General Ability - Quantitative 4/110...\n');

  // Find the user's practice test 1 session for General Ability - Quantitative
  const { data: sessions, error } = await supabase
    .from('user_test_sessions')
    .select('*')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1')
    .eq('section_name', 'General Ability - Quantitative')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !sessions || sessions.length === 0) {
    console.error('No session found:', error);
    return;
  }

  const session = sessions[0];
  console.log('Session found:');
  console.log('  ID:', session.id);
  console.log('  Status:', session.status);
  console.log('  Total questions:', session.total_questions);
  console.log('  Questions answered:', session.questions_answered);
  console.log('  Correct answers:', session.correct_answers);
  console.log('  Final score:', session.final_score);
  console.log('  Question order length:', session.question_order?.length || 0);

  // Check the actual questions for this section in practice_1
  const { data: questions } = await supabase
    .from('questions')
    .select('id, section_name, max_points')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1')
    .eq('section_name', 'General Ability - Quantitative');

  console.log('\nActual questions in database:');
  console.log('  Question count:', questions?.length || 0);
  console.log('  Total max_points:', questions?.reduce((sum, q) => sum + (q.max_points || 1), 0) || 0);

  // Now check what getSessionBasedPracticeData would calculate
  // It queries for practice_1 questions
  const { data: allPractice1Questions } = await supabase
    .from('questions')
    .select('id, section_name, max_points')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1');

  console.log('\nAll practice_1 questions:');
  console.log('  Total questions:', allPractice1Questions?.length || 0);

  // Group by section to simulate what happens in the function
  const sectionStats = new Map<string, { count: number, maxPoints: number }>();
  allPractice1Questions?.forEach(q => {
    const section = q.section_name || 'Unknown';
    if (!sectionStats.has(section)) {
      sectionStats.set(section, { count: 0, maxPoints: 0 });
    }
    const stats = sectionStats.get(section)!;
    stats.count++;
    stats.maxPoints += (q.max_points || 1);
  });

  console.log('\nSection breakdown in practice_1:');
  Array.from(sectionStats.entries()).forEach(([section, stats]) => {
    console.log(`  ${section}: ${stats.count} questions, ${stats.maxPoints} max_points`);
  });

  const totalMaxPoints = allPractice1Questions?.reduce((sum, q) => sum + (q.max_points || 1), 0) || 0;
  console.log('\nTotal max_points (what gets used as totalQuestions):', totalMaxPoints);

  // Now simulate the proportional distribution
  const gaQuantMaxPoints = sectionStats.get('General Ability - Quantitative')?.maxPoints || 0;
  const proportion = gaQuantMaxPoints / totalMaxPoints;
  const sectionTotal = Math.round(totalMaxPoints * proportion);

  console.log('\n🔍 Section calculation simulation:');
  console.log(`  GA Quantitative max_points: ${gaQuantMaxPoints}`);
  console.log(`  Total max_points: ${totalMaxPoints}`);
  console.log(`  Proportion: ${proportion.toFixed(3)}`);
  console.log(`  Section total (proportional): ${sectionTotal}`);
  console.log('\n❌ But wait - line 738 in analyticsService.ts uses:');
  console.log('  questionsTotal: section.maxPoints');
  console.log(`  Which would be: ${gaQuantMaxPoints}`);

  // Check if there's aggregation happening
  console.log('\n🔍 Checking for section name mapping...');
  console.log('  Original name: "General Ability - Quantitative"');
  console.log('  In curriculum it might map to: "Numerical Reasoning"');

  // Check if there are other sections that might aggregate
  const { data: allSections } = await supabase
    .from('questions')
    .select('section_name, COUNT(*) as count, SUM(max_points) as total')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1');

  console.log('\nChecking if 110 comes from aggregation of multiple sections...');
}

debugSection110();
