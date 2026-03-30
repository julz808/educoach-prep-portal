// This script simulates exactly what the frontend does to load practice tests
import { fetchQuestionsFromSupabase } from '../src/services/supabaseQuestionService';

async function testFrontendDataLoad() {
  console.log('🔍 Testing frontend data loading (simulating PracticeTests.tsx)...\n');
  console.log('Environment:');
  console.log('  VITE_USE_V2_QUESTIONS:', process.env.VITE_USE_V2_QUESTIONS);
  console.log('');

  // This is exactly what PracticeTests.tsx does
  const organizedData = await fetchQuestionsFromSupabase();

  console.log(`📊 Loaded ${organizedData.testTypes.length} test types\n`);

  // Find VIC Selective (same as frontend)
  const vicSelective = organizedData.testTypes.find(tt => tt.id === 'vic-selective');

  if (!vicSelective) {
    console.error('❌ VIC Selective not found!');
    return;
  }

  console.log(`📋 VIC Selective Entry (Year 9 Entry):`);
  console.log(`   Practice Test Modes: ${vicSelective.testModes.length}`);
  console.log('');

  // Check each practice test
  vicSelective.testModes.forEach((testMode, idx) => {
    console.log(`${idx + 1}. ${testMode.name} (${testMode.id}):`);
    console.log(`   Total Questions: ${testMode.totalQuestions}`);
    console.log(`   Sections: ${testMode.sections.length}`);

    testMode.sections.forEach(section => {
      console.log(`     - ${section.name}:`);
      console.log(`         questions array length: ${section.questions.length}`);
      console.log(`         totalQuestions property: ${section.totalQuestions}`);

      // This is what PracticeTests.tsx line 353 does:
      const questionCount = section.questions.length;
      console.log(`         ✅ Using: ${questionCount} (section.questions.length)`);
    });
    console.log('');
  });

  // Specifically check Practice Test 3
  const practice3 = vicSelective.testModes.find(tm => tm.id === 'practice_3');
  if (practice3) {
    console.log('\n🎯 Practice Test 3 DETAILED CHECK:');
    console.log(`   Total from testMode.totalQuestions: ${practice3.totalQuestions}`);

    let manualTotal = 0;
    practice3.sections.forEach(section => {
      manualTotal += section.questions.length;
      console.log(`   ${section.name}: ${section.questions.length} questions (array has ${section.questions.length} items)`);
    });
    console.log(`   Manual sum of section.questions.length: ${manualTotal}`);
    console.log(`   Expected: 222 questions`);
    console.log(`   Match: ${manualTotal === 222 ? '✅ YES' : '❌ NO (actual: ' + manualTotal + ')'}`);
  }
}

testFrontendDataLoad().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
