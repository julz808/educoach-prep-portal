/**
 * Check if VIC questions exist in the old questions table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkVICInV1Table() {
  console.log('Checking VIC Selective in old questions table...\n');

  // Check questions_v2
  const { count: v2Count } = await supabase
    .from('questions_v2')
    .select('id', { count: 'exact', head: true })
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)');

  console.log(`questions_v2 count: ${v2Count || 0}`);

  // Check old questions table
  const { count: v1Count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)');

  console.log(`questions (v1) count: ${v1Count || 0}`);

  if (v1Count && v1Count > 0) {
    console.log('\n✅ VIC questions found in OLD table (questions)!');

    // Get test mode breakdown
    const { data: questions } = await supabase
      .from('questions')
      .select('test_mode, section_name, max_points')
      .eq('product_type', 'VIC Selective Entry (Year 9 Entry)');

    const modeStats = new Map<string, { count: number, totalMaxPoints: number }>();

    questions?.forEach(q => {
      const mode = q.test_mode || 'Unknown';
      if (!modeStats.has(mode)) {
        modeStats.set(mode, { count: 0, totalMaxPoints: 0 });
      }
      const stats = modeStats.get(mode)!;
      stats.count++;
      stats.totalMaxPoints += (q.max_points || 1);
    });

    console.log('\nTest mode breakdown:');
    console.log('='.repeat(80));
    Array.from(modeStats.entries()).sort().forEach(([mode, stats]) => {
      console.log(`${mode}: ${stats.count} questions, ${stats.totalMaxPoints} max_points`);
    });

    // Check specifically for General Ability - Quantitative
    const { data: gaQuant } = await supabase
      .from('questions')
      .select('test_mode, max_points')
      .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
      .eq('section_name', 'General Ability - Quantitative')
      .limit(10);

    console.log('\nGeneral Ability - Quantitative sample:');
    gaQuant?.forEach((q, i) => {
      console.log(`  Question ${i + 1}: test_mode=${q.test_mode}, max_points=${q.max_points}`);
    });

  } else {
    console.log('\n❌ No VIC questions found in either table!');
  }

  // Check if the app is configured to use v2
  console.log(`\n📋 App configuration:`);
  console.log(`VITE_USE_V2_QUESTIONS = ${process.env.VITE_USE_V2_QUESTIONS || 'not set'}`);
}

checkVICInV1Table();
