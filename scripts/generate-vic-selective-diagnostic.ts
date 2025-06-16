#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

/**
 * VIC Selective Entry Diagnostic Test Generator
 * 
 * Lightweight script that uses the main question generation engine.
 * All test structure and logic comes from the authoritative engine.
 * 
 * Diagnostic tests generate exactly 3 questions per sub-skill:
 * - 1 Easy question (Level 1)
 * - 1 Medium question (Level 2)  
 * - 1 Hard question (Level 3)
 * 
 * This provides comprehensive coverage to assess student mastery across all difficulty levels.
 */

import { generateCompleteTest, getAuthoritativeTestStructure } from './src/engines/questionGeneration/index.ts';

async function main() {
  console.log('🔍 VIC Selective Entry Diagnostic Test Generator');
  console.log('=' .repeat(50));
  
  try {
    // Get test structure from the authoritative engine
    console.log('\n📋 Loading test structure from engine...');
    const testStructure = getAuthoritativeTestStructure('VIC Selective Entry (Year 9 Entry)');
    
    console.log(`✅ Test Structure Loaded: ${testStructure.totalQuestions} total questions for practice tests`);
    
    // Display test structure
    console.log('\n📊 Test Structure:');
    Object.entries(testStructure.sections).forEach(([sectionName, section]) => {
      console.log(`\n• ${sectionName}:`);
      console.log(`  - Practice Test Questions: ${section.totalQuestions}`);
      console.log(`  - Diagnostic Questions: ${section.subSkills.length * 3} (3 per sub-skill)`);
      console.log(`  - Time: ${section.timeLimit} minutes`);
      console.log(`  - Format: ${section.format}`);
      console.log(`  - Sub-skills: ${section.subSkills.join(', ')}`);
      
      if (section.requiresPassages) {
        console.log(`  - Passages: ${section.passages} (${section.wordsPerPassage} words each)`);
      }
    });
    
    // Calculate diagnostic test totals
    const diagnosticTotalQuestions = Object.values(testStructure.sections).reduce(
      (sum, section) => sum + (section.subSkills.length * 3), 0
    );
    
    console.log('\n🔍 Diagnostic Test Rules:');
    console.log('   • 3 questions per sub-skill (1 Easy, 1 Medium, 1 Hard)');
    console.log('   • Tests all difficulty levels for comprehensive assessment');
    console.log('   • Identifies precise strengths and areas for improvement');
    console.log(`   • Total Questions: ${diagnosticTotalQuestions}`);
    
    console.log('\n📚 Reading Section Note:');
    console.log('   • Difficulty applies to passages (Level 1-3), not individual questions');
    console.log('   • All reading questions are standard Level 2 difficulty');
    console.log('   • This ensures fair assessment across different passage complexities');
    
    console.log('\n⏳ Starting generation...');
    console.log('   This may take several minutes due to API rate limits.');
    
    // Generate the complete diagnostic test using the main engine
    const result = await generateCompleteTest(
      'VIC Selective Entry (Year 9 Entry)',
      'diagnostic',
      'Medium'  // Ignored for diagnostic tests - uses fixed distribution
    );
    
    // Display results
    console.log('\n' + '='.repeat(50));
    console.log('✅ Generation Complete!');
    console.log('=' .repeat(50));
    
    console.log(`\n📈 Results:`);
    console.log(`   Total Questions: ${result.totalQuestions}`);
    console.log(`   Generation Time: ${result.metadata.duration} seconds`);
    
    if (result.sectionsGenerated && result.sectionsGenerated.length > 0) {
      console.log('\n📊 Section Results:');
      result.sectionsGenerated.forEach(section => {
        console.log(`   • ${section.sectionName}: ${section.questionsGenerated} questions`);
        // Type assertion - we know passageIds exists in the actual implementation
        const sectionWithPassages = section as any;
        if (sectionWithPassages.passageIds && sectionWithPassages.passageIds.length > 0) {
          console.log(`     └─ ${sectionWithPassages.passageIds.length} passages`);
        }
      });
      
      console.log('\n🎯 Diagnostic Breakdown:');
      console.log('   Each sub-skill tested at 3 difficulty levels:');
      console.log('   • Level 1 (Easy): Foundation knowledge');
      console.log('   • Level 2 (Medium): Applied understanding');
      console.log('   • Level 3 (Hard): Advanced mastery');
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    
    console.log('\n🎉 VIC Selective Entry Diagnostic Test is ready!');
    console.log('\n💡 Next Steps:');
    console.log('   • Students can take this test to identify their current level');
    console.log('   • Results will show mastery across all sub-skills and difficulty levels');
    console.log('   • Use insights to create personalized study plans');
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 