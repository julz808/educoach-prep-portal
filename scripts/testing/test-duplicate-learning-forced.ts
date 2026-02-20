/**
 * Test script to verify duplicate detection learning works
 * Forces multiple duplicate scenarios to demonstrate learning
 */

import { generateQuestionV2 } from '../src/engines/questionGeneration/v2/generator';
import type { GenerationRequestV2 } from '../src/engines/questionGeneration/v2/types';

async function testWithRecentQuestions() {
  console.log('🧪 Testing Duplicate Detection Learning\n');
  console.log('Scenario: Testing with existing "discovering mysterious door" prompts');
  console.log('Expected: Should learn from duplicate failures and pivot\n');

  const request: GenerationRequestV2 = {
    testType: 'ACER Scholarship (Year 7 Entry)',
    section: 'Written Expression',
    subSkill: 'Creative & Imaginative Writing',
    difficulty: 2,
    testMode: 'test_run'  // Use a different mode to isolate
  };

  // Run generation - it will load existing questions and should avoid them
  const result = await generateQuestionV2(request, {
    skipStorage: true,
    crossModeDiversity: true  // Load from all modes to increase duplicate likelihood
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Success: ${result.success}`);
  console.log(`Attempts: ${result.attempts}/${3} (should learn and improve each attempt)`);
  console.log(`Time: ${result.timeMs}ms`);
  console.log(`Cost: $${result.cost.toFixed(4)}`);

  if (result.success && result.question) {
    console.log('\n✅ Generation succeeded!');
    console.log('\n📝 Final Generated Prompt:');
    console.log(result.question.question_text.slice(0, 300) + '...');
    console.log('\nQuality Score:', result.question.quality_score);
  } else {
    console.log('\n❌ Generation Failed after all attempts:');
    console.log(result.error);
    console.log('\n💡 If this shows "Duplicate detected" 3 times, the learning mechanism may need further refinement.');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run multiple generations to stress test
async function main() {
  console.log('🎯 DUPLICATE LEARNING TEST - Generating 3 writing prompts in sequence\n');
  console.log('Each generation loads all previous ones, forcing higher duplicate risk.');
  console.log('The engine should learn from failures and successfully pivot.\n');

  for (let i = 1; i <= 3; i++) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST RUN ${i}/3`);
    console.log('='.repeat(80));
    await testWithRecentQuestions();

    if (i < 3) {
      console.log('Waiting 2 seconds before next generation...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n🎉 Test Complete!\n');
  console.log('Summary:');
  console.log('- If all 3 generations succeeded, the duplicate learning is working!');
  console.log('- If any failed with "Duplicate detected" after 3 attempts, check the console');
  console.log('  to see if the prompt showed "PREVIOUS ATTEMPTS THAT FAILED" section.');
}

main().catch(console.error);
