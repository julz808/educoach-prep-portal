// Script to generate VIC Selective Entry test questions
import { generateStandaloneQuestions, saveGeneratedQuestions, QuestionGenerationResponse, GeneratedQuestion } from './src/engines/question-generation/questionGenerationEngine.ts';
import { supabase } from './src/integrations/supabase/client';

console.log('🎯 Generating VIC Selective Entry Test Questions\n');

// Helper function to add delay between API calls
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to retry API calls with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 7,
  initialDelayMs: number = 10000 // Increased from 3000 to 10000 (10 seconds)
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (attempt === maxRetries) {
        throw new Error(`${operationName} failed after ${maxRetries} attempts: ${errorMessage}`);
      }
      
      if (errorMessage.includes('529') || errorMessage.includes('overload')) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        const delaySeconds = Math.round(delayMs / 1000);
        const delayMinutes = Math.floor(delaySeconds / 60);
        const remainingSeconds = delaySeconds % 60;
        
        console.log(`⚠️ API overloaded (attempt ${attempt}/${maxRetries}). Waiting ${delayMinutes > 0 ? `${delayMinutes}m ` : ''}${remainingSeconds}s before retry...`);
        
        // Log countdown for longer waits
        if (delayMs > 30000) {
          const startTime = Date.now();
          const endTime = startTime + delayMs;
          const updateInterval = 15000; // Update every 15 seconds
          
          // Initial wait message
          console.log(`⏳ Long wait initiated. Will retry at ${new Date(endTime).toLocaleTimeString()}`);
          
          // Set up interval to show progress
          const intervalId = setInterval(() => {
            const now = Date.now();
            const remainingMs = endTime - now;
            if (remainingMs <= 0) {
              clearInterval(intervalId);
              return;
            }
            
            const remainingMinutes = Math.floor(remainingMs / 60000);
            const remainingSecs = Math.floor((remainingMs % 60000) / 1000);
            console.log(`⏳ Still waiting... ${remainingMinutes}m ${remainingSecs}s remaining before retry`);
          }, updateInterval);
          
          await sleep(delayMs);
          clearInterval(intervalId);
          console.log(`⏰ Wait complete. Retrying ${operationName} now...`);
        } else {
          await sleep(delayMs);
        }
      } else {
        throw error;
      }
    }
  }
  throw new Error(`${operationName} failed unexpectedly`);
}

// Direct database insertion function to bypass engine logic
async function directlySaveQuestions(
  response: QuestionGenerationResponse,
  testMode: string = 'practice_1'
): Promise<{ questionIds: string[] }> {
  const questionIds: string[] = [];
  
  try {
    // Check if this is a writing section
    const isWritingSection = response.metadata.sectionName === 'Written Expression' || 
                            response.metadata.sectionName === 'Writing' || 
                            response.metadata.sectionName.toLowerCase().includes('writing') || 
                            response.metadata.sectionName.toLowerCase().includes('written');

    // Process each question
    for (let i = 0; i < response.questions.length; i++) {
      const question = response.questions[i];
      
      // Determine year level from test type
      const yearLevel = response.metadata.testType.includes('Year 9') ? 9 :
                       response.metadata.testType.includes('Year 7') ? 7 : 
                       response.metadata.testType.includes('Year 5') ? 5 : 
                       response.metadata.testType.includes('Year 6') ? 6 : 9; // Default to 9 for VIC Selective
      
      // Prepare question data for insertion, handling writing sections appropriately
      const questionData = {
        test_type: response.metadata.testType,
        year_level: yearLevel,
        section_name: response.metadata.sectionName,
        sub_skill: question.subSkill,
        difficulty: question.difficulty,
        passage_id: null, // No passage for our VIC Selective questions
        question_sequence: null, // No sequence for standalone questions
        question_text: question.questionText,
        has_visual: question.hasVisual || false,
        visual_type: question.visualType,
        visual_data: question.visualSpecification ? JSON.stringify(question.visualSpecification) : null,
        response_type: isWritingSection ? 'extended_response' : 'multiple_choice',
        answer_options: isWritingSection ? null : question.options,  
        correct_answer: isWritingSection ? null : question.correctAnswer,
        // CRITICAL: Always provide a solution - for writing sections, use explanation as solution
        solution: isWritingSection ? (question.explanation || "Writing prompt - evaluation based on criteria") : question.explanation,
        test_mode: testMode,
        created_at: new Date().toISOString()
      };

      console.log('💾 Directly inserting question into database:', {
        test_type: questionData.test_type,
        section_name: questionData.section_name,
        sub_skill: questionData.sub_skill,
        response_type: questionData.response_type,
        is_writing_section: isWritingSection,
        solution_provided: questionData.solution ? 'yes' : 'no' // Should always be yes now
      });

      // Insert directly into Supabase
      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error directly saving question to Supabase:', error);
        console.error('❌ Question data that failed:', questionData);
        throw error;
      }

      if (data?.id) {
        questionIds.push(data.id);
        console.log('✅ Successfully saved question with ID:', data.id);
      } else {
        console.warn('⚠️ No ID returned from Supabase insert');
      }
    }

    console.log(`✅ Successfully saved ${questionIds.length} questions directly to database`);
    return { questionIds };
  } catch (error) {
    console.error('❌ Error in directlySaveQuestions:', error);
    throw error;
  }
}

