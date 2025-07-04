#!/usr/bin/env tsx

// ============================================================================
// EDUTEST YEAR 7 DRILL GENERATION SCRIPT
// ============================================================================
// Generates all missing drill questions for EduTest Scholarship (Year 7 Entry)
// Uses the unified generation engine with proper section-specific logic

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { generatePracticeTest } from '../src/engines/questionGeneration/batchGeneration.ts';
import { 
  getExistingQuestionCounts,
  printTestCompletionReport,
  analyzeTestGaps
} from '../src/engines/questionGeneration/supabaseStorage.ts';
import { 
  TEST_STRUCTURES, 
  SECTION_TO_SUB_SKILLS 
} from '../src/data/curriculumData.ts';
import { 
  getDrillQuestionsPerSubSkill,
  isWritingSection 
} from '../src/engines/questionGeneration/sectionUtils.ts';

const TEST_TYPE = 'EduTest Scholarship (Year 7 Entry)';
const TEST_MODE = 'drill';

/**
 * Analyzes current drill status for EduTest Year 7
 */
async function analyzeCurrentDrillStatus() {
  console.log('🔍 ANALYZING EDUTEST YEAR 7 DRILL STATUS');
  console.log('=' .repeat(60));
  
  const testStructure = TEST_STRUCTURES[TEST_TYPE];
  if (!testStructure) {
    throw new Error(`Test structure not found for ${TEST_TYPE}`);
  }
  
  const existingCounts = await getExistingQuestionCounts(TEST_TYPE, TEST_MODE);
  console.log(`\n📊 Current Drill Question Counts:`);
  
  const sections = Object.keys(testStructure);
  const missingInfo: Array<{
    sectionName: string;
    missingQuestions: number;
    subSkillGaps: Array<{ subSkill: string; expected: number; actual: number; missing: number }>;
  }> = [];
  
  for (const sectionName of sections) {
    const sectionCount = existingCounts.sectionCounts[sectionName];
    const compoundKey = `${TEST_TYPE} - ${sectionName}` as keyof typeof SECTION_TO_SUB_SKILLS;
    const subSkills = SECTION_TO_SUB_SKILLS[compoundKey] || 
                     SECTION_TO_SUB_SKILLS[sectionName as keyof typeof SECTION_TO_SUB_SKILLS] || [];
    
    const questionsPerSubSkill = getDrillQuestionsPerSubSkill(sectionName);
    const expectedTotal = subSkills.length * questionsPerSubSkill;
    const actualTotal = sectionCount?.total || 0;
    const missing = Math.max(0, expectedTotal - actualTotal);
    
    console.log(`\n📋 ${sectionName}:`);
    console.log(`   Expected: ${expectedTotal} questions (${subSkills.length} sub-skills × ${questionsPerSubSkill})`);
    console.log(`   Current:  ${actualTotal} questions`);
    console.log(`   Missing:  ${missing} questions`);
    
    if (missing > 0) {
      const subSkillGaps = [];
      
      for (const subSkill of subSkills) {
        const actualSubSkillCount = sectionCount?.subSkillCounts[subSkill] || 0;
        const expectedSubSkillCount = questionsPerSubSkill;
        const missingSubSkillCount = Math.max(0, expectedSubSkillCount - actualSubSkillCount);
        
        if (missingSubSkillCount > 0) {
          subSkillGaps.push({
            subSkill,
            expected: expectedSubSkillCount,
            actual: actualSubSkillCount,
            missing: missingSubSkillCount
          });
          
          console.log(`      ⚠️  ${subSkill}: ${actualSubSkillCount}/${expectedSubSkillCount} (${missingSubSkillCount} missing)`);
        } else {
          console.log(`      ✅ ${subSkill}: ${actualSubSkillCount}/${expectedSubSkillCount} (complete)`);
        }
      }
      
      missingInfo.push({
        sectionName,
        missingQuestions: missing,
        subSkillGaps
      });
    } else {
      console.log(`   ✅ Section complete!`);
    }
  }
  
  return {
    totalMissing: missingInfo.reduce((sum, section) => sum + section.missingQuestions, 0),
    sectionsNeedingWork: missingInfo
  };
}

