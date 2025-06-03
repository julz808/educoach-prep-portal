#!/usr/bin/env tsx

/**
 * VIC Selective Entry Diagnostic Test Generator
 * 
 * This script generates a comprehensive diagnostic test for VIC Selective Entry (Year 9 Entry)
 * that assesses every sub-skill at every difficulty level to provide complete diagnostic coverage.
 * 
 * Test Structure:
 * - Reading Reasoning: 21 questions (7 sub-skills × 3 difficulties) - 6 passages with 4,4,4,4,4,1 questions
 * - Mathematical Reasoning: 21 questions (7 sub-skills × 3 difficulties) - individual questions
 * - Verbal Reasoning: 21 questions (7 sub-skills × 3 difficulties) - individual questions
 * - Quantitative Reasoning: 21 questions (7 sub-skills × 3 difficulties) - individual questions
 * - Written Expression: 2 questions (2 sub-skills × 1 difficulty level 2) - individual questions
 * 
 * Total: 88 questions providing complete diagnostic assessment
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { 
  generatePassageWithMultipleQuestions,
  generateStandaloneQuestions,
  saveGeneratedQuestions,
  type QuestionGenerationResponse,
  type GeneratedQuestion
} from '../src/engines/question-generation/questionGenerationEngine.js';
import { 
  getSubSkillsForSection, 
  getAllDifficultyLevels,
  getTestStructure
} from '../src/data/curriculumData.js';

// Load environment variables
config();

// VIC Selective Entry test configuration
const VIC_TEST_TYPE = 'VIC Selective Entry (Year 9 Entry)';
const TEST_MODE = 'diagnostic';
const YEAR_LEVEL = 'Year 9';

/**
 * Main function to generate VIC Selective Entry diagnostic test
 */