async function generateVICSelectiveQuestions() {
  const results = {
    writtenExpression: [] as QuestionGenerationResponse[],
    mathematicalReasoning: [] as QuestionGenerationResponse[],
    questionIds: [] as string[],
    errors: [] as string[]
  };

  try {
    // 1. Generate Analytical Writing Question
    console.log('📝 Generating Analytical Writing question...');
    const analyticalWriting = await retryWithBackoff(
      () => generateStandaloneQuestions(
        'VIC Selective Entry',
        'Year 9',
        'Written Expression',
        'Analytical Writing',
        3,
        1
      ),
      'Analytical Writing generation'
    );
    
    console.log('✅ Analytical Writing question generated');
    results.writtenExpression.push(analyticalWriting);
    
    // Save directly to Supabase, bypassing the engine's saveGeneratedQuestions
    const savedAnalytical = await directlySaveQuestions(analyticalWriting, 'practice_1');
    results.questionIds.push(...savedAnalytical.questionIds);
    console.log(`💾 Saved analytical writing question: ${savedAnalytical.questionIds[0]}\n`);

    // Add delay before next API call - increased from 2000 to 30000 (30 seconds)
    console.log('⏳ Waiting 30 seconds before next question generation...');
    await sleep(30000);

    // 2. Generate Creative Writing Question
    console.log('🎨 Generating Creative Writing question...');
    const creativeWriting = await retryWithBackoff(
      () => generateStandaloneQuestions(
        'VIC Selective Entry',
        'Year 9',
        'Written Expression',
        'Creative Writing',
        3,
        1
      ),
      'Creative Writing generation'
    );
    
    console.log('✅ Creative Writing question generated');
    results.writtenExpression.push(creativeWriting);
    
    // Save directly to Supabase
    const savedCreative = await directlySaveQuestions(creativeWriting, 'practice_1');
    results.questionIds.push(...savedCreative.questionIds);
    console.log(`💾 Saved creative writing question: ${savedCreative.questionIds[0]}\n`);

    // Add delay before next API call - increased from 2000 to 30000 (30 seconds)
    console.log('⏳ Waiting 30 seconds before next question generation...');
    await sleep(30000);

    // 3. Generate Mathematical Reasoning - Spatial Problem Solving Questions
    console.log('🧮 Generating 4 Mathematical Reasoning - Spatial Problem Solving questions...');
    const mathQuestions = await retryWithBackoff(
      () => generateStandaloneQuestions(
        'VIC Selective Entry',
        'Year 9',
        'Mathematical Reasoning',
        'Spatial Problem Solving',
        3,
        4
      ),
      'Mathematical Reasoning generation'
    );
    
    console.log('✅ Mathematical Reasoning questions generated');
    results.mathematicalReasoning.push(mathQuestions);
    
    // Save directly to Supabase
    const savedMath = await directlySaveQuestions(mathQuestions, 'practice_1');
    results.questionIds.push(...savedMath.questionIds);
    console.log(`💾 Saved ${savedMath.questionIds.length} mathematical reasoning questions`);
    savedMath.questionIds.forEach((id, index) => {
      console.log(`   - Question ${index + 1}: ${id}`);
    });

    // Summary
    console.log('\n🎉 VIC Selective Entry Questions Generation Complete!');
    console.log('\n📊 Summary:');
    console.log(`✅ Written Expression Questions: 2`);
    console.log(`   - Analytical Writing: 1`);
    console.log(`   - Creative Writing: 1`);
    console.log(`✅ Mathematical Reasoning Questions: 4`);
    console.log(`   - Spatial Problem Solving: 4`);
    console.log(`✅ Total Questions Generated: 6`);
    console.log(`✅ All questions saved with test_mode: 'practice_1'`);
    
    console.log('\n💾 Generated Question IDs:');
    results.questionIds.forEach((id, index) => {
      const questionType = index < 2 ? 'Written Expression' : 'Mathematical Reasoning';
      console.log(`${index + 1}. ${questionType}: ${id}`);
    });

    return results;

  } catch (error) {
    console.error('❌ Error generating VIC Selective Entry questions:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.errors.push(errorMessage);
    throw error;
  }
}

// Run the generation
generateVICSelectiveQuestions()
  .then((results) => {
    console.log('\n🔍 Question Details Preview:');
    
    // Preview written expression questions
    results.writtenExpression.forEach((response, index) => {
      const type = index === 0 ? 'Analytical' : 'Creative';
      const question = response.questions[0];
      console.log(`\n📝 ${type} Writing Question:`);
      console.log(`   - Question Text: ${question.questionText.substring(0, 100)}...`);
      console.log(`   - Response Type: extended_response`);
      console.log(`   - Options: ${question.options} (null for writing)`);
      console.log(`   - Correct Answer: ${question.correctAnswer} (null for writing)`);
      console.log(`   - Has Visual: ${question.hasVisual}`);
    });
    
    // Preview mathematical reasoning questions
    const mathResponse = results.mathematicalReasoning[0];
    console.log(`\n🧮 Mathematical Reasoning Questions (${mathResponse.questions.length} total):`);
    mathResponse.questions.forEach((question, index) => {
      console.log(`\n   Question ${index + 1}:`);
      console.log(`   - Question Text: ${question.questionText.substring(0, 80)}...`);
      console.log(`   - Response Type: multiple_choice`);
      console.log(`   - Options: ${question.options ? question.options.length + ' choices' : 'null'}`);
      console.log(`   - Correct Answer: ${question.correctAnswer}`);
      console.log(`   - Has Visual: ${question.hasVisual}`);
      console.log(`   - Difficulty: ${question.difficulty}`);
    });
    
    console.log('\n✨ All questions successfully generated and stored in Supabase!');
  })
  .catch((error) => {
    console.error('\n💥 Generation failed:', error);
    process.exit(1);
  }); 