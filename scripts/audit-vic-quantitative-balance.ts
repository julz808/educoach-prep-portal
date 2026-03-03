import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditSubSkillBalance() {
  console.log('🔍 VIC Selective Entry - General Ability Quantitative');
  console.log('📊 Sub-Skill Balance Audit\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('test_mode, sub_skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'General Ability - Quantitative')
    .order('test_mode');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!questions || questions.length === 0) {
    console.log('No questions found');
    return;
  }

  // Group by mode and sub-skill
  const modeStats: Record<string, Record<string, number>> = {};
  const allSubSkills = new Set<string>();

  questions.forEach(q => {
    if (!modeStats[q.test_mode]) {
      modeStats[q.test_mode] = {};
    }
    if (!modeStats[q.test_mode][q.sub_skill]) {
      modeStats[q.test_mode][q.sub_skill] = 0;
    }
    modeStats[q.test_mode][q.sub_skill]++;
    allSubSkills.add(q.sub_skill);
  });

  // Sort modes
  const modes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic', 'drill'];
  const orderedModes = modes.filter(m => modeStats[m]);

  // Sort sub-skills alphabetically
  const sortedSubSkills = Array.from(allSubSkills).sort();

  // Calculate totals per sub-skill
  const subSkillTotals: Record<string, number> = {};
  sortedSubSkills.forEach(skill => {
    subSkillTotals[skill] = 0;
    orderedModes.forEach(mode => {
      subSkillTotals[skill] += (modeStats[mode][skill] || 0);
    });
  });

  // Print table
  console.log('=' .repeat(120));
  console.log('SUB-SKILL DISTRIBUTION BY MODE');
  console.log('=' .repeat(120));
  console.log();

  // Header
  const colWidth = 30;
  const numWidth = 12;
  let header = 'Sub-Skill'.padEnd(colWidth);
  orderedModes.forEach(mode => {
    header += mode.padStart(numWidth);
  });
  header += 'TOTAL'.padStart(numWidth);
  console.log(header);
  console.log('-'.repeat(120));

  // Data rows
  sortedSubSkills.forEach(skill => {
    let row = skill.padEnd(colWidth);
    orderedModes.forEach(mode => {
      const count = modeStats[mode][skill] || 0;
      row += String(count).padStart(numWidth);
    });
    row += String(subSkillTotals[skill]).padStart(numWidth);
    console.log(row);
  });

  console.log('-'.repeat(120));

  // Totals row
  let totalsRow = 'TOTAL'.padEnd(colWidth);
  orderedModes.forEach(mode => {
    const total = Object.values(modeStats[mode]).reduce((sum, count) => sum + count, 0);
    totalsRow += String(total).padStart(numWidth);
  });
  const grandTotal = questions.length;
  totalsRow += String(grandTotal).padStart(numWidth);
  console.log(totalsRow);

  console.log();
  console.log('=' .repeat(120));
  console.log();

  // Analysis
  console.log('📊 BALANCE ANALYSIS\n');

  // Check each mode for balance
  orderedModes.forEach(mode => {
    const modeCounts = modeStats[mode];
    const counts = Object.entries(modeCounts).map(([skill, count]) => ({ skill, count }));
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    const min = Math.min(...counts.map(c => c.count));
    const max = Math.max(...counts.map(c => c.count));
    const avg = total / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c.count - avg, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    console.log(`${mode}:`);
    console.log(`  Total: ${total} questions`);
    console.log(`  Sub-skills represented: ${counts.length}/${sortedSubSkills.length}`);
    console.log(`  Range: ${min} - ${max} questions per sub-skill`);
    console.log(`  Average: ${avg.toFixed(1)} questions per sub-skill`);
    console.log(`  Std Dev: ${stdDev.toFixed(1)}`);

    // Find under-represented sub-skills
    const underRepresented = counts.filter(c => c.count < avg * 0.5);
    if (underRepresented.length > 0) {
      console.log(`  ⚠️  Under-represented (< 50% of avg):`);
      underRepresented.forEach(item => {
        console.log(`     - ${item.skill}: ${item.count} questions (avg: ${avg.toFixed(1)})`);
      });
    }

    // Find missing sub-skills
    const missingSkills = sortedSubSkills.filter(skill => !modeCounts[skill]);
    if (missingSkills.length > 0) {
      console.log(`  ❌ Missing sub-skills:`);
      missingSkills.forEach(skill => {
        console.log(`     - ${skill}`);
      });
    }

    // Balance score (lower is better)
    const balanceScore = stdDev / avg * 100;
    const balanceRating = balanceScore < 20 ? '✅ Excellent' :
                          balanceScore < 40 ? '✓ Good' :
                          balanceScore < 60 ? '⚠️  Fair' : '❌ Poor';
    console.log(`  Balance Score: ${balanceScore.toFixed(1)}% (${balanceRating})`);
    console.log();
  });

  console.log('=' .repeat(120));
  console.log();

  // Specific check for "Applied Worded Problems"
  console.log('🎯 APPLIED WORDED PROBLEMS ANALYSIS\n');

  const wordedProblemsSkill = sortedSubSkills.find(s =>
    s.toLowerCase().includes('worded') ||
    s.toLowerCase().includes('word problem')
  );

  if (wordedProblemsSkill) {
    console.log(`Found sub-skill: "${wordedProblemsSkill}"\n`);

    orderedModes.forEach(mode => {
      const count = modeStats[mode][wordedProblemsSkill] || 0;
      const total = Object.values(modeStats[mode]).reduce((sum, c) => sum + c, 0);
      const percentage = total > 0 ? (count / total * 100).toFixed(1) : '0.0';
      const status = count === 0 ? '❌' : count < 5 ? '⚠️ ' : '✅';
      console.log(`  ${status} ${mode}: ${count}/${total} questions (${percentage}%)`);
    });

    console.log();

    // Recommendations
    const diagnosticCount = modeStats['diagnostic']?.[wordedProblemsSkill] || 0;
    const diagnosticTotal = Object.values(modeStats['diagnostic'] || {}).reduce((sum, c) => sum + c, 0);
    const avgInPractice = orderedModes
      .filter(m => m.startsWith('practice_'))
      .map(m => modeStats[m][wordedProblemsSkill] || 0)
      .reduce((sum, c, _, arr) => sum + c / arr.length, 0);

    if (diagnosticCount < avgInPractice * 0.5) {
      console.log(`⚠️  RECOMMENDATION: Diagnostic mode has significantly fewer worded problems (${diagnosticCount}) compared to practice modes (avg: ${avgInPractice.toFixed(1)})`);
      console.log(`   Consider regenerating diagnostic mode with better balance.`);
    } else {
      console.log(`✅ Worded problems are reasonably balanced across modes.`);
    }
  } else {
    console.log('❌ No "Applied Worded Problems" sub-skill found.');
    console.log('   Available sub-skills:');
    sortedSubSkills.forEach(skill => console.log(`   - ${skill}`));
  }

  console.log();
  console.log('=' .repeat(120));
}

async function main() {
  try {
    await auditSubSkillBalance();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
