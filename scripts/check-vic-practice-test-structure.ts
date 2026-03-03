/**
 * Check VIC Selective Practice Test 1 structure to understand the 110 question count issue
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkPracticeTestStructure() {
  console.log('Checking VIC Selective Practice Test 1 structure...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, section_name, max_points, sub_skill')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_1');

  if (error) {
    console.error('Error:', error);
    return;
  }

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

  console.log('Section breakdown:');
  console.log('='.repeat(80));
  let totalQuestions = 0;
  let totalMaxPoints = 0;

  Array.from(sectionStats.entries()).sort().forEach(([section, stats]) => {
    console.log(`${section}:`);
    console.log(`  Question count: ${stats.count}`);
    console.log(`  Total max_points: ${stats.totalMaxPoints}`);
    console.log();
    totalQuestions += stats.count;
    totalMaxPoints += stats.totalMaxPoints;
  });

  console.log('='.repeat(80));
  console.log(`TOTAL QUESTIONS: ${totalQuestions}`);
  console.log(`TOTAL MAX_POINTS: ${totalMaxPoints}`);
  console.log();
  console.log('🔍 ISSUE IDENTIFIED:');
  console.log(`The insights page is using ${totalMaxPoints} (total max_points) instead of ${totalQuestions} (actual question count)`);
  console.log();
  console.log('This happens in analyticsService.ts line 834:');
  console.log('  totalQuestions: totalMaxPoints,  // ❌ WRONG - should use question count');
}

checkPracticeTestStructure();
