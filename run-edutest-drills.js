#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

// Import and run the drill generation
import('./src/engines/questionGeneration/batchGeneration.js').then(async ({ generatePracticeTest }) => {
  console.log('🎯 EDUTEST YEAR 7 DRILL GENERATOR');
  console.log('================================');
  console.log('Test Type: EduTest Scholarship (Year 7 Entry)');
  console.log('Mode: drill');
  console.log('Started:', new Date().toISOString());
  
  try {
    const result = await generatePracticeTest({
      testType: 'EduTest Scholarship (Year 7 Entry)',
      testMode: 'drill',
      generatePassages: true
    });
    
    console.log('\n✅ DRILL GENERATION COMPLETE!');
    console.log('Questions Generated:', result.totalQuestions);
    console.log('Duration:', result.metadata.duration, 'seconds');
    console.log('Sections:', result.sectionsGenerated.length);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.errors.forEach(error => console.log('-', error));
    }
    
  } catch (error) {
    console.error('\n❌ GENERATION FAILED:', error.message);
    process.exit(1);
  }
}).catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});