/**
 * Generates missing drill questions for a specific section
 */
async function generateSectionDrills(sectionName: string) {
  console.log(`\n🚀 GENERATING DRILL QUESTIONS FOR ${sectionName.toUpperCase()}`);
  console.log('=' .repeat(50));
  
  try {
    const result = await generatePracticeTest({
      testType: TEST_TYPE,
      testMode: TEST_MODE,
      generatePassages: true
    });
    
    console.log(`\n✅ ${sectionName} Generation Complete:`);
    console.log(`   Questions Generated: ${result.totalQuestions}`);
    console.log(`   Time Taken: ${result.metadata.duration} seconds`);
    
    if (result.errors.length > 0) {
      console.warn(`\n⚠️  Warnings/Errors for ${sectionName}:`);
      result.errors.forEach(error => console.warn(`   - ${error}`));
    }
    
    return result;
    
  } catch (error) {
    console.error(`\n❌ Failed to generate ${sectionName} drills:`, error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🎯 EDUTEST YEAR 7 DRILL QUESTION GENERATOR');
  console.log('=' .repeat(60));
  console.log(`📚 Test Type: ${TEST_TYPE}`);
  console.log(`🎮 Test Mode: ${TEST_MODE}`);
  console.log(`📅 Started: ${new Date().toISOString()}\n`);
  
  try {
    // Step 1: Analyze current status
    console.log('🔍 STEP 1: Analyzing Current Status');
    const analysis = await analyzeCurrentDrillStatus();
    
    if (analysis.totalMissing === 0) {
      console.log('\n🎉 ALL EDUTEST YEAR 7 DRILLS ARE COMPLETE!');
      console.log('   No generation needed.');
      return;
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Missing Questions: ${analysis.totalMissing}`);
    console.log(`   Sections Needing Work: ${analysis.sectionsNeedingWork.length}`);
    
    // Step 2: Generate missing questions by running the unified generator
    console.log(`\n🚀 STEP 2: Generating Missing Questions`);
    console.log(`   Using unified generation engine for all missing content...\n`);
    
    const startTime = Date.now();
    
    // Use the unified generator which will automatically handle only incomplete sections
    const result = await generatePracticeTest({
      testType: TEST_TYPE,
      testMode: TEST_MODE,
      generatePassages: true
    });
    
    const endTime = Date.now();
    const totalDuration = Math.round((endTime - startTime) / 1000);
    
    // Step 3: Final verification
    console.log(`\n🔍 STEP 3: Final Verification`);
    await printTestCompletionReport(TEST_TYPE, TEST_MODE);
    
    // Summary
    console.log(`\n🎉 EDUTEST YEAR 7 DRILL GENERATION COMPLETE!`);
    console.log('=' .repeat(60));
    console.log(`✅ Total Questions Generated: ${result.totalQuestions}`);
    console.log(`⏱️  Total Time: ${totalDuration} seconds`);
    console.log(`📊 Sections Processed: ${result.sectionsGenerated.length}`);
    
    if (result.errors.length > 0) {
      console.warn(`\n⚠️  ${result.errors.length} Warning(s):`);
      result.errors.forEach(error => console.warn(`   - ${error}`));
    }
    
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Review generated questions in the admin interface`);
    console.log(`   2. Test drill functionality for EduTest Year 7`);
    console.log(`   3. Verify mini-passages for Reading Comprehension drills`);
    console.log(`   4. Check writing prompts for Written Expression drills`);
    
  } catch (error) {
    console.error('\n❌ GENERATION FAILED:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

export { analyzeCurrentDrillStatus, generateSectionDrills };