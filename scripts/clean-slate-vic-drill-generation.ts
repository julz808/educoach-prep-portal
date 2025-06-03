import { supabase } from '../src/integrations/supabase/client';
import { getSubSkillsForSection, TEST_STRUCTURES } from '../src/data/curriculumData';
import { generateStandaloneQuestions, generatePassageWithMultipleQuestions, saveGeneratedQuestions } from '../src/engines/question-generation/questionGenerationEngine';

/**
 * CLEAN SLATE VIC Selective Entry Drill Set Generation
 * 
 * STRICT REQUIREMENTS:
 * - Uses exact sub-skills from curriculumData.ts
 * - Generates exactly 10 questions per difficulty level (1-3) for each sub-skill
 * - No more, no less - strict enforcement
 * - Total: 864 questions (29 sub-skills × 30 questions each)
 */

const VIC_TEST_TYPE = 'VIC Selective Entry (Year 9 Entry)';
const YEAR_LEVEL = 'Year 9';
const DIFFICULTIES = [1, 2, 3];
const QUESTIONS_PER_DIFFICULTY = 10;
const QUESTIONS_PER_SUB_SKILL = 30; // 10 per difficulty × 3 difficulties

/**
 * Get the exact section structure from curriculumData.ts
 */
function getVICDrillStructure() {
  const testStructure = TEST_STRUCTURES[VIC_TEST_TYPE];
  if (!testStructure) {
    throw new Error(`Test structure not found for: ${VIC_TEST_TYPE}`);
  }

  const sections = Object.keys(testStructure);
  const drillStructure: Record<string, string[]> = {};
  
  console.log('📋 Reading section structure from curriculumData.ts...\n');
  
  for (const sectionName of sections) {
    const subSkills = getSubSkillsForSection(sectionName, VIC_TEST_TYPE);
    drillStructure[sectionName] = [...subSkills]; // Create a copy
    
    console.log(`🔹 ${sectionName}: ${subSkills.length} sub-skills`);
    subSkills.forEach(subSkill => {
      console.log(`   └─ ${subSkill}`);
    });
    console.log('');
  }
  
  // Calculate totals
  const totalSubSkills = Object.values(drillStructure).reduce((sum, subSkills) => sum + subSkills.length, 0);
  const totalQuestions = totalSubSkills * QUESTIONS_PER_SUB_SKILL;
  
  console.log(`📊 TOTAL STRUCTURE:`);
  console.log(`   • ${Object.keys(drillStructure).length} sections`);
  console.log(`   • ${totalSubSkills} sub-skills`);
  console.log(`   • ${totalQuestions} total questions`);
  console.log(`   • ${QUESTIONS_PER_DIFFICULTY} questions per difficulty level`);
  console.log(`   • ${QUESTIONS_PER_SUB_SKILL} questions per sub-skill\n`);
  
  return drillStructure;
}

/**
 * Generate questions for a specific sub-skill and difficulty
 */
