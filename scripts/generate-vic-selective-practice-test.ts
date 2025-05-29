#!/usr/bin/env ts-node

/**
 * VIC Selective Entry Practice Test Generator
 * 
 * This script generates a complete practice test for VIC Selective Entry (Year 9 Entry)
 * using the Question Generation Engine and stores all questions and passages in Supabase.
 * 
 * Usage:
 *   npm run generate-vic-test [practice-test-number]
 *   
 * Example:
 *   npm run generate-vic-test 1
 *   npm run generate-vic-test 2
 */

import { config } from 'dotenv';
import { generateFullPracticeTest, FullTestResponse } from '../src/engines/question-generation/questionGenerationEngine';

// Load environment variables
config();

// VIC Selective Entry test configuration
const VIC_TEST_TYPE = 'VIC Selective Entry (Year 9 Entry)';

/**
 * Main function to generate VIC Selective Entry practice test
 */
async function generateVICSelectivePracticeTest(): Promise<void> {
  try {
    // Get practice test number from command line args (default to 1)
    const practiceTestNumber = process.argv[2] ? parseInt(process.argv[2]) : 1;
    
    if (isNaN(practiceTestNumber) || practiceTestNumber < 1) {
      throw new Error('Practice test number must be a positive integer');
    }

    console.log(`\n🚀 Starting VIC Selective Entry Practice Test Generation`);
    console.log(`📋 Test Type: ${VIC_TEST_TYPE}`);
    console.log(`🔢 Practice Test Number: ${practiceTestNumber}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log(`${'='.repeat(80)}\n`);

    // Check environment setup
    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      throw new Error('Claude API key not found. Please set VITE_CLAUDE_API_KEY or CLAUDE_API_KEY in your environment variables.');
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
    }

    console.log('✅ Environment configuration verified');
    console.log('✅ Claude API key configured');
    console.log('✅ Supabase configuration verified\n');

    // Generate the full practice test
    console.log('🎯 Generating full VIC Selective Entry practice test...\n');
    
    const startTime = Date.now();
    const testResponse: FullTestResponse = await generateFullPracticeTest(
      VIC_TEST_TYPE,
      practiceTestNumber
    );
    const endTime = Date.now();
    const generationTime = Math.round((endTime - startTime) / 1000);

    // Display generation summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 VIC SELECTIVE ENTRY PRACTICE TEST GENERATION COMPLETE!`);
    console.log(`${'='.repeat(80)}`);
    
    console.log(`\n📊 GENERATION SUMMARY:`);
    console.log(`   Test ID: ${testResponse.testId}`);
    console.log(`   Test Type: ${testResponse.testType}`);
    console.log(`   Mode: ${testResponse.mode}`);
    console.log(`   Total Questions: ${testResponse.totalQuestions}`);
    console.log(`   Total Sections: ${testResponse.sections.length}`);
    console.log(`   Estimated Time: ${testResponse.metadata.estimatedTimeMinutes} minutes`);
    console.log(`   Generation Time: ${generationTime} seconds`);
    console.log(`   Generated At: ${testResponse.metadata.generatedAt}`);

    console.log(`\n📚 SECTION BREAKDOWN:`);
    testResponse.sections.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.sectionName}:`);
      console.log(`      Questions: ${section.questionCount}`);
      
      if (section.passages && section.passages.length > 0) {
        console.log(`      Passages: ${section.passages.length}`);
        section.passages.forEach((passage, pIndex) => {
          console.log(`         ${pIndex + 1}. "${passage.title}" (${passage.questions.length} questions)`);
        });
      }
      
      // Show sub-skill distribution
      const subSkillCounts: { [key: string]: number } = {};
      section.questions.forEach(q => {
        subSkillCounts[q.subSkill] = (subSkillCounts[q.subSkill] || 0) + 1;
      });
      
      console.log(`      Sub-skills covered:`);
      Object.entries(subSkillCounts).forEach(([skill, count]) => {
        console.log(`         - ${skill}: ${count} question${count > 1 ? 's' : ''}`);
      });
      
      // Show difficulty distribution
      const difficultyCounts: { [key: number]: number } = {};
      section.questions.forEach(q => {
        difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
      });
      
      console.log(`      Difficulty distribution:`);
      [1, 2, 3].forEach(level => {
        const count = difficultyCounts[level] || 0;
        if (count > 0) {
          console.log(`         - Level ${level}: ${count} question${count > 1 ? 's' : ''}`);
        }
      });
      
      console.log('');
    });

    console.log(`💾 DATABASE STORAGE:`);
    console.log(`   ✅ All questions saved to Supabase 'questions' table`);
    console.log(`   ✅ All passages saved to Supabase 'passages' table`);
    console.log(`   ✅ Test mode: practice_${practiceTestNumber}`);
    console.log(`   ✅ Questions linked to passages where appropriate`);

    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`   1. Review the generated questions in your Supabase dashboard`);
    console.log(`   2. Test the questions in your application`);
    console.log(`   3. Generate additional practice tests with different numbers:`);
    console.log(`      npm run generate-vic-test ${practiceTestNumber + 1}`);

    console.log(`\n✨ Generation completed successfully! ✨\n`);

  } catch (error) {
    console.error(`\n❌ ERROR: VIC Selective Entry practice test generation failed`);
    console.error(`${'='.repeat(80)}`);
    
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      if (error.stack) {
        console.error(`\nStack trace:`);
        console.error(error.stack);
      }
    } else {
      console.error('Unknown error:', error);
    }
    
    console.error(`\n🔧 TROUBLESHOOTING TIPS:`);
    console.error(`   1. Check your environment variables (.env file)`);
    console.error(`   2. Verify Claude API key is valid and has credits`);
    console.error(`   3. Ensure Supabase connection is working`);
    console.error(`   4. Check network connectivity`);
    console.error(`   5. Review any rate limiting from Claude API`);
    
    process.exit(1);
  }
}

/**
 * Display usage information
 */
function displayUsage(): void {
  console.log(`
VIC Selective Entry Practice Test Generator

Usage:
  npm run generate-vic-test [practice-test-number]

Arguments:
  practice-test-number    Optional practice test number (default: 1)
                         Must be a positive integer

Examples:
  npm run generate-vic-test       # Generates practice test 1
  npm run generate-vic-test 1     # Generates practice test 1  
  npm run generate-vic-test 2     # Generates practice test 2
  npm run generate-vic-test 5     # Generates practice test 5

Environment Variables Required:
  VITE_CLAUDE_API_KEY or CLAUDE_API_KEY    Claude API key for question generation
  VITE_SUPABASE_URL                        Supabase project URL
  VITE_SUPABASE_ANON_KEY                   Supabase anonymous key

The script will:
  ✅ Generate authentic VIC Selective Entry questions across all sections
  ✅ Create reading comprehension passages with associated questions
  ✅ Distribute questions across sub-skills and difficulty levels
  ✅ Save all data to Supabase database
  ✅ Provide detailed generation summary
`);
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  displayUsage();
  process.exit(0);
}

// Run the main function using ES modules approach
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  generateVICSelectivePracticeTest().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { generateVICSelectivePracticeTest }; 