#!/usr/bin/env node

import { generateStandaloneQuestions } from './src/engines/question-generation/questionGenerationEngine.ts';
import { isVisualRequired } from './src/data/curriculumData.ts';

console.log('🔍 Testing updated visual specification generation...\n');

// Test cases that should generate visuals - using exact sub-skill names from curriculum data
const testCases = [
  {
    subSkill: 'Geometry',
    questionContext: 'VIC Selective Mathematics',
    difficulty: 2,
    testType: 'VIC Selective Entry (Year 9 Entry)',
    yearLevel: 'Year 9'
  },
  {
    subSkill: 'Statistics and probability',
    questionContext: 'VIC Selective Mathematics',
    difficulty: 2,
    testType: 'VIC Selective Entry (Year 9 Entry)',
    yearLevel: 'Year 9'
  },
  {
    subSkill: 'Pattern recognition',
    questionContext: 'VIC Selective Mathematics',
    difficulty: 2,
    testType: 'VIC Selective Entry (Year 9 Entry)',
    yearLevel: 'Year 9'
  },
  {
    subSkill: 'Spatial reasoning',
    questionContext: 'VIC Selective Mathematics',
    difficulty: 2,
    testType: 'VIC Selective Entry (Year 9 Entry)',
    yearLevel: 'Year 9'
  },
  {
    subSkill: 'Data interpretation',
    questionContext: 'VIC Selective Mathematics',
    difficulty: 2,
    testType: 'VIC Selective Entry (Year 9 Entry)',
    yearLevel: 'Year 9'
  }
];

async function testVisualGeneration() {
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📝 Test ${i + 1}: ${testCase.subSkill}`);
    
    // First check if visual is required
    const visualRequired = isVisualRequired(testCase.subSkill);
    console.log(`🔍 Visual required: ${visualRequired}`);
    
    if (visualRequired) {
      try {
        // Generate a test question that would have a visual
        const response = await generateStandaloneQuestions(
          testCase.testType,
          testCase.yearLevel,
          'Mathematical Reasoning',
          testCase.subSkill,
          testCase.difficulty,
          1 // Just generate 1 question
        );
        
        if (response.questions[0] && response.questions[0].visualSpecification) {
          const visualSpec = response.questions[0].visualSpecification;
          console.log('✅ Visual specification generated:');
          console.log(`   Type: ${visualSpec.visual_type}`);
          console.log(`   Dimensions: ${visualSpec.dimensions.width}x${visualSpec.dimensions.height}`);
          console.log(`   Overview: ${visualSpec.visual_overview.substring(0, 100)}...`);
          console.log(`   Specific Elements: ${Object.keys(visualSpec.specific_elements).length} key elements`);
          console.log(`   Constraints: ${visualSpec.constraints.length} constraints`);
          
          // Log the question to see how it relates to the visual
          console.log(`   Question: ${response.questions[0].questionText.substring(0, 100)}...`);
        } else {
          console.log('❌ Question generated but visual specification not found');
        }
      } catch (error) {
        console.log('❌ Error generating question with visual:', error.message);
      }
    } else {
      console.log('ℹ️ No visual required for this sub-skill');
    }
    
    console.log('---\n');
  }
}

testVisualGeneration().catch(error => {
  console.error('Error in test:', error);
  process.exit(1);
}); 