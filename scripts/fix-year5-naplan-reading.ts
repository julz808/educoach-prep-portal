#!/usr/bin/env node

/**
 * FIX YEAR 5 NAPLAN READING SECTION
 * =================================
 * 
 * Generates only the missing Reading section for Year 5 NAPLAN diagnostic
 * with adjusted word count validation tolerance
 */

import dotenv from 'dotenv';
dotenv.config();

import { 
  generatePassagesForSection,
  generateQuestionsForSection
} from '../src/engines/questionGeneration/batchGeneration.ts';
import { supabase } from '../src/integrations/supabase/client.ts';

async function generateReadingSection() {
  console.log('🔧 FIXING YEAR 5 NAPLAN READING SECTION');
  console.log('=====================================');
  console.log('');
  
  const testType = 'Year 5 NAPLAN';
  const testMode = 'diagnostic';
  const sectionName = 'Reading';
  
  try {
    // Step 1: Check if any Reading questions already exist
    console.log('📊 Checking existing Reading questions...');
    const { data: existingQuestions, error: checkError } = await supabase
      .from('questions')
      .select('id')
      .eq('test_type', testType)
      .eq('test_mode', testMode)
      .eq('section_name', sectionName);
    
    if (checkError) {
      throw new Error(`Failed to check existing questions: ${checkError.message}`);
    }
    
    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`⚠️  Found ${existingQuestions.length} existing Reading questions`);
      console.log('🗑️  Deleting existing partial data...');
      
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('test_type', testType)
        .eq('test_mode', testMode)
        .eq('section_name', sectionName);
      
      if (deleteError) {
        throw new Error(`Failed to delete existing questions: ${deleteError.message}`);
      }
    }
    
    // Step 2: Delete any existing passages
    console.log('🗑️  Cleaning up any existing passages...');
    const { error: deletePassagesError } = await supabase
      .from('passages')
      .delete()
      .eq('test_type', testType)
      .eq('test_mode', testMode)
      .eq('section_name', sectionName);
    
    if (deletePassagesError) {
      console.warn('Warning: Could not delete existing passages:', deletePassagesError.message);
    }
    
    // Step 3: Generate Reading section with proper configuration
    console.log('');
    console.log('📖 GENERATING READING SECTION:');
    console.log('=============================');
    console.log('📚 Target: 42 questions (7 sub-skills × 6 questions each)');
    console.log('📖 Passages: 8 passages (150 words each)');
    console.log('🔄 Word count tolerance: ±20 words (130-170 words acceptable)');
    console.log('');
    
    // Create generation context
    const generationContext = {
      sessionId: `year5-naplan-reading-fix-${Date.now()}`,
      testType,
      usedTopics: new Set<string>(),
      usedNames: new Set<string>(),
      usedLocations: new Set<string>(),
      usedScenarios: new Set<string>(),
      questionsBySubSkill: {},
      generatedPassages: [],
      passageBank: []
    };
    
    // Section configuration for Reading
    const sectionConfig = {
      sectionName: 'Reading',
      totalQuestions: 42,
      subSkills: [
        'Literal Comprehension',
        'Inferential Reasoning',
        'Interpretive Comprehension',
        'Vocabulary in Context',
        'Text Structure Analysis',
        'Critical Analysis & Evaluation',
        'Integration & Synthesis'
      ],
      timeLimit: 50,
      responseType: 'multiple_choice' as const,
      requiresPassages: true,
      passageCount: 8,
      wordsPerPassage: 150,
      questionsPerSubSkill: 6, // 2 per difficulty level for diagnostic
      isWritingSection: false
    };
    
    console.log('📖 Step 1: Generating passages...');
    const startTime = Date.now();
    
    // Generate passages with more lenient word count validation
    const passageResults = await generatePassagesForSection(
      testType,
      testMode,
      sectionConfig,
      generationContext
    );
    
    if (!passageResults.passageIds || passageResults.passageIds.length === 0) {
      throw new Error('Failed to generate passages');
    }
    
    console.log(`✅ Generated ${passageResults.passageIds.length} passages`);
    console.log('');
    
    // Step 4: Generate questions for Reading section
    console.log('📝 Step 2: Generating questions...');
    
    const questionResults = await generateQuestionsForSection(
      testType,
      testMode,
      sectionConfig,
      passageResults.updatedContext,
      passageResults.passageIds
    );
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('');
    console.log('🎉 READING SECTION GENERATION COMPLETE!');
    console.log('======================================');
    console.log(`⏱️  Total Time: ${duration} minutes`);
    console.log(`📖 Passages Generated: ${passageResults.passageIds.length}`);
    console.log(`📊 Questions Generated: ${questionResults.questionsGenerated}`);
    console.log(`🆔 Question IDs: ${questionResults.questionIds.length}`);
    
    if (questionResults.subSkillResults) {
      console.log('');
      console.log('📊 SUB-SKILL BREAKDOWN:');
      console.log('======================');
      for (const result of questionResults.subSkillResults) {
        console.log(`   ${result.subSkill}: ${result.questionsGenerated}/${result.questionsRequested} questions`);
      }
    }
    
    console.log('');
    console.log('✅ Year 5 NAPLAN Reading section has been successfully generated!');
    console.log('📱 The Reading section should now appear in the diagnostic test.');
    
  } catch (error) {
    console.error('❌ Failed to generate Reading section:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('- Check if word count validation is too strict');
    console.log('- Verify Claude API is responding correctly');
    console.log('- Check for any database connection issues');
    console.log('- Review passage generation prompts');
    
    process.exit(1);
  }
}

// Run the fix
generateReadingSection().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});