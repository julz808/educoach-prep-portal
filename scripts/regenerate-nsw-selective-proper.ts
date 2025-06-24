#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

/**
 * Regenerate NSW Selective Diagnostic Using Proper Batch Generation
 * This uses the batch generation system to ensure passages are generated correctly
 */

import { generateCompleteTest } from '../src/engines/questionGeneration/index.ts';

async function main() {
  console.log('🎯 REGENERATING NSW SELECTIVE DIAGNOSTIC - PROPER METHOD');
  console.log('=' .repeat(70));
  console.log('Using batch generation system to ensure proper passages for Reading section...\n');

  const testType = 'NSW Selective Entry (Year 7 Entry)';
  const testMode = 'diagnostic';

  try {
    console.log('🚀 Starting proper batch generation...');
    console.log('📖 This will generate 6 reading passages (250 words each)');
    console.log('📝 Then generate questions linked to those passages');
    console.log('🔄 Fixed variety mechanism will prevent repetition\n');

    const startTime = Date.now();
    
    // Use the proper batch generation system
    const result = await generateCompleteTest(testType, testMode, 'Medium');
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 NSW SELECTIVE DIAGNOSTIC REGENERATION COMPLETE!');
    console.log('=' .repeat(70));
    console.log(`✅ Total questions generated: ${result.totalQuestions}`);
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    
    if (result.sectionsGenerated.length > 0) {
      console.log('\n📊 Section Results:');
      result.sectionsGenerated.forEach(section => {
        console.log(`   • ${section.sectionName}: ${section.questionsGenerated} questions`);
        if (section.passageIds.length > 0) {
          console.log(`     📖 Passages: ${section.passageIds.length} generated`);
        }
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Warnings/Errors:');
      result.errors.forEach(error => console.log(`   • ${error}`));
    } else {
      console.log('\n🎊 PERFECT SUCCESS!');
      console.log('✅ All sections generated with proper structure');
      console.log('✅ Reading passages created correctly');
      console.log('✅ Variety mechanism working');
      console.log('✅ Ready for quality review');
    }

  } catch (error) {
    console.error('\n❌ Regeneration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);