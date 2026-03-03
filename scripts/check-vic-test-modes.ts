/**
 * Check what test modes exist for VIC Selective
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkVICTestModes() {
  console.log('Checking VIC Selective test modes and question counts...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('test_mode, section_name, max_points')
    .eq('product_type', 'VIC Selective Entry (Year 9 Entry)');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Group by test_mode
  const modeStats = new Map<string, { count: number, totalMaxPoints: number, sections: Set<string> }>();

  questions?.forEach(q => {
    const mode = q.test_mode || 'Unknown';
    if (!modeStats.has(mode)) {
      modeStats.set(mode, { count: 0, totalMaxPoints: 0, sections: new Set() });
    }
    const stats = modeStats.get(mode)!;
    stats.count++;
    stats.totalMaxPoints += (q.max_points || 1);
    if (q.section_name) {
      stats.sections.add(q.section_name);
    }
  });

  console.log('Test mode breakdown:');
  console.log('='.repeat(80));

  Array.from(modeStats.entries()).sort().forEach(([mode, stats]) => {
    console.log(`\n${mode}:`);
    console.log(`  Question count: ${stats.count}`);
    console.log(`  Total max_points: ${stats.totalMaxPoints}`);
    console.log(`  Sections: ${Array.from(stats.sections).join(', ')}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\nTotal questions across all modes: ${questions?.length || 0}`);
}

checkVICTestModes();
