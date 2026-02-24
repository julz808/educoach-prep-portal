import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVisualStats() {
  console.log('\n📊 Visual Questions Statistics\n');

  // Get total visual questions
  const { count: totalVisual } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('has_visual', true);

  console.log(`Total questions with visuals: ${totalVisual}\n`);

  // Get breakdown by test type
  const { data: questions } = await supabase
    .from('questions_v2')
    .select('test_type, has_visual')
    .eq('has_visual', true);

  const breakdown: Record<string, number> = {};
  questions?.forEach(q => {
    breakdown[q.test_type] = (breakdown[q.test_type] || 0) + 1;
  });

  console.log('Breakdown by test type:');
  console.log('═══════════════════════════════════════\n');
  Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([testType, count]) => {
      console.log(`${testType.padEnd(30)} ${count}`);
    });

  // Check NAPLAN specifically
  console.log('\n\n🔍 NAPLAN Specific Analysis:\n');

  const { data: naplanQuestions } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, has_visual, test_mode')
    .like('test_type', '%NAPLAN%');

  const naplanWithVisuals = naplanQuestions?.filter(q => q.has_visual);
  const naplanTotal = naplanQuestions?.length || 0;

  console.log(`Total NAPLAN questions: ${naplanTotal}`);
  console.log(`NAPLAN questions with visuals: ${naplanWithVisuals?.length || 0}`);
  console.log(`Percentage: ${naplanTotal > 0 ? ((naplanWithVisuals?.length || 0) / naplanTotal * 100).toFixed(1) : 0}%\n`);

  if (naplanWithVisuals && naplanWithVisuals.length > 0) {
    console.log('NAPLAN visuals by section:');
    const naplanBreakdown: Record<string, number> = {};
    naplanWithVisuals.forEach(q => {
      const key = `${q.test_type} - ${q.section_name}`;
      naplanBreakdown[key] = (naplanBreakdown[key] || 0) + 1;
    });
    Object.entries(naplanBreakdown).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });
  } else {
    console.log('⚠️  No NAPLAN questions with visuals found in the database.');
  }

  console.log('\n');
}

checkVisualStats().catch(console.error);
