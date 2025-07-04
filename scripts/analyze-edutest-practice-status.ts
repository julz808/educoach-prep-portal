#!/usr/bin/env tsx

// ============================================================================
// EDUTEST PRACTICE TEST STATUS ANALYZER
// ============================================================================
// Analyzes current practice test status (no API calls needed)

import { 
  getExistingQuestionCounts,
  printTestCompletionReport
} from '../src/engines/questionGeneration/supabaseStorage.ts';
import { 
  TEST_STRUCTURES 
} from '../src/data/curriculumData.ts';

const TEST_TYPE = 'EduTest Scholarship (Year 7 Entry)';

/**
 * Comprehensive practice test analysis
 */
async function analyzePracticeTests() {
  console.log('🔍 EDUTEST YEAR 7 PRACTICE TEST ANALYSIS');
  console.log('=' .repeat(60));
  console.log(`📚 Test: ${TEST_TYPE}`);
  console.log(`📅 Analysis Date: ${new Date().toISOString()}\n`);
  
  const practiceTests = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'];
  const testStructure = TEST_STRUCTURES[TEST_TYPE];
  const sections = Object.keys(testStructure);
  
  let overallMissing = 0;
  const testsNeedingWork = [];
  
  for (const testMode of practiceTests) {
    console.log(`\n📋 ${testMode.toUpperCase().replace('_', ' ')}:`);
    console.log('-' .repeat(40));
    
    try {
      const existingCounts = await getExistingQuestionCounts(TEST_TYPE, testMode);
      let testMissing = 0;
      const sectionsStatus = [];
      
      for (const sectionName of sections) {
        const sectionData = testStructure[sectionName as keyof typeof testStructure];
        const expectedQuestions = (sectionData as any).questions;
        const actualQuestions = existingCounts.sectionCounts[sectionName]?.total || 0;
        const missing = Math.max(0, expectedQuestions - actualQuestions);
        
        testMissing += missing;
        
        const status = missing === 0 ? '✅' : '⚠️ ';
        console.log(`   ${status} ${sectionName}: ${actualQuestions}/${expectedQuestions}`);
        
        if (missing > 0) {
          console.log(`      🔄 Missing: ${missing} questions`);
          if (sectionName === 'Reading Comprehension') {
            console.log(`      📖 Note: This section was deleted for diversity improvement`);
          }
        }
        
        sectionsStatus.push({
          sectionName,
          expected: expectedQuestions,
          actual: actualQuestions,
          missing,
          complete: missing === 0
        });
      }
      
      if (testMissing === 0) {
        console.log(`   🎉 ${testMode.replace('_', ' ').toUpperCase()} is COMPLETE!`);
      } else {
        console.log(`   📊 Total missing: ${testMissing} questions`);
        overallMissing += testMissing;
        testsNeedingWork.push({
          testMode,
          totalMissing: testMissing,
          sectionsStatus
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error analyzing ${testMode}:`, error);
    }
  }
  
  return {
    overallMissing,
    testsNeedingWork,
    totalTests: practiceTests.length,
    completeTests: practiceTests.length - testsNeedingWork.length
  };
}

/**
 * Generate detailed generation plan
 */
function generatePlan(analysis: any) {
  console.log(`\n📊 GENERATION PLAN`);
  console.log('=' .repeat(40));
  
  if (analysis.overallMissing === 0) {
    console.log('🎉 All practice tests are complete!');
    console.log('No generation needed.');
    return;
  }
  
  console.log(`📈 Overall Status:`);
  console.log(`   Complete tests: ${analysis.completeTests}/${analysis.totalTests}`);
  console.log(`   Tests needing work: ${analysis.testsNeedingWork.length}`);
  console.log(`   Total missing questions: ${analysis.overallMissing}`);
  
  console.log(`\n🎯 Generation Targets:`);
  
  analysis.testsNeedingWork.forEach((test: any) => {
    const isNewTest = test.testMode === 'practice_4' || test.testMode === 'practice_5';
    console.log(`\n   📋 ${test.testMode.replace('_', ' ').toUpperCase()} ${isNewTest ? '(NEW)' : '(GAPS)'}:`);
    console.log(`      Total needed: ${test.totalMissing} questions`);
    
    test.sectionsStatus.forEach((section: any) => {
      if (section.missing > 0) {
        console.log(`      - ${section.sectionName}: ${section.missing} questions`);
        
        if (section.sectionName === 'Reading Comprehension') {
          console.log(`        📖 Will generate 5 diverse passages + ${section.missing} questions`);
          console.log(`        🎭 Focus: Unique themes, characters, settings per test`);
        } else if (section.sectionName === 'Written Expression') {
          console.log(`        ✍️  Will generate diverse writing prompts`);
        }
      }
    });
  });
  
  console.log(`\n⏱️  Estimated Time: ${Math.ceil(analysis.overallMissing / 15)} minutes`);
  console.log(`💰 Estimated Cost: $${(analysis.overallMissing * 0.05).toFixed(2)} (approximate)`);
  
  console.log(`\n🎯 Diversity Goals:`);
  console.log(`   📖 Each practice test will have completely unique passages`);
  console.log(`   🎭 Different characters, themes, settings across all tests`);
  console.log(`   📚 Varied text types (narrative, informational, persuasive)`);
  console.log(`   🌏 Balanced Australian and international contexts`);
  console.log(`   📈 Appropriate difficulty progression`);
}

/**
 * Show detailed section breakdown
 */
async function detailedSectionBreakdown() {
  console.log(`\n📋 SECTION-BY-SECTION ANALYSIS`);
  console.log('=' .repeat(50));
  
  const practiceTests = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'];
  const testStructure = TEST_STRUCTURES[TEST_TYPE];
  const sections = Object.keys(testStructure);
  
  for (const sectionName of sections) {
    console.log(`\n📚 ${sectionName.toUpperCase()}:`);
    console.log('-' .repeat(30));
    
    const sectionData = testStructure[sectionName as keyof typeof testStructure];
    const expectedPerTest = (sectionData as any).questions;
    
    console.log(`   Expected per test: ${expectedPerTest} questions`);
    
    if (sectionName === 'Reading Comprehension') {
      console.log(`   Passages per test: ${(sectionData as any).passages}`);
      console.log(`   Words per passage: ${(sectionData as any).words_per_passage}`);
    }
    
    let totalActual = 0;
    let completeTests = 0;
    
    for (const testMode of practiceTests) {
      try {
        const counts = await getExistingQuestionCounts(TEST_TYPE, testMode);
        const actual = counts.sectionCounts[sectionName]?.total || 0;
        totalActual += actual;
        
        if (actual >= expectedPerTest) {
          completeTests++;
        }
        
        const status = actual >= expectedPerTest ? '✅' : '⚠️ ';
        console.log(`   ${status} ${testMode.replace('_', ' ')}: ${actual}/${expectedPerTest}`);
      } catch (error) {
        console.log(`   ❌ ${testMode.replace('_', ' ')}: Error checking`);
      }
    }
    
    console.log(`   📊 Summary: ${completeTests}/5 tests complete, ${totalActual} total questions`);
    
    if (sectionName === 'Reading Comprehension' && completeTests < 5) {
      console.log(`   🔄 Note: Section was deleted for diversity - will regenerate with unique content`);
    }
  }
}

/**
 * Main analysis function
 */
async function main() {
  console.log('📊 EDUTEST PRACTICE TEST STATUS ANALYZER');
  console.log('=' .repeat(60));
  
  try {
    // Overall analysis
    const analysis = await analyzePracticeTests();
    
    // Generation plan
    generatePlan(analysis);
    
    // Detailed breakdown
    await detailedSectionBreakdown();
    
    console.log(`\n🚀 NEXT STEPS:`);
    console.log('=' .repeat(30));
    
    if (analysis.overallMissing > 0) {
      console.log(`1. Set Claude API key: export CLAUDE_API_KEY="your-key"`);
      console.log(`2. Run generation: npm run generate:edutest-practice`);
      console.log(`3. Monitor progress in terminal`);
      console.log(`4. Verify diversity in admin interface`);
      console.log(`5. Test practice tests in frontend`);
    } else {
      console.log(`🎉 All practice tests complete!`);
      console.log(`1. Test all practice tests in frontend`);
      console.log(`2. Verify passage diversity`);
      console.log(`3. Check user experience`);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});