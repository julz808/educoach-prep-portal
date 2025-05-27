/**
 * Demo: Practice Test Structure Preview
 * This script demonstrates the improved practice test generation logic
 * that uses exact question counts from curriculumData.ts
 */

import { previewPracticeTestStructure, generateFullPracticeTest } from './src/services/questionGenerationService.ts';
import { TEST_STRUCTURES } from './src/data/curriculumData.ts';

// Available test types
const testTypes = Object.keys(TEST_STRUCTURES);

console.log('🎯 **IMPROVED PRACTICE TEST GENERATION DEMO**\n');
console.log('Features:');
console.log('✅ Uses exact question counts from curriculumData.ts');
console.log('✅ Tests maximum number of sub-skills within question limits');
console.log('✅ Evenly distributes difficulties (1-3) across questions');
console.log('✅ Optimizes sub-skill coverage for comprehensive practice\n');

// Demo for each test type
for (const testType of testTypes) {
  console.log(`\n📋 **${testType}**`);
  console.log('='.repeat(50));
  
  try {
    const structure = previewPracticeTestStructure(testType);
    
    console.log(`📊 Total Questions: ${structure.totalQuestions}`);
    console.log(`⏱️ Estimated Time: ${structure.estimatedTimeMinutes} minutes\n`);
    
    structure.sections.forEach(section => {
      console.log(`📝 **${section.sectionName}**`);
      console.log(`   Target: ${section.targetQuestions} questions`);
      console.log(`   Sub-skills: ${section.availableSubSkills} available`);
      
      if (section.passageStructure) {
        console.log(`   Passages: ${section.passageStructure.passageCount} passages, ${section.passageStructure.questionsPerPassage} questions each`);
      }
      
      console.log('   Distribution:');
      section.questionDistribution.forEach(dist => {
        if (dist.questionsAllocated > 0) {
          console.log(`     • ${dist.subSkill}: ${dist.questionsAllocated} questions (${dist.difficultyMix})`);
        }
      });
      console.log('');
    });
    
  } catch (error) {
    console.error(`❌ Error with ${testType}:`, error);
  }
}

console.log('\n🚀 **HOW TO GENERATE A PRACTICE TEST**\n');
console.log('```typescript');
console.log('// Generate Practice Test 1 for ACER Scholarship');
console.log('const practiceTest = await generateFullPracticeTest(');
console.log('  "ACER Scholarship (Year 7 Entry)",');
console.log('  1  // Practice test number (1-5)');
console.log(');');
console.log('');
console.log('// The result will have:');
console.log('// - Exact question counts from curriculum data');
console.log('// - All available sub-skills tested within limits');
console.log('// - Even difficulty distribution (1-3)');
console.log('// - Reading passages with optimal question distribution');
console.log('// - Resume capability (skip completed sections)');
console.log('```');

console.log('\n💡 **KEY IMPROVEMENTS**\n');
console.log('1. **Exact Compliance**: Uses parseQuestionCount() to get exact targets from curriculumData.ts');
console.log('2. **Optimal Coverage**: Tests ALL sub-skills within question limits, not just a subset');
console.log('3. **Smart Distribution**: Evenly distributes questions + remainder across sub-skills');
console.log('4. **Difficulty Balance**: Uses distributeDifficulties() for 1-2-3-1-2-3 pattern');
console.log('5. **Adaptive Passages**: Reading sections adapt passage count to exact question targets');
console.log('6. **Resume Logic**: Skips sections that already have sufficient questions');

console.log('\n📈 **BEFORE vs AFTER COMPARISON**\n');
console.log('**BEFORE (Old Logic):**');
console.log('❌ Used hardcoded passage structures');
console.log('❌ Limited to 3-5 questions per sub-skill');
console.log('❌ Didn\'t use exact curriculum question counts');
console.log('❌ Inconsistent sub-skill coverage');

console.log('\n**AFTER (New Logic):**');
console.log('✅ Uses exact question counts from TEST_STRUCTURES');
console.log('✅ Tests ALL sub-skills optimally within limits');
console.log('✅ Perfect difficulty distribution (1-3 cycling)');
console.log('✅ Adaptive passage structures based on targets');
console.log('✅ Comprehensive sub-skill coverage for practice'); 