/**
 * Test script to verify duplicate detection learning works
 * Generates a single ACER Creative Writing prompt and shows how it handles duplicates
 */

import { generateQuestionV2 } from '../src/engines/questionGeneration/v2/generator';
import type { GenerationRequestV2 } from '../src/engines/questionGeneration/v2/types';

async function main() {
  console.log('🧪 Testing Duplicate Detection Learning\n');
  console.log('Generating ACER Creative Writing prompt...');
  console.log('This should show how the engine learns from failed attempts.\n');

  const request: GenerationRequestV2 = {
    testType: 'ACER Scholarship (Year 7 Entry)',
    section: 'Written Expression',
    subSkill: 'Creative & Imaginative Writing',
    difficulty: 2,
    testMode: 'practice_1'
  };

  const result = await generateQuestionV2(request, {
    skipStorage: true,  // Don't store, just test the generation
    crossModeDiversity: false
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Success: ${result.success}`);
  console.log(`Attempts: ${result.attempts}`);
  console.log(`Time: ${result.timeMs}ms`);
  console.log(`Cost: $${result.cost.toFixed(4)}`);

  if (result.success && result.question) {
    console.log('\n📝 Generated Prompt:');
    console.log(result.question.question_text.slice(0, 200) + '...');
  } else {
    console.log('\n❌ Generation Failed:');
    console.log(result.error);
  }
}

main().catch(console.error);