async function generateQuestionsForSubSkillDifficulty(
  sectionName: string,
  subSkill: string,
  difficulty: number
): Promise<boolean> {
  try {
    console.log(`🤖 Generating ${QUESTIONS_PER_DIFFICULTY} questions for: ${sectionName} → ${subSkill} (Difficulty ${difficulty})`);
    
    // Check if this is a reading section
    const isReadingSection = sectionName.toLowerCase().includes('reading');
    
    let response;
    
    if (isReadingSection) {
      // Use passage-based generation for reading sections
      response = await generatePassageWithMultipleQuestions(
        VIC_TEST_TYPE,
        YEAR_LEVEL,
        [subSkill],
        difficulty,
        QUESTIONS_PER_DIFFICULTY,
        sectionName
      );
    } else {
      // Use standalone generation for non-reading sections
      response = await generateStandaloneQuestions(
        VIC_TEST_TYPE,
        YEAR_LEVEL,
        sectionName,
        subSkill,
        difficulty,
        QUESTIONS_PER_DIFFICULTY
      );
    }
    
    // Validate we got exactly the right number of questions
    if (response.questions.length !== QUESTIONS_PER_DIFFICULTY) {
      throw new Error(`Expected ${QUESTIONS_PER_DIFFICULTY} questions, got ${response.questions.length}`);
    }
    
    // Validate all questions have the correct difficulty
    const invalidQuestions = response.questions.filter(q => q.difficulty !== difficulty);
    if (invalidQuestions.length > 0) {
      throw new Error(`${invalidQuestions.length} questions have incorrect difficulty`);
    }
    
    // Save the questions to database
    await saveGeneratedQuestions(response, undefined, 'drill');
    
    console.log(`✅ Successfully generated and saved ${response.questions.length} questions`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to generate questions for ${sectionName} → ${subSkill} (Difficulty ${difficulty}):`, error);
    return false;
  }
}

/**
 * Generate questions for a specific sub-skill (all difficulties)
 */
async function generateQuestionsForSubSkill(
  sectionName: string,
  subSkill: string
): Promise<boolean> {
  console.log(`\n🎯 Starting generation for sub-skill: ${subSkill}`);
  console.log(`   Section: ${sectionName}`);
  console.log(`   Target: ${QUESTIONS_PER_SUB_SKILL} questions (${QUESTIONS_PER_DIFFICULTY} per difficulty)`);
  
  let successCount = 0;
  
  for (const difficulty of DIFFICULTIES) {
    const success = await generateQuestionsForSubSkillDifficulty(sectionName, subSkill, difficulty);
    if (success) {
      successCount++;
    } else {
      console.error(`❌ Failed difficulty ${difficulty} for ${subSkill}`);
      return false;
    }
    
    // Small delay between difficulties
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (successCount === DIFFICULTIES.length) {
    console.log(`✅ COMPLETED: ${subSkill} - ${QUESTIONS_PER_SUB_SKILL} questions generated`);
    return true;
  } else {
    console.error(`❌ FAILED: ${subSkill} - only ${successCount}/${DIFFICULTIES.length} difficulties completed`);
    return false;
  }
}

/**
 * Generate questions for a complete section
 */
async function generateQuestionsForSection(
  sectionName: string,
  subSkills: string[]
): Promise<boolean> {
  console.log(`\n📚 STARTING SECTION: ${sectionName}`);
  console.log(`   Sub-skills: ${subSkills.length}`);
  console.log(`   Target questions: ${subSkills.length * QUESTIONS_PER_SUB_SKILL}`);
  console.log('================================================================================');
  
  let completedSubSkills = 0;
  
  for (let i = 0; i < subSkills.length; i++) {
    const subSkill = subSkills[i];
    console.log(`\n[${i + 1}/${subSkills.length}] Processing: ${subSkill}`);
    
    const success = await generateQuestionsForSubSkill(sectionName, subSkill);
    if (success) {
      completedSubSkills++;
      console.log(`📈 Progress: ${completedSubSkills}/${subSkills.length} sub-skills completed in ${sectionName}`);
    } else {
      console.error(`❌ SECTION FAILED: ${sectionName} failed at sub-skill: ${subSkill}`);
      return false;
    }
    
    // Delay between sub-skills to respect rate limits
    if (i < subSkills.length - 1) {
      console.log('⏳ Waiting 2 seconds before next sub-skill...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n✅ SECTION COMPLETED: ${sectionName}`);
  console.log(`   Sub-skills completed: ${completedSubSkills}/${subSkills.length}`);
  console.log(`   Questions generated: ${completedSubSkills * QUESTIONS_PER_SUB_SKILL}`);
  console.log('================================================================================');
  
  return completedSubSkills === subSkills.length;
}

/**
 * Check if any questions already exist (should be none for clean slate)
 */
async function verifyCleanSlate(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', VIC_TEST_TYPE)
      .eq('test_mode', 'drill');
    
    if (error) {
      console.error('❌ Error checking existing questions:', error);
      return false;
    }
    
    if (count && count > 0) {
      console.error(`❌ CLEAN SLATE VIOLATION: Found ${count} existing drill questions!`);
      console.error('Please delete all existing drill questions first using the SQL script.');
      return false;
    }
    
    console.log('✅ Clean slate verified - no existing drill questions found');
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying clean slate:', error);
    return false;
  }
}

