#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const practiceTests = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'];

async function generatePracticeTest(testMode) {
  const { generatePracticeTest } = await import('./src/engines/questionGeneration/batchGeneration.js');
  
  console.log(`\n🚀 GENERATING ${testMode.toUpperCase().replace('_', ' ')}`);
  console.log('='.repeat(50));
  
  try {
    const result = await generatePracticeTest({
      testType: 'EduTest Scholarship (Year 7 Entry)',
      testMode: testMode,
      generatePassages: true
    });
    
    console.log(`✅ ${testMode} Complete!`);
    console.log(`Questions: ${result.totalQuestions}`);
    console.log(`Time: ${result.metadata.duration}s`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Failed ${testMode}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🎯 EDUTEST YEAR 7 PRACTICE TEST GENERATOR');
  console.log('========================================');
  console.log('Test Type: EduTest Scholarship (Year 7 Entry)');
  console.log('Started:', new Date().toISOString());
  
  const startTime = Date.now();
  const results = [];
  
  for (const testMode of practiceTests) {
    try {
      const result = await generatePracticeTest(testMode);
      results.push(result);
    } catch (error) {
      console.error(`Stopping due to error in ${testMode}`);
      break;
    }
  }
  
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
  
  console.log('\n🎉 PRACTICE TEST GENERATION COMPLETE!');
  console.log('====================================');
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Total Time: ${totalTime}s (${Math.round(totalTime/60)}m)`);
  console.log(`Tests Generated: ${results.length}/${practiceTests.length}`);
}

main().catch(error => {
  console.error('Generation failed:', error);
  process.exit(1);
});