#!/usr/bin/env node

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { generatePracticeTest } from './src/engines/questionGeneration/batchGeneration.ts';

async function runDrillGeneration() {
  console.log('🎯 EDUTEST YEAR 7 DRILL GENERATOR');
  console.log('================================');
  console.log('Test Type: EduTest Scholarship (Year 7 Entry)');
  console.log('Mode: drill');
  console.log('Started:', new Date().toISOString());
  console.log('');
  
  try {
    console.log('🚀 Starting drill generation...');
    const startTime = Date.now();
    
    const result = await generatePracticeTest({
      testType: 'EduTest Scholarship (Year 7 Entry)',
      testMode: 'drill',
      generatePassages: true
    });
    
    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 DRILL GENERATION COMPLETE!');
    console.log('=============================');
    console.log(`✅ Questions Generated: ${result.totalQuestions}`);
    console.log(`⏱️  Total Time: ${totalTime} seconds (${Math.round(totalTime/60)} minutes)`);
    console.log(`📊 Sections Processed: ${result.sectionsGenerated.length}`);
    
    if (result.sectionsGenerated.length > 0) {
      console.log('\n📋 Section Breakdown:');
      result.sectionsGenerated.forEach(section => {
        console.log(`   - ${section.sectionName}: ${section.questionsGenerated} questions`);
        if (section.passageIds && section.passageIds.length > 0) {
          console.log(`     📖 Mini-passages: ${section.passageIds.length}`);
        }
      });
    }
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Test drill functionality in the frontend');
    console.log('   2. Verify mini-passages for Reading Comprehension');
    console.log('   3. Check writing prompts for Written Expression');
    console.log('   4. Review question diversity and quality');
    
  } catch (error) {
    console.error('\n❌ GENERATION FAILED:', error.message);
    
    if (error.stack) {
      console.error('\nError Details:', error.stack);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Claude API key in .env file');
    console.log('   2. Verify Supabase connection');
    console.log('   3. Check for rate limiting (wait and retry)');
    
    process.exit(1);
  }
}

// Run the generation
runDrillGeneration();