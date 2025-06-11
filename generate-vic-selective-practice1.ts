#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

/**
 * VIC Selective Entry Practice Test 3 Generator
 * 
 * Lightweight script that uses the main question generation engine.
 * All test structure and logic comes from the authoritative engine.
 */

import { generateCompleteTest, getAuthoritativeTestStructure } from './src/engines/questionGeneration/index.ts';

async function main() {
  console.log('🚀 VIC Selective Entry Practice Test 3 Generator');
  console.log('=' .repeat(50));
  
  try {
    // Get test structure from the authoritative engine
    console.log('\n📋 Loading test structure from engine...');
    const testStructure = getAuthoritativeTestStructure('VIC Selective Entry (Year 9 Entry)');
    
    console.log(`✅ Test Structure Loaded: ${testStructure.totalQuestions} total questions`);
    
    // Display test structure
    console.log('\n📊 Test Structure:');
    Object.entries(testStructure.sections).forEach(([sectionName, section]) => {
      console.log(`\n• ${sectionName}:`);
      console.log(`  - Questions: ${section.totalQuestions}`);
      console.log(`  - Time: ${section.timeLimit} minutes`);
      console.log(`  - Format: ${section.format}`);
      console.log(`  - Sub-skills: ${section.subSkills.join(', ')}`);
      
      if (section.requiresPassages) {
        console.log(`  - Passages: ${section.passages} (${section.wordsPerPassage} words each)`);
      }
    });
    
    console.log('\n🎯 Difficulty Distribution:');
    console.log('   Practice tests automatically distribute questions evenly across:');
    console.log('   • Level 1 (Easy): ~33% of questions');
    console.log('   • Level 2 (Medium): ~33% of questions');
    console.log('   • Level 3 (Hard): ~33% of questions');
    
    console.log('\n⏳ Starting generation...');
    console.log('   This may take several minutes due to API rate limits.');
    
    // Generate the complete test using the main engine
    const result = await generateCompleteTest(
      'VIC Selective Entry (Year 9 Entry)',
      'practice_3',
      'Medium'  // Ignored for practice tests - auto-distributed
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
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    
    console.log('\n🎉 VIC Selective Entry Practice Test 3 is ready!');
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 