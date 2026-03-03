/**
 * Debug where the 110 count is coming from
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function debug110Count() {
  console.log('Debugging the 110 question count for VIC Practice Test 1...\n');

  // Get ALL practice_1 questions from old table (since that's what the app would have used)
  const { data: questions } = await supabase
    .from('questions')
    .select('id, section_name, max_points')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1');

  console.log(`Total questions in practice_1: ${questions?.length || 0}`);

  // Group by section
  const sectionStats = new Map<string, { count: number, totalMaxPoints: number }>();

  questions?.forEach(q => {
    const section = q.section_name || 'Unknown';
    if (!sectionStats.has(section)) {
      sectionStats.set(section, { count: 0, totalMaxPoints: 0 });
    }
    const stats = sectionStats.get(section)!;
    stats.count++;
    stats.totalMaxPoints += (q.max_points || 1);
  });

  console.log('\nSection breakdown:');
  console.log('='.repeat(80));
  let totalQuestions = 0;
  let totalMaxPoints = 0;

  Array.from(sectionStats.entries()).sort().forEach(([section, stats]) => {
    console.log(`${section}:`);
    console.log(`  Question count: ${stats.count}`);
    console.log(`  Total max_points: ${stats.totalMaxPoints}`);
    totalQuestions += stats.count;
    totalMaxPoints += stats.totalMaxPoints;
  });

  console.log('='.repeat(80));
  console.log(`\nTotal actual question count: ${totalQuestions}`);
  console.log(`Total max_points sum: ${totalMaxPoints}`);

  // Now simulate what happens in the getSessionBasedPracticeData function
  console.log('\n🔍 Simulating getSessionBasedPracticeData calculation:');
  console.log(`Line 699: totalMaxPoints = practiceQuestions.reduce((sum, q) => sum + (q.max_points || 1), 0)`);
  console.log(`Result: totalMaxPoints = ${totalMaxPoints}`);
  console.log(`\nLine 834: return { totalQuestions: totalMaxPoints }`);
  console.log(`This means totalQuestions in the UI = ${totalMaxPoints}`);

  // Check if there's filtering happening
  console.log('\n📋 Checking for any special sections...');
  console.log('Sections:', Array.from(sectionStats.keys()));

  // Check if the number 110 could be from aggregation
  const uniqueSections = new Set(questions?.map(q => q.section_name));
  console.log(`\nUnique sections: ${uniqueSections.size}`);

  // Check General Ability - Quantitative specifically
  const gaQuant = questions?.filter(q => q.section_name === 'General Ability - Quantitative');
  console.log(`\nGeneral Ability - Quantitative: ${gaQuant?.length || 0} questions`);
  console.log(`Max points sum: ${gaQuant?.reduce((sum, q) => sum + (q.max_points || 1), 0) || 0}`);
}

debug110Count();
