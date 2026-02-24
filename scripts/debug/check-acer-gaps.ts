import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Target distribution (from check-acer-target.ts)
const targetDistribution: { [subSkill: string]: number } = {
  'Main Idea & Theme Identification': 4,
  'Literal Comprehension': 5,
  'Vocabulary in Context': 5,
  'Inference & Interpretation': 6,
  'Analysis & Comparison': 6,
  'Sequencing & Text Organization': 4,
  'Poetry Analysis': 2,
  'Visual Interpretation': 3
};

async function checkGaps() {
  const modes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];

  console.log('\n📊 ACER Humanities - Gap Analysis by Sub-Skill');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const mode of modes) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('sub_skill')
      .eq('test_type', 'ACER Scholarship (Year 7 Entry)')
      .eq('section_name', 'Humanities')
      .eq('test_mode', mode);

    if (error) {
      console.error(`Error for ${mode}:`, error);
      continue;
    }

    const counts: Record<string, number> = {};
    data.forEach(q => {
      counts[q.sub_skill] = (counts[q.sub_skill] || 0) + 1;
    });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const targetTotal = Object.values(targetDistribution).reduce((sum, count) => sum + count, 0);
    const gap = targetTotal - total;

    console.log(`\n${mode}: ${total}/${targetTotal} ${gap > 0 ? `(need ${gap})` : '(complete)'}`);
    console.log('─'.repeat(70));

    Object.entries(targetDistribution).forEach(([skill, target]) => {
      const existing = counts[skill] || 0;
      const skillGap = target - existing;
      const status = skillGap > 0 ? '⚠️' : '✅';

      console.log(`  ${status} ${skill.padEnd(38)} ${existing}/${target} ${skillGap > 0 ? `(need ${skillGap})` : ''}`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

checkGaps();
