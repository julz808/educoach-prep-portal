#!/usr/bin/env node

/**
 * EDUTEST SCHOLARSHIP DIAGNOSTIC GENERATION SCRIPT
 * ===============================================
 * 
 * Generates diagnostic questions for EduTest Scholarship (Year 7 Entry) using the enhanced validation system
 * 
 * Features:
 * - Self-flagging validation with VALIDATION_FLAG detection
 * - Batch generation with proper passage support for Reading Comprehension section
 * - Enhanced context tracking for question variety
 * - Real-time progress monitoring with detailed logging
 * 
 * Run: npx tsx scripts/generate-edutest-scholarship-diagnostic.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { 
  generatePracticeTest, 
  getAuthoritativeTestStructure
} from '../src/engines/questionGeneration/batchGeneration.ts';

async function main() {
  console.log('🎯 GENERATING EDUTEST SCHOLARSHIP DIAGNOSTIC - ENHANCED SYSTEM');
  console.log('======================================================================');
  console.log('Using enhanced generation system with self-flagging validation...');
  console.log('');
  console.log('🚀 Features:');
  console.log('📖 Reading Comprehension: 5 passages (200 words each) with multiple questions');
  console.log('🧠 Verbal Reasoning: Advanced word relationships and logical thinking');
  console.log('🔢 Numerical Reasoning: Mathematical problem-solving and pattern recognition');
  console.log('📐 Mathematics: Comprehensive mathematical skills assessment');
  console.log('✍️  Written Expression: Creative and analytical writing tasks');
  console.log('🔄 VALIDATION_FLAG system prevents hallucination');
  console.log('📊 Enhanced variety mechanism prevents repetition');
  console.log('⚡ Real-time progress monitoring');
  console.log('');

  const testType = 'EduTest Scholarship (Year 7 Entry)';
  const testMode = 'diagnostic';

  try {
    // Step 1: Load authoritative test structure
    console.log('📋 Loading authoritative test structure...');
    const testStructure = getAuthoritativeTestStructure(testType);
    
    console.log('📊 EDUTEST SCHOLARSHIP TEST STRUCTURE:');
    console.log('======================================');
    console.log(`🎯 Test Type: ${testType}`);
    console.log(`📋 Test Mode: ${testMode}`);
    console.log('');
    
    // Display section breakdown
    let totalQuestions = 0;
    for (const [sectionName, sectionConfig] of Object.entries(testStructure.sections)) {
      const config = sectionConfig as any;
      totalQuestions += config.totalQuestions;
      
      console.log(`📚 ${sectionName}:`);
      console.log(`   📊 Questions: ${config.totalQuestions}`);
      console.log(`   ⏱️  Time: ${config.timeLimit} minutes`);
      console.log(`   📝 Format: ${config.responseType === 'extended_response' ? 'Written Response' : 'Multiple Choice'}`);
      
      if (config.requiresPassages) {
        console.log(`   📖 Passages: ${config.passageCount} (${config.wordsPerPassage} words each)`);
      }
      
      if (config.subSkills && config.subSkills.length > 0) {
        console.log(`   🎯 Sub-skills: ${config.subSkills.length}`);
        config.subSkills.forEach((skill: string, index: number) => {
          console.log(`      ${index + 1}. ${skill}`);
        });
      }
      console.log('');
    }
    
    console.log(`📊 TOTAL TARGET QUESTIONS: ${totalQuestions}`);
    console.log('======================================');
    console.log('');

    // Step 2: Ready to generate
    console.log('📊 PREPARING FOR GENERATION...');
    console.log('==============================');
    console.log('Note: Any existing questions will be preserved unless conflicts occur');
    console.log('');

    // Step 3: Generate complete test
    console.log('🚀 Starting enhanced batch generation...');
    console.log('=====================================');
    console.log('🔄 Using VALIDATION_FLAG system for quality control');
    console.log('📖 Reading passages will be generated with proper word counts (200 words)');
    console.log('🎯 Questions will be distributed across all sub-skills');
    console.log('⚡ Progress will be logged in real-time');
    console.log('🏆 Scholarship-level difficulty and complexity');
    console.log('🧠 Advanced reasoning and critical thinking focus');
    console.log('');

    const startTime = Date.now();
    
    const result = await generatePracticeTest({
      testType,
      testMode,
      difficulty: 'Mixed' // Diagnostic uses mixed difficulty
    });

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    // Step 4: Display final results
    console.log('');
    console.log('🎉 EDUTEST SCHOLARSHIP DIAGNOSTIC GENERATION COMPLETE!');
    console.log('====================================================');
    console.log(`⏱️  Total Time: ${duration} minutes`);
    console.log(`📊 Questions Generated: ${result.totalQuestions}`);
    console.log(`📖 Question IDs: ${result.questionIds.length}`);
    console.log(`📚 Sections Generated: ${result.sectionsGenerated.length}`);
    
    if (result.sectionsGenerated) {
      console.log('');
      console.log('📊 SECTION BREAKDOWN:');
      console.log('====================');
      
      for (const section of result.sectionsGenerated) {
        console.log(`📚 ${section.sectionName}:`);
        console.log(`   ✅ Questions: ${section.questionsGenerated}`);
        console.log(`   📝 Question IDs: ${section.questionIds.length}`);
        
        if (section.passageIds && section.passageIds.length > 0) {
          console.log(`   📖 Passages: ${section.passageIds.length}`);
        }
        
        if (section.errors && section.errors.length > 0) {
          console.log(`   ⚠️  Errors: ${section.errors.length}`);
        }
      }
    }

    console.log('');
    console.log('🎯 GENERATION SUMMARY:');
    console.log('======================');
    console.log(`✅ Total Questions: ${result.totalQuestions}`);
    console.log(`📚 Sections Completed: ${result.sectionsGenerated.length}`);
    console.log(`🆔 Question IDs Generated: ${result.questionIds.length}`);
    
    console.log('');
    console.log('🏆 EDUTEST SCHOLARSHIP FEATURES:');
    console.log('================================');
    console.log('📖 Reading Comprehension: Advanced text analysis and inference');
    console.log('🧠 Verbal Reasoning: Complex analogies and word relationships');
    console.log('🔢 Numerical Reasoning: Mathematical patterns and logical problem-solving');
    console.log('📐 Mathematics: Comprehensive mathematical skill assessment');
    console.log('✍️  Written Expression: Creative and analytical writing capabilities');
    
    console.log('');
    console.log('📋 Next steps:');
    console.log('- Review generated questions in database');
    console.log('- Run diagnostic test to verify functionality');
    console.log('- Generate ACER Scholarship diagnostic');
    console.log('- Validate scholarship-level difficulty and complexity');
    console.log('');
    console.log('✨ EduTest Scholarship diagnostic generation successful!');

  } catch (error) {
    console.error('❌ EduTest Scholarship diagnostic generation failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('- Verify CLAUDE_API_KEY is set correctly');
    console.log('- Check Supabase connection and permissions');
    console.log('- Ensure test structure data is valid');
    console.log('- Check for network connectivity issues');
    console.log('- Verify EduTest Scholarship structure in curriculumData.ts');
    console.log('- Ensure scholarship-level content generation is working');
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('⏹️  Generation interrupted by user');
  console.log('📊 Partial progress has been saved to database');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});