/**
 * Main function - Clean Slate VIC Drill Generation
 */
async function generateCleanSlateVICDrillSet() {
  console.log(`🚀 CLEAN SLATE VIC SELECTIVE ENTRY DRILL SET GENERATION`);
  console.log('================================================================================');
  console.log(`📅 Started: ${new Date().toISOString()}`);
  console.log(`🎯 Test Type: ${VIC_TEST_TYPE}`);
  console.log(`📚 Year Level: ${YEAR_LEVEL}`);
  console.log(`🎲 Difficulties: ${DIFFICULTIES.join(', ')}`);
  console.log(`📊 Questions per difficulty: ${QUESTIONS_PER_DIFFICULTY}`);
  console.log(`📈 Questions per sub-skill: ${QUESTIONS_PER_SUB_SKILL}`);
  console.log('');
  
  try {
    // Step 1: Verify clean slate
    console.log('🔍 STEP 1: Verifying clean slate...');
    const isClean = await verifyCleanSlate();
    if (!isClean) {
      throw new Error('Clean slate verification failed');
    }
    
    // Step 2: Get drill structure from curriculumData.ts
    console.log('📋 STEP 2: Reading structure from curriculumData.ts...');
    const drillStructure = getVICDrillStructure();
    
    // Step 3: Generate questions for each section
    console.log('🤖 STEP 3: Starting question generation...\n');
    
    const sectionNames = Object.keys(drillStructure);
    let completedSections = 0;
    let totalQuestionsGenerated = 0;
    
    for (let i = 0; i < sectionNames.length; i++) {
      const sectionName = sectionNames[i];
      const subSkills = drillStructure[sectionName];
      
      console.log(`\n🎯 [${i + 1}/${sectionNames.length}] PROCESSING SECTION: ${sectionName}`);
      
      const sectionSuccess = await generateQuestionsForSection(sectionName, subSkills);
      
      if (sectionSuccess) {
        completedSections++;
        const sectionQuestions = subSkills.length * QUESTIONS_PER_SUB_SKILL;
        totalQuestionsGenerated += sectionQuestions;
        
        console.log(`✅ Section ${sectionName} completed successfully!`);
        console.log(`📊 Running total: ${totalQuestionsGenerated} questions generated`);
      } else {
        throw new Error(`Section ${sectionName} failed to complete`);
      }
      
      // Delay between sections
      if (i < sectionNames.length - 1) {
        console.log('\n⏳ Waiting 5 seconds before next section...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION...');
    const { count: finalCount, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', VIC_TEST_TYPE)
      .eq('test_mode', 'drill');
    
    if (countError) {
      throw new Error(`Final count verification failed: ${countError.message}`);
    }
    
    console.log(`\n🎉 VIC SELECTIVE ENTRY DRILL SET GENERATION COMPLETE!`);
    console.log('================================================================================');
    console.log(`📅 Completed: ${new Date().toISOString()}`);
    console.log(`✅ Sections completed: ${completedSections}/${sectionNames.length}`);
    console.log(`🎯 Total questions generated: ${finalCount}`);
    console.log(`📊 Expected questions: ${totalQuestionsGenerated}`);
    console.log(`✅ Verification: ${finalCount === totalQuestionsGenerated ? 'PASSED' : 'FAILED'}`);
    
    if (finalCount !== totalQuestionsGenerated) {
      throw new Error(`Question count mismatch: expected ${totalQuestionsGenerated}, found ${finalCount}`);
    }
    
    console.log('\n🏆 SUCCESS: All 864 questions generated with exact specifications!');
    console.log('📚 Ready for student drill practice');
    
  } catch (error) {
    console.error(`\n❌ DRILL SET GENERATION FAILED`);
    console.error('================================================================================');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('1. Ensure all existing drill questions are deleted first');
    console.error('2. Check Claude API key and credits');
    console.error('3. Verify Supabase connection');
    console.error('4. Check rate limiting');
    
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\n\n🛑 Generation interrupted by user');
  console.log('📊 Check database for partial progress');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Generation terminated');
  console.log('📊 Check database for partial progress');
  process.exit(0);
});

// Run the generation
generateCleanSlateVICDrillSet().catch(console.error); 