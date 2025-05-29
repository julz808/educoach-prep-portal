// Script to test the new visual generation system
import { generateStandaloneQuestions, saveGeneratedQuestions } from './src/engines/question-generation/questionGenerationEngine';
import { supabase } from './src/integrations/supabase/client';
import { VIC_MATH_SKILLS } from './src/data/curriculumData';

console.log('🚀 Starting Visual Generation Test for Year 9 VIC Selective Entry...');

// Helper function to add delay between API calls
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testVisualQuestions() {
  const results = {
    questionIds: [] as string[],
    visualSpecs: [] as any[],
    errors: [] as string[]
  };

  try {
    // Test 1: Spatial Problem Solving Question with Visual (CORRECT sub skill)
    console.log('\n🎲 Generating Spatial Problem Solving Question with Visual...');
    const spatialRequest = {
      testType: 'VIC Selective Entry (Year 9 Entry)',
      yearLevel: 'Year 9',
      sectionName: 'Mathematical Reasoning',
      subSkill: 'Spatial problem solving', // ✅ This is in VIC_MATH_SKILLS
      difficulty: 2,
      questionCount: 1,
      visualRequired: true,
      australianContext: true
    };

    const spatialResponse = await generateStandaloneQuestions(
      spatialRequest.testType,
      spatialRequest.yearLevel,
      spatialRequest.sectionName,
      spatialRequest.subSkill,
      spatialRequest.difficulty,
      spatialRequest.questionCount
    );

    if (spatialResponse.questions.length > 0) {
      const question = spatialResponse.questions[0];
      console.log(`✅ Generated question with visual: ${question.hasVisual}`);
      if (question.hasVisual && question.visualSpecification) {
        console.log(`📊 Visual Type: ${question.visualSpecification.visual_type}`);
        console.log(`📝 Visual Title: ${question.visualSpecification.title}`);
        console.log(`📋 Visual Description: ${question.visualSpecification.description.substring(0, 100)}...`);
        results.visualSpecs.push(question.visualSpecification);
      }

      // Save to Supabase with test mode 'practice_1'
      const saveResult = await saveGeneratedQuestions(spatialResponse, undefined, 'practice_1');
      results.questionIds.push(...saveResult.questionIds);
      console.log(`💾 Saved to Supabase with IDs: ${saveResult.questionIds.join(', ')}`);
    }

    await sleep(2000); // 2 second delay

    // Test 2: Mathematical Problem Solving Question (CORRECT sub skill)
    console.log('\n🧮 Generating Mathematical Problem Solving Question...');
    const mathRequest = {
      testType: 'VIC Selective Entry (Year 9 Entry)',
      yearLevel: 'Year 9',
      sectionName: 'Mathematical Reasoning',
      subSkill: 'Mathematical problem solving', // ✅ This is in VIC_MATH_SKILLS
      difficulty: 3,
      questionCount: 1,
      visualRequired: false, // This sub skill doesn't require visuals
      australianContext: true
    };

    const mathResponse = await generateStandaloneQuestions(
      mathRequest.testType,
      mathRequest.yearLevel,
      mathRequest.sectionName,
      mathRequest.subSkill,
      mathRequest.difficulty,
      mathRequest.questionCount
    );

    if (mathResponse.questions.length > 0) {
      const question = mathResponse.questions[0];
      console.log(`✅ Generated question with visual: ${question.hasVisual}`);
      if (question.hasVisual && question.visualSpecification) {
        console.log(`📊 Visual Type: ${question.visualSpecification.visual_type}`);
        console.log(`📝 Visual Title: ${question.visualSpecification.title}`);
        console.log(`📋 Visual Description: ${question.visualSpecification.description.substring(0, 100)}...`);
        results.visualSpecs.push(question.visualSpecification);
      }

      // Save to Supabase with test mode 'practice_1'
      const saveResult = await saveGeneratedQuestions(mathResponse, undefined, 'practice_1');
      results.questionIds.push(...saveResult.questionIds);
      console.log(`💾 Saved to Supabase with IDs: ${saveResult.questionIds.join(', ')}`);
    }

    await sleep(2000); // 2 second delay

    // Test 3: Complex Mathematical Concepts Question (CORRECT sub skill)
    console.log('\n🧠 Generating Complex Mathematical Concepts Question...');
    const complexRequest = {
      testType: 'VIC Selective Entry (Year 9 Entry)',
      yearLevel: 'Year 9',
      sectionName: 'Mathematical Reasoning',
      subSkill: 'Complex mathematical concepts', // ✅ This is in VIC_MATH_SKILLS
      difficulty: 3,
      questionCount: 1,
      visualRequired: false, // This sub skill doesn't require visuals
      australianContext: true
    };

    const complexResponse = await generateStandaloneQuestions(
      complexRequest.testType,
      complexRequest.yearLevel,
      complexRequest.sectionName,
      complexRequest.subSkill,
      complexRequest.difficulty,
      complexRequest.questionCount
    );

    if (complexResponse.questions.length > 0) {
      const question = complexResponse.questions[0];
      console.log(`✅ Generated question with visual: ${question.hasVisual}`);
      if (question.hasVisual && question.visualSpecification) {
        console.log(`📊 Visual Type: ${question.visualSpecification.visual_type}`);
        console.log(`📝 Visual Title: ${question.visualSpecification.title}`);
        console.log(`📋 Visual Description: ${question.visualSpecification.description.substring(0, 100)}...`);
        results.visualSpecs.push(question.visualSpecification);
      }

      // Save to Supabase with test mode 'practice_1'
      const saveResult = await saveGeneratedQuestions(complexResponse, undefined, 'practice_1');
      results.questionIds.push(...saveResult.questionIds);
      console.log(`💾 Saved to Supabase with IDs: ${saveResult.questionIds.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error during visual generation test:', error);
    results.errors.push(error instanceof Error ? error.message : String(error));
  }

  // Summary
  console.log('\n🎉 Visual Generation Test Complete!');
  console.log(`📊 Generated Questions: ${results.questionIds.length}`);
  console.log(`📈 Visual Specifications: ${results.visualSpecs.length}`);
  console.log(`🆔 Question IDs: ${results.questionIds.join(', ')}`);
  console.log(`🎮 Test Mode: practice_1`);
  
  // Display all valid VIC Math Skills for reference
  console.log('\n📚 Valid VIC Math Skills for Reference:');
  console.log(VIC_MATH_SKILLS.map((skill, i) => `  ${i + 1}. ${skill}`).join('\n'));
  
  if (results.visualSpecs.length > 0) {
    console.log('\n📋 Sample Visual Specification:');
    console.log(JSON.stringify(results.visualSpecs[0], null, 2));
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️ Errors encountered:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
}

// Run the test
testVisualQuestions().catch(console.error); 