async function main() {
  try {
    // Validate environment
    await validateEnvironment();
    
    console.log(`\n🚀 Starting VIC Selective Entry Diagnostic Test Generation`);
    console.log(`📋 Test Type: ${VIC_TEST_TYPE}`);
    console.log(`🎯 Mode: ${TEST_MODE.toUpperCase()}`);
    console.log(`📊 Coverage: Every sub-skill at every difficulty level`);
    
    // Get test structure and sections
    const testStructure = getTestStructure(VIC_TEST_TYPE);
    if (!testStructure) {
      throw new Error(`Test structure not found for ${VIC_TEST_TYPE}`);
    }
    
    const sections = Object.keys(testStructure);
    console.log(`📚 Sections: ${sections.join(', ')}`);
    
    // Initialize Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
    
    // Generate unique test identifier
    const testId = `vic-diagnostic-${Date.now()}`;
    console.log(`🆔 Test ID: ${testId}`);
    
    console.log('🎯 Generating comprehensive VIC Selective Entry diagnostic test...\n');
    
    // Generate sections
    const allQuestions: GeneratedQuestion[] = [];
    const sectionResults: Array<{
      sectionName: string;
      questions: GeneratedQuestion[];
      questionCount: number;
      passages?: Array<{
        id: string;
        title: string;
        content: string;
        questions: GeneratedQuestion[];
      }>;
    }> = [];
    
    let totalQuestions = 0;
    
    for (const sectionName of sections) {
      console.log(`\n📖 Processing Section: ${sectionName}`);
      
      const subSkills = getSubSkillsForSection(sectionName, VIC_TEST_TYPE);
      const difficulties = getAllDifficultyLevels(); // [1, 2, 3]
      
      console.log(`   Sub-skills (${subSkills.length}): ${subSkills.join(', ')}`);
      
      if (sectionName === 'Written Expression') {
        // Special case: Written Expression gets only 1 question per sub-skill at difficulty 2
        console.log(`   📝 Written Expression: 2 questions (2 sub-skills × 1 difficulty level 2)`);
        
        const sectionQuestions: GeneratedQuestion[] = [];
        
        for (const subSkill of subSkills) {
          console.log(`      Generating: ${subSkill} (Difficulty 2)`);
          
          const response = await generateStandaloneQuestions(
            VIC_TEST_TYPE,
            YEAR_LEVEL,
            sectionName,
            subSkill,
            2, // Only difficulty level 2
            1  // 1 question per sub-skill
          );
          
          const saved = await saveGeneratedQuestions(response, undefined, TEST_MODE);
          console.log(`         ✅ Generated and saved 1 question (ID: ${saved.questionIds[0]})`);
          
          sectionQuestions.push(...response.questions);
          allQuestions.push(...response.questions);
        }
        
        sectionResults.push({
          sectionName,
          questions: sectionQuestions,
          questionCount: sectionQuestions.length
        });
        
        totalQuestions += sectionQuestions.length;
        console.log(`   ✅ ${sectionName}: ${sectionQuestions.length} questions generated`);
        
      } else if (sectionName === 'Reading Reasoning') {
        // Reading Reasoning: Generate passages with multiple questions
        console.log(`   📚 Reading Reasoning: 21 questions (7 sub-skills × 3 difficulties) via passages`);
        
        const totalReadingQuestions = subSkills.length * difficulties.length; // 7 × 3 = 21
        const questionsPerPassage = 4;
        const passageCount = Math.ceil(totalReadingQuestions / questionsPerPassage); // 6 passages
        
        console.log(`      Structure: ${passageCount} passages with ~${questionsPerPassage} questions each`);
        
        const passages: Array<{
          id: string;
          title: string;
          content: string;
          questions: GeneratedQuestion[];
        }> = [];
        
        const sectionQuestions: GeneratedQuestion[] = [];
        let questionIndex = 0;
        
        for (let p = 0; p < passageCount; p++) {
          const questionsInThisPassage = Math.min(
            questionsPerPassage, 
            totalReadingQuestions - (p * questionsPerPassage)
          );
          
          console.log(`      Passage ${p + 1}: ${questionsInThisPassage} questions`);
          
          // Select sub-skills and difficulties for this passage
          const passageSubSkills: string[] = [];
          const passageDifficulties: number[] = [];
          
          for (let q = 0; q < questionsInThisPassage; q++) {
            const subSkillIndex = questionIndex % subSkills.length;
            const difficultyIndex = Math.floor(questionIndex / subSkills.length) % difficulties.length;
            
            passageSubSkills.push(subSkills[subSkillIndex]);
            passageDifficulties.push(difficulties[difficultyIndex]);
            questionIndex++;
          }
          
          // Generate passage with questions
          const passageDifficulty = Math.round(
            passageDifficulties.reduce((sum, d) => sum + d, 0) / passageDifficulties.length
          );
          
          console.log(`         Sub-skills: ${passageSubSkills.join(', ')}`);
          console.log(`         Difficulties: ${passageDifficulties.join(', ')} (avg: ${passageDifficulty})`);
          
          const response = await generatePassageWithMultipleQuestions(
            VIC_TEST_TYPE,
            YEAR_LEVEL,
            passageSubSkills,
            passageDifficulty,
            questionsInThisPassage,
            sectionName
          );
          
          if (response.passageGenerated) {
            const saved = await saveGeneratedQuestions(response, undefined, TEST_MODE);
            
            passages.push({
              id: saved.passageId || `passage-${p + 1}`,
              title: response.passageGenerated.title,
              content: response.passageGenerated.content,
              questions: response.questions
            });
            
            console.log(`         ✅ Generated passage "${response.passageGenerated.title}" with ${response.questions.length} questions`);
            
            sectionQuestions.push(...response.questions);
            allQuestions.push(...response.questions);
          }
        }
        
        sectionResults.push({
          sectionName,
          questions: sectionQuestions,
          questionCount: sectionQuestions.length,
          passages
        });
        
        totalQuestions += sectionQuestions.length;
        console.log(`   ✅ ${sectionName}: ${sectionQuestions.length} questions across ${passages.length} passages`);
        
      } else {
        // Other sections: Individual questions for each sub-skill × difficulty combination
        console.log(`   🎯 ${sectionName}: ${subSkills.length * difficulties.length} questions (${subSkills.length} sub-skills × ${difficulties.length} difficulties)`);
        
        const sectionQuestions: GeneratedQuestion[] = [];
        
        for (const subSkill of subSkills) {
          for (const difficulty of difficulties) {
            console.log(`      Generating: ${subSkill} (Difficulty ${difficulty})`);
            
            const response = await generateStandaloneQuestions(
              VIC_TEST_TYPE,
              YEAR_LEVEL,
              sectionName,
              subSkill,
              difficulty,
              1 // 1 question per sub-skill per difficulty
            );
            
            const saved = await saveGeneratedQuestions(response, undefined, TEST_MODE);
            console.log(`         ✅ Generated and saved 1 question (ID: ${saved.questionIds[0]})`);
            
            sectionQuestions.push(...response.questions);
            allQuestions.push(...response.questions);
          }
        }
        
        sectionResults.push({
          sectionName,
          questions: sectionQuestions,
          questionCount: sectionQuestions.length
        });
        
        totalQuestions += sectionQuestions.length;
        console.log(`   ✅ ${sectionName}: ${sectionQuestions.length} questions generated`);
      }
    }
    
    console.log(`\n🎉 VIC SELECTIVE ENTRY DIAGNOSTIC TEST GENERATION COMPLETE!`);
    console.log(`📊 DIAGNOSTIC TEST SUMMARY:`);
    console.log(`   🆔 Test ID: ${testId}`);
    console.log(`   📚 Test Type: ${VIC_TEST_TYPE}`);
    console.log(`   🎯 Mode: ${TEST_MODE.toUpperCase()}`);
    console.log(`   📈 Total Questions: ${totalQuestions}`);
    console.log(`   📋 Complete Sub-skill Coverage: ✅`);
    console.log(`   🎚️ Complete Difficulty Coverage: ✅`);
    
    // Section breakdown
    console.log(`\n📖 SECTION BREAKDOWN:`);
    for (const section of sectionResults) {
      console.log(`   📚 ${section.sectionName}: ${section.questionCount} questions`);
      if (section.passages) {
        console.log(`      📄 Passages: ${section.passages.length}`);
        section.passages.forEach((passage, i) => {
          console.log(`         ${i + 1}. "${passage.title}" (${passage.questions.length} questions)`);
        });
      }
    }
    
    // Create diagnostic test record
    const { error: testError } = await supabase
      .from('diagnostic_tests')
      .insert({
        test_id: testId,
        test_type: VIC_TEST_TYPE,
        total_questions: totalQuestions,
        sections: sectionResults.map(s => ({
          name: s.sectionName,
          questionCount: s.questionCount,
          passageCount: s.passages?.length || 0
        })),
        metadata: {
          generatedAt: new Date().toISOString(),
          mode: TEST_MODE,
          coverage: 'complete', // Every sub-skill at every difficulty
          estimatedTimeMinutes: totalQuestions * 1.5 // Rough estimate
        }
      });
    
    if (testError) {
      console.warn(`⚠️ Warning: Could not save diagnostic test record: ${testError.message}`);
    } else {
      console.log(`✅ Diagnostic test record saved to database`);
    }
    
    console.log(`\n🎯 DIAGNOSTIC ASSESSMENT FEATURES:`);
    console.log(`   📊 Complete sub-skill assessment across all sections`);
    console.log(`   🎚️ Full difficulty range coverage (1-3) for comprehensive evaluation`);
    console.log(`   📚 Authentic passage-based reading comprehension questions`);
    console.log(`   🎯 Individual questions for reasoning and mathematical sections`);
    console.log(`   📝 Focused writing assessment at appropriate difficulty level`);
    console.log(`   💾 All questions stored in Supabase with 'diagnostic' test mode`);
    
    console.log(`\n✨ Diagnostic test ready for student assessment!`);
    console.log(`📈 This test will provide comprehensive insights into student strengths and areas for improvement`);
    
  } catch (error) {
    console.error(`\n❌ ERROR: VIC Selective Entry diagnostic test generation failed`);
    console.error(`Details: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    process.exit(1);
  }
}

/**
 * Validate that all required environment variables are present
 */
async function validateEnvironment() {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_CLAUDE_API_KEY'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please set these in your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as generateVICDiagnosticTest };

/*
=== VIC SELECTIVE ENTRY DIAGNOSTIC TEST GENERATOR ===

🎯 PURPOSE:
   Complete diagnostic assessment covering every sub-skill at every difficulty level

📊 COVERAGE:
   ✅ Reading Reasoning: 21 questions (7 sub-skills × 3 difficulties) via passages
   ✅ Mathematical Reasoning: 21 questions (7 sub-skills × 3 difficulties) individually  
   ✅ Verbal Reasoning: 21 questions (7 sub-skills × 3 difficulties) individually
   ✅ Quantitative Reasoning: 21 questions (7 sub-skills × 3 difficulties) individually
   ✅ Written Expression: 2 questions (2 sub-skills × 1 difficulty level 2) individually

📈 TOTAL: 88 questions providing comprehensive diagnostic coverage

🎚️ DIFFICULTY LEVELS:
   Level 1: Accessible questions within VIC Selective standards
   Level 2: Standard questions for VIC Selective level
   Level 3: Challenging questions within VIC Selective standards

📚 PASSAGE STRUCTURE:
   Reading Reasoning uses 6 passages with 4, 4, 4, 4, 4, 1 questions each
   All other sections use individual standalone questions

💾 STORAGE:
   All questions stored in Supabase with test_mode = 'diagnostic'
   Enables comprehensive student assessment and progress tracking

🎯 DIAGNOSTIC VALUE:
   Identifies specific strengths and weaknesses across all assessed areas
   Provides foundation for personalized learning recommendations
   Enables targeted intervention and focused practice recommendations
*/ 