/**
 * Test VIC Reading generation for duplicates
 * Generate 10 questions and check if any are identical
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { generateSectionV2 } from '@/engines/questionGeneration/v2';

async function testVICReading() {
  console.log('\n🧪 Testing VIC Reading duplicate detection...\n');

  try {
    const result = await generateSectionV2({
      testType: 'VIC Selective Entry (Year 9 Entry)',
      sectionName: 'Reading Reasoning',
      testMode: 'practice_1',
      difficultyStrategy: { type: 'balanced', difficulties: [1, 2, 3] },
      skipStorage: false,  // Store to DB
      crossModeDiversity: false
    });

    if (result.success) {
      console.log('\n✅ Generation complete!');
      console.log(`   Generated: ${result.metadata.total_questions_generated} questions`);
      console.log(`   Passages: ${result.metadata.total_passages || 0}`);
      console.log(`   Cost: $${result.metadata.total_cost.toFixed(4)}`);

      if (result.metadata.totalFailed > 0) {
        console.log(`   ⚠️  Failures: ${result.metadata.totalFailed}`);
      }
    } else {
      console.error('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

testVICReading()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
