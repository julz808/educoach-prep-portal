#!/usr/bin/env node

import { generateStandaloneQuestions, saveGeneratedQuestions } from './src/engines/question-generation/questionGenerationEngine.ts';

console.log('🎯 Generating VIC Selective questions with visuals...\n');

async function generateQuestionsWithVisuals() {
  // Test using exact sub-skill names from curriculum data that require visuals
  const visualSubSkills = [
    {
      subSkill: 'Geometry',
      section: 'Mathematical Reasoning',
      testType: 'VIC Selective Entry (Year 9 Entry)',
      yearLevel: 'Year 9'
    },
    {
      subSkill: 'Pattern recognition', 
      section: 'Verbal Reasoning',
      testType: 'VIC Selective Entry (Year 9 Entry)',
      yearLevel: 'Year 9'
    },
    {
      subSkill: 'Data interpretation',
      section: 'Mathematical Reasoning', 
      testType: 'VIC Selective Entry (Year 9 Entry)',
      yearLevel: 'Year 9'
    }
  ];

  const generatedQuestionIds = [];

  for (let i = 0; i < visualSubSkills.length; i++) {
    const { subSkill, section, testType, yearLevel } = visualSubSkills[i];
    
    console.log(`📝 Generating question ${i + 1}/3: ${subSkill}`);
    
    try {
      // Generate question with visual
      const response = await generateStandaloneQuestions(
        testType,
        yearLevel,
        section,
        subSkill,
        2, // difficulty
        1  // question count
      );

      console.log(`✅ Generated question with visual: ${response.questions[0]?.hasVisual}`);
      console.log(`📊 Visual type: ${response.questions[0]?.visualType || 'None'}`);
      console.log(`📐 Dimensions: ${response.questions[0]?.visualSpecification?.dimensions?.width || 'N/A'}x${response.questions[0]?.visualSpecification?.dimensions?.height || 'N/A'}`);

      // Save to database
      console.log('💾 Attempting to save question:', {
        test_type: testType,
        section_name: section,
        sub_skill: subSkill,
        difficulty: 2,
        test_mode: 'drill',
        passage_id: null,
        question_sequence: null,
        is_reading_section: false
      });

      const saveResult = await saveGeneratedQuestions(response, undefined, 'drill');
      console.log(`✅ Successfully saved question with ID: ${saveResult.questionIds[0]}`);
      generatedQuestionIds.push(saveResult.questionIds[0]);

    } catch (error) {
      console.error(`❌ Error generating question for ${subSkill}:`, error.message);
    }

    console.log('💾 Saved question with ID:', generatedQuestionIds[generatedQuestionIds.length - 1]);
    console.log('');
  }

  console.log('🎉 Generated and saved questions with IDs:');
  generatedQuestionIds.forEach((id, index) => {
    console.log(`   • ${id}`);
  });

  console.log('\n📋 Questions are ready for visual image generation!');
  console.log('💡 Next step: Run the visual image generation engine to create the actual images.');
}

generateQuestionsWithVisuals().catch(console.error); 