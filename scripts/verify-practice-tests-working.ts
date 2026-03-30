import { fetchQuestionsFromSupabase } from '../src/services/supabaseQuestionService';

async function verifyPracticeTests() {
  console.log('🔍 Verifying Practice Tests data loading...\n');
  console.log('Using V2:', process.env.VITE_USE_V2_QUESTIONS === 'true' ? 'YES' : 'NO');
  console.log('Table:', process.env.VITE_USE_V2_QUESTIONS === 'true' ? 'questions_v2' : 'questions');
  console.log('');

  const data = await fetchQuestionsFromSupabase();

  console.log(`📊 Found ${data.testTypes.length} test types\n`);

  data.testTypes.forEach(testType => {
    console.log(`\n📋 ${testType.name} (${testType.id}):`);
    console.log(`   Practice Test Modes: ${testType.testModes.length}`);

    testType.testModes.forEach((testMode, idx) => {
      console.log(`\n   ${idx + 1}. ${testMode.name} (${testMode.id}):`);
      console.log(`      Total Questions: ${testMode.totalQuestions}`);
      console.log(`      Sections: ${testMode.sections.length}`);

      testMode.sections.forEach(section => {
        console.log(`        - ${section.name}: ${section.questions.length} questions`);
      });
    });
  });

  // Specifically check Practice Test 3 for VIC Selective
  const vicSelective = data.testTypes.find(tt => tt.id === 'vic-selective');
  if (vicSelective) {
    const practiceTest3 = vicSelective.testModes.find(tm => tm.id === 'practice_3');
    if (practiceTest3) {
      console.log('\n✅ Practice Test 3 Verification:');
      console.log(`   Total Questions: ${practiceTest3.totalQuestions}`);
      console.log(`   Expected: 222 questions`);
      console.log(`   Match: ${practiceTest3.totalQuestions === 222 ? '✅ YES' : '❌ NO'}`);

      console.log('\n   Section Details:');
      practiceTest3.sections.forEach(section => {
        console.log(`     ${section.name}: ${section.questions.length} questions`);
      });
    }
  }
}

verifyPracticeTests().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
