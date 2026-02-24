import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface PassageRatio {
  testType: string;
  section: string;
  passageId: string;
  questionCount: number;
  modes: string[];
}

(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' PASSAGE-TO-QUESTION RATIO ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Get all questions with passages
  const { data: questions } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, passage_id, test_mode')
    .not('passage_id', 'is', null);

  if (!questions || questions.length === 0) {
    console.log('❌ No questions with passages found\n');
    return;
  }

  // Filter for practice tests and diagnostic only (test_mode contains these values)
  const filteredQuestions = questions.filter(q =>
    q.test_mode.includes('practice_') || q.test_mode === 'diagnostic'
  );

  console.log(`📊 Found ${filteredQuestions.length} questions with passages (practice tests & diagnostic only)\n`);

  // Group by test type, section, and passage
  const passageMap = new Map<string, PassageRatio>();

  filteredQuestions.forEach(q => {
    const key = `${q.test_type}|${q.section_name}|${q.passage_id}`;

    if (!passageMap.has(key)) {
      passageMap.set(key, {
        testType: q.test_type,
        section: q.section_name,
        passageId: q.passage_id,
        questionCount: 0,
        modes: []
      });
    }

    const ratio = passageMap.get(key)!;
    ratio.questionCount++;

    if (!ratio.modes.includes(q.test_mode)) {
      ratio.modes.push(q.test_mode);
    }
  });

  // Group by test and section
  const byTestSection = new Map<string, PassageRatio[]>();

  passageMap.forEach(ratio => {
    const key = `${ratio.testType}|${ratio.section}`;
    if (!byTestSection.has(key)) {
      byTestSection.set(key, []);
    }
    byTestSection.get(key)!.push(ratio);
  });

  // Expected questions per passage (based on typical test structures)
  const EXPECTED_QUESTIONS_PER_PASSAGE: Record<string, number> = {
    'ACER Scholarship (Year 7 Entry)|Humanities': 5,
    'EduTest Scholarship (Year 7 Entry)|Reading Comprehension': 7,
    'NSW Selective Entry (Year 7 Entry)|Reading': 5,
    'VIC Selective Entry (Year 9 Entry)|Reading Reasoning': 5,
    'Year 5 NAPLAN|Reading': 5,
    'Year 7 NAPLAN|Reading': 5
  };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PASSAGE USAGE BY TEST & SECTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sortedSections = Array.from(byTestSection.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [key, ratios] of sortedSections) {
    const [testType, section] = key.split('|');
    const expected = EXPECTED_QUESTIONS_PER_PASSAGE[key] || 5;

    console.log(`📝 ${testType} - ${section}`);
    console.log(`   Expected questions per passage: ${expected}`);
    console.log(`   Total passages used: ${ratios.length}`);

    // Calculate statistics
    const questionCounts = ratios.map(r => r.questionCount);
    const totalQuestions = questionCounts.reduce((sum, c) => sum + c, 0);
    const avgQuestions = totalQuestions / ratios.length;
    const minQuestions = Math.min(...questionCounts);
    const maxQuestions = Math.max(...questionCounts);

    console.log(`   Total questions: ${totalQuestions}`);
    console.log(`   Avg questions per passage: ${avgQuestions.toFixed(1)}`);
    console.log(`   Range: ${minQuestions} - ${maxQuestions} questions per passage`);

    // Check for anomalies
    const underUsed = ratios.filter(r => r.questionCount < expected);
    const overUsed = ratios.filter(r => r.questionCount > expected);

    if (underUsed.length > 0) {
      console.log(`   ⚠️  ${underUsed.length} passages under-used (< ${expected} questions)`);
    }

    if (overUsed.length > 0) {
      console.log(`   ⚠️  ${overUsed.length} passages over-used (> ${expected} questions)`);
    }

    if (underUsed.length === 0 && overUsed.length === 0) {
      console.log(`   ✅ All passages have expected question count`);
    }

    // Show distribution
    const distribution: Record<number, number> = {};
    questionCounts.forEach(count => {
      distribution[count] = (distribution[count] || 0) + 1;
    });

    console.log(`   Distribution:`);
    Object.entries(distribution)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .forEach(([count, passages]) => {
        console.log(`      ${count} questions: ${passages} passages`);
      });

    console.log();
  }

  // Check for passages that appear in multiple modes
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PASSAGE REUSE ACROSS MODES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const multiModePassages = Array.from(passageMap.values()).filter(r => r.modes.length > 1);

  if (multiModePassages.length === 0) {
    console.log('✅ No passages are reused across multiple modes (good!)\n');
  } else {
    console.log(`⚠️  Found ${multiModePassages.length} passages used in multiple modes:\n`);

    multiModePassages.slice(0, 10).forEach(r => {
      console.log(`   ${r.testType} - ${r.section}`);
      console.log(`   Passage: ${r.passageId}`);
      console.log(`   Used in: ${r.modes.join(', ')}`);
      console.log(`   Total questions: ${r.questionCount}`);
      console.log();
    });
  }

  console.log('═══════════════════════════════════════════════════════════════════\n');
})();
