#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

/**
 * VIC Selective Entry Drill Mode Generator
 * 
 * Lightweight script that uses the main question generation engine.
 * All test structure and logic comes from the authoritative engine.
 * 
 * Drill mode generates extensive practice questions per sub-skill:
 * - Non-writing sections: 30 questions per sub-skill (10 Easy, 10 Medium, 10 Hard)
 * - Writing sections: 6 questions per sub-skill (2 Easy, 2 Medium, 2 Hard)
 * 
 * This provides intensive practice for skill mastery and confidence building.
 */

import { generateCompleteTest, getAuthoritativeTestStructure } from './src/engines/questionGeneration/index.ts';

async function main() {
  console.log('💪 VIC Selective Entry Drill Mode Generator');
  console.log('=' .repeat(50));
  
  try {
    // Get test structure from the authoritative engine
    console.log('\n📋 Loading test structure from engine...');
    const testStructure = getAuthoritativeTestStructure('VIC Selective Entry (Year 9 Entry)');
    
    console.log(`✅ Test Structure Loaded: ${testStructure.totalQuestions} total questions for practice tests`);
    
    // Display test structure
    console.log('\n📊 Test Structure:');
    Object.entries(testStructure.sections).forEach(([sectionName, section]) => {
      const isWritingSection = section.format === 'Written Response';
      const questionsPerSubSkill = isWritingSection ? 6 : 30;
      const drillQuestions = section.subSkills.length * questionsPerSubSkill;
      
      console.log(`\n• ${sectionName}:`);
      console.log(`  - Practice Test Questions: ${section.totalQuestions}`);
      console.log(`  - Drill Questions: ${drillQuestions} (${questionsPerSubSkill} per sub-skill)`);
      console.log(`  - Time: ${section.timeLimit} minutes`);
      console.log(`  - Format: ${section.format}`);
      console.log(`  - Sub-skills: ${section.subSkills.join(', ')}`);
      
      if (section.requiresPassages) {
        console.log(`  - Passages: ${section.passages} (${section.wordsPerPassage} words each)`);
      }
    });
    
    // Calculate drill mode totals
    const drillTotalQuestions = Object.values(testStructure.sections).reduce(
      (sum, section) => {
        const isWritingSection = section.format === 'Written Response';
        const questionsPerSubSkill = isWritingSection ? 6 : 30;
        return sum + (section.subSkills.length * questionsPerSubSkill);
      }, 0
    );
    
    console.log('\n💪 Drill Mode Rules:');
    console.log('   • Non-writing sections: 30 questions per sub-skill (10 Easy, 10 Medium, 10 Hard)');
    console.log('   • Writing sections: 6 questions per sub-skill (2 Easy, 2 Medium, 2 Hard)');
    console.log('   • Intensive practice for skill mastery and confidence building');
    console.log(`   • Total Questions: ${drillTotalQuestions}`);
    
    console.log('\n🎯 Purpose:');
    console.log('   • Extensive practice on specific sub-skills');
    console.log('   • Build fluency and speed through repetition');
    console.log('   • Target areas identified through diagnostic testing');
    console.log('   • Prepare for real test conditions with volume practice');
    
    console.log('\n📚 Reading Section Note:');
    console.log('   • Difficulty applies to passages (Level 1-3), not individual questions');
    console.log('   • All reading questions are standard Level 2 difficulty');
    console.log('   • Multiple passages provide diverse contexts for practice');
    
    console.log('\n⏳ Starting generation...');
    console.log('   This will take considerable time due to the large volume of questions.');
    console.log('   API rate limits will slow the process - please be patient.');
    
    // Generate the complete drill test using the main engine
    const result = await generateCompleteTest(
      'VIC Selective Entry (Year 9 Entry)',
      'drill',
      'Medium'  // Ignored for drill mode - uses fixed distribution
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
      
      console.log('\n🎯 Drill Breakdown:');
      console.log('   Each sub-skill practiced extensively at all difficulty levels:');
      console.log('   • Level 1 (Easy): Build foundational confidence');
      console.log('   • Level 2 (Medium): Develop consistent application');
      console.log('   • Level 3 (Hard): Master advanced concepts');
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    
    console.log('\n🎉 VIC Selective Entry Drill Mode is ready!');
    console.log('\n💡 Usage Recommendations:');
    console.log('   • Use after diagnostic testing to target weak areas');
    console.log('   • Practice one sub-skill at a time for focused improvement');
    console.log('   • Set time limits to simulate test pressure');
    console.log('   • Track improvement across multiple drill sessions');
    console.log('   • Review incorrect answers and explanations thoroughly');
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 