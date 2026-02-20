import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' V2 QUESTION GENERATION - COMPREHENSIVE AUDIT');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Get all data
  const { data: allQuestions, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode, sub_skill, response_type');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const total = allQuestions?.length || 0;
  console.log(`📊 Total Questions: ${total}\n`);

  // Group by test type
  const byTestType: Record<string, any[]> = {};
  if (allQuestions) {
    allQuestions.forEach(q => {
      if (!byTestType[q.test_type]) byTestType[q.test_type] = [];
      byTestType[q.test_type].push(q);
    });
  }

  // Analyze each test type
  for (const [testType, questions] of Object.entries(byTestType)) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📝 ${testType}`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`   Total: ${questions.length} questions\n`);

    // Group by section
    const bySection: Record<string, any[]> = {};
    questions.forEach(q => {
      if (!bySection[q.section_name]) bySection[q.section_name] = [];
      bySection[q.section_name].push(q);
    });

    for (const [section, secQuestions] of Object.entries(bySection)) {
      console.log(`   📂 ${section}: ${secQuestions.length} questions`);

      // By mode
      const byMode: Record<string, number> = {};
      secQuestions.forEach(q => {
        byMode[q.test_mode] = (byMode[q.test_mode] || 0) + 1;
      });

      for (const [mode, count] of Object.entries(byMode)) {
        console.log(`      ${mode}: ${count}`);
      }

      // By sub-skill (top 5)
      const bySubSkill: Record<string, number> = {};
      secQuestions.forEach(q => {
        bySubSkill[q.sub_skill] = (bySubSkill[q.sub_skill] || 0) + 1;
      });

      const topSubSkills = Object.entries(bySubSkill)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (topSubSkills.length > 0) {
        console.log(`      Top sub-skills:`);
        topSubSkills.forEach(([skill, count]) => {
          console.log(`        - ${skill}: ${count}`);
        });
      }

      // Check for writing questions
      const writingQuestions = secQuestions.filter(q => q.response_type === 'extended_response');
      if (writingQuestions.length > 0) {
        console.log(`      ✅ Extended Response: ${writingQuestions.length}`);
      }

      console.log();
    }
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(' MISSING TEST TYPES');
  console.log(`${'═'.repeat(70)}\n`);

  const expectedTests = [
    'ACER Scholarship (Year 7 Entry)',
    'EduTest Scholarship (Year 7 Entry)',
    'NSW Selective Entry (Year 7 Entry)',
    'VIC Selective Entry (Year 9 Entry)',
    'Year 5 NAPLAN',
    'Year 7 NAPLAN'
  ];

  const presentTests = Object.keys(byTestType);
  const missingTests = expectedTests.filter(t => !presentTests.includes(t));

  if (missingTests.length > 0) {
    console.log('❌ Missing test types:');
    missingTests.forEach(t => console.log(`   - ${t}`));
  } else {
    console.log('✅ All expected test types present');
  }

  console.log(`\n${'═'.repeat(70)}\n`);
})();
