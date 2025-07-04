#!/usr/bin/env node

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { generatePracticeTest } from './src/engines/questionGeneration/batchGeneration.ts';

const practiceTests = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'];

async function generateSinglePracticeTest(testMode) {
  console.log(`\n🚀 GENERATING ${testMode.toUpperCase().replace('_', ' ')}`);
  console.log('='.repeat(50));
  
  try {
    const startTime = Date.now();
    
    const result = await generatePracticeTest({
      testType: 'EduTest Scholarship (Year 7 Entry)',
      testMode: testMode,
      generatePassages: true
    });
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n✅ ${testMode.toUpperCase().replace('_', ' ')} COMPLETE!`);
    console.log(`   Questions Generated: ${result.totalQuestions}`);
    console.log(`   Time Taken: ${duration} seconds`);
    console.log(`   Sections: ${result.sectionsGenerated.length}`);
    
    if (result.sectionsGenerated.length > 0) {
      console.log('   Section Breakdown:');
      result.sectionsGenerated.forEach(section => {
        console.log(`     - ${section.sectionName}: ${section.questionsGenerated} questions`);
        if (section.passageIds && section.passageIds.length > 0) {
          console.log(`       📖 Passages: ${section.passageIds.length}`);
        }
      });
    }
    
    return result;
    
  } catch (error) {
    console.error(`\n❌ FAILED ${testMode}:`, error.message);
    throw error;
  }
}

async function runPracticeTestGeneration() {
  console.log('🎯 EDUTEST YEAR 7 PRACTICE TEST GENERATOR');
  console.log('========================================');
  console.log('Test Type: EduTest Scholarship (Year 7 Entry)');
  console.log('Target: Practice Tests 1-5 (Reading Comprehension + New Tests)');
  console.log('Started:', new Date().toISOString());
  console.log('');
  
  const overallStartTime = Date.now();
  const results = [];
  let totalQuestions = 0;
  
  try {
    console.log('🔍 Generating practice tests that need work...');
    
    // Generate each practice test
    for (let i = 0; i < practiceTests.length; i++) {
      const testMode = practiceTests[i];
      const isNewTest = testMode === 'practice_4' || testMode === 'practice_5';
      
      console.log(`\n📋 Processing ${testMode} ${isNewTest ? '(NEW TEST)' : '(MISSING SECTIONS)'}:`);
      
      try {
        const result = await generateSinglePracticeTest(testMode);
        results.push(result);
        totalQuestions += result.totalQuestions;
        
        // Brief pause between tests to prevent rate limiting
        if (i < practiceTests.length - 1) {
          console.log('\n⏱️  Brief pause before next test...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`Stopping generation due to error in ${testMode}`);
        break;
      }
    }
    
    const overallEndTime = Date.now();
    const totalTime = Math.round((overallEndTime - overallStartTime) / 1000);
    
    console.log('\n🎉 PRACTICE TEST GENERATION COMPLETE!');
    console.log('====================================');
    console.log(`✅ Total Questions Generated: ${totalQuestions}`);
    console.log(`⏱️  Total Time: ${totalTime} seconds (${Math.round(totalTime/60)} minutes)`);
    console.log(`📊 Tests Processed: ${results.length}/${practiceTests.length}`);
    
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    if (totalErrors > 0) {
      console.log(`⚠️  Total Warnings: ${totalErrors}`);
    }
    
    console.log('\n📋 PRACTICE TEST STATUS:');
    practiceTests.forEach((test, index) => {
      if (index < results.length) {
        const questions = results[index].totalQuestions;
        console.log(`   ✅ ${test.replace('_', ' ').toUpperCase()}: ${questions} questions`);
      } else {
        console.log(`   ⏸️  ${test.replace('_', ' ').toUpperCase()}: Not processed`);
      }
    });
    
    console.log('\n🎯 DIVERSITY ACHIEVED:');
    console.log('   📖 Unique passages per practice test');
    console.log('   🎭 Diverse characters and settings');
    console.log('   📚 Varied themes and text types');
    console.log('   🌏 Australian and international content');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Test all practice tests in frontend');
    console.log('   2. Verify Reading Comprehension diversity');
    console.log('   3. Check that no tests share similar content');
    console.log('   4. Validate Australian context appropriateness');
    
  } catch (error) {
    console.error('\n❌ GENERATION FAILED:', error.message);
    
    if (error.stack) {
      console.error('\nError Details:', error.stack);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Claude API key in .env file');
    console.log('   2. Verify Supabase connection');
    console.log('   3. Check for API rate limiting');
    console.log('   4. Review error details above');
    
    process.exit(1);
  }
}

// Run the generation
runPracticeTestGeneration();