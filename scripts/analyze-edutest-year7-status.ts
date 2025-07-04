#!/usr/bin/env tsx

// ============================================================================
// EDUTEST YEAR 7 STATUS ANALYZER
// ============================================================================
// Analyzes current status and prepares generation plan (no API calls)

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

/**
 * Analyzes current status for all test modes
 */
async function analyzeAllModes() {
  console.log('🔍 EDUTEST YEAR 7 COMPREHENSIVE STATUS ANALYSIS');
  console.log('=' .repeat(70));
  
  const modes = ['diagnostic', 'drill', 'practice_1', 'practice_2', 'practice_3'];
  
  for (const mode of modes) {
    console.log(`\n📋 ${mode.toUpperCase()} MODE:`);
    console.log('-' .repeat(40));
    
    try {
      await printTestCompletionReport(TEST_TYPE, mode);
    } catch (error) {
      console.error(`   ❌ Error analyzing ${mode}:`, error);
    }
  }
}

/**
 * Detailed drill analysis
 */
async function detailedDrillAnalysis() {
  console.log('\n🎯 DETAILED DRILL ANALYSIS');
  console.log('=' .repeat(50));
  
  const testStructure = TEST_STRUCTURES[TEST_TYPE];
  const sections = Object.keys(testStructure);
  
  const existingCounts = await getExistingQuestionCounts(TEST_TYPE, 'drill');
  
  let totalMissing = 0;
  const sectionsNeedingWork = [];
  
  for (const sectionName of sections) {
    const compoundKey = `${TEST_TYPE} - ${sectionName}` as keyof typeof SECTION_TO_SUB_SKILLS;
    const subSkills = SECTION_TO_SUB_SKILLS[compoundKey] || 
                     SECTION_TO_SUB_SKILLS[sectionName as keyof typeof SECTION_TO_SUB_SKILLS] || [];
    
    const questionsPerSubSkill = getDrillQuestionsPerSubSkill(sectionName);
    const expectedTotal = subSkills.length * questionsPerSubSkill;
    const actualTotal = existingCounts.sectionCounts[sectionName]?.total || 0;
    const missing = Math.max(0, expectedTotal - actualTotal);
    
    console.log(`\n📋 ${sectionName}:`);
    console.log(`   Sub-skills: ${subSkills.length}`);
    console.log(`   Questions per sub-skill: ${questionsPerSubSkill} (${isWritingSection(sectionName) ? 'Writing' : 'Academic'} section)`);
    console.log(`   Expected total: ${expectedTotal} questions`);
    console.log(`   Current total: ${actualTotal} questions`);
    console.log(`   Missing: ${missing} questions`);
    
    if (missing > 0) {
      totalMissing += missing;
      sectionsNeedingWork.push(sectionName);
      
      console.log(`   📝 Sub-skill breakdown:`);
      for (const subSkill of subSkills) {
        const actual = existingCounts.sectionCounts[sectionName]?.subSkillCounts[subSkill] || 0;
        const subSkillMissing = Math.max(0, questionsPerSubSkill - actual);
        const status = subSkillMissing === 0 ? '✅' : '⚠️ ';
        console.log(`      ${status} ${subSkill}: ${actual}/${questionsPerSubSkill} (${subSkillMissing} missing)`);
      }
    } else {
      console.log(`   ✅ Section complete!`);
    }
  }
  
  console.log(`\n📊 DRILL SUMMARY:`);
  console.log(`   Total missing questions: ${totalMissing}`);
  console.log(`   Sections needing work: ${sectionsNeedingWork.length}`);
  console.log(`   Complete sections: ${sections.length - sectionsNeedingWork.length}`);
  
  if (sectionsNeedingWork.length > 0) {
    console.log(`\n🎯 GENERATION PRIORITIES:`);
    sectionsNeedingWork.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section}`);
    });
  }
  
  return {
    totalMissing,
    sectionsNeedingWork,
    completeSections: sections.filter(s => !sectionsNeedingWork.includes(s))
  };
}

/**
 * Generate command suggestions
 */
function generateCommands(analysis: any) {
  console.log(`\n🚀 GENERATION COMMANDS:`);
  console.log('=' .repeat(40));
  
  if (analysis.totalMissing === 0) {
    console.log('🎉 All drills are complete! No generation needed.');
    return;
  }
  
  console.log(`\n📝 To generate missing drill questions, run:`);
  console.log(`   npm run generate:edutest-drills`);
  
  console.log(`\n📋 This will generate:`);
  analysis.sectionsNeedingWork.forEach((section: string) => {
    const subSkills = SECTION_TO_SUB_SKILLS[`${TEST_TYPE} - ${section}` as keyof typeof SECTION_TO_SUB_SKILLS] || 
                     SECTION_TO_SUB_SKILLS[section as keyof typeof SECTION_TO_SUB_SKILLS] || [];
    const questionsPerSubSkill = getDrillQuestionsPerSubSkill(section);
    const totalForSection = subSkills.length * questionsPerSubSkill;
    
    console.log(`   - ${section}: ${totalForSection} questions across ${subSkills.length} sub-skills`);
    
    if (section === 'Reading Comprehension') {
      console.log(`     📖 Mini-passages: 1 per question (${totalForSection} mini-passages)`);
    } else if (isWritingSection(section)) {
      console.log(`     ✍️  Writing prompts: ${questionsPerSubSkill} per sub-skill`);
    }
  });
  
  console.log(`\n⏱️  Estimated generation time: ${Math.ceil(analysis.totalMissing / 10)} minutes`);
  console.log(`💰 Estimated API cost: $${(analysis.totalMissing * 0.05).toFixed(2)} (approximate)`);
}

/**
 * Main function
 */
async function main() {
  console.log('📊 EDUTEST YEAR 7 STATUS ANALYZER');
  console.log('=' .repeat(50));
  console.log(`📚 Test: ${TEST_TYPE}`);
  console.log(`📅 Date: ${new Date().toISOString()}\n`);
  
  try {
    // Comprehensive analysis
    await analyzeAllModes();
    
    // Detailed drill analysis
    const drillAnalysis = await detailedDrillAnalysis();
    
    // Generation commands
    generateCommands(drillAnalysis);
    
    console.log(`\n📝 NEXT STEPS:`);
    console.log(`1. Ensure Claude API key is set: CLAUDE_API_KEY`);
    console.log(`2. Run: npm run generate:edutest-drills`);
    console.log(`3. Monitor generation progress in terminal`);
    console.log(`4. Verify results in admin interface`);
    
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