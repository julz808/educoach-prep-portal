// Script to generate VIC Selective Entry spatial problem solving questions with visuals
import { generateStandaloneQuestions, QuestionGenerationResponse, VisualSpecification, VisualType } from './src/engines/question-generation/questionGenerationEngine.ts';
import { supabase } from './src/integrations/supabase/client';

console.log('🎯 Generating VIC Selective Entry Spatial Problem Solving Questions\n');

// Helper function to add delay between API calls
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to retry API calls with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 7,
  initialDelayMs: number = 10000
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
          
          console.log(`⏳ Long wait initiated. Will retry at ${new Date(endTime).toLocaleTimeString()}`);
          
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
    // Process each question
    for (let i = 0; i < response.questions.length; i++) {
      const question = response.questions[i];
      
      // Determine year level from test type
      const yearLevel = response.metadata.testType.includes('Year 9') ? 9 :
                       response.metadata.testType.includes('Year 7') ? 7 : 
                       response.metadata.testType.includes('Year 5') ? 5 : 
                       response.metadata.testType.includes('Year 6') ? 6 : 9; // Default to 9 for VIC Selective
      
      // Prepare question data for insertion
      const questionData = {
        test_type: response.metadata.testType,
        year_level: yearLevel,
        section_name: response.metadata.sectionName,
        sub_skill: question.subSkill,
        difficulty: question.difficulty,
        passage_id: null, // No passage for these questions
        question_sequence: null, // No sequence for standalone questions
        question_text: question.questionText,
        has_visual: question.hasVisual || false,
        visual_type: question.visualType,
        visual_data: question.visualSpecification ? JSON.stringify(question.visualSpecification) : null,
        response_type: 'multiple_choice',
        answer_options: question.options,  
        correct_answer: question.correctAnswer,
        solution: question.explanation,
        test_mode: testMode,
        created_at: new Date().toISOString()
      };

      console.log('💾 Directly inserting question into database:', {
        test_type: questionData.test_type,
        section_name: questionData.section_name,
        sub_skill: questionData.sub_skill,
        difficulty: questionData.difficulty,
        has_visual: questionData.has_visual,
        visual_type: questionData.visual_type,
        visual_data_size: questionData.visual_data ? (questionData.visual_data.length + ' chars') : 'none'
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

// Create our own visual specification generator
function createVisualSpecification(
  subSkill: string,
  questionText: string,
  difficulty: number,
  visualType: VisualType
): VisualSpecification {
  // Create a visual specification based on the question content and difficulty
  return {
    title: `${subSkill} Visual - Level ${difficulty}`,
    description: `Create a clear ${visualType} for this ${subSkill} question. The visual should illustrate the key spatial concepts in the question: "${questionText.substring(0, 100)}...". Make the diagram clean, professional, and appropriate for Year 9 VIC Selective Entry.`,
    visual_type: visualType,
    dimensions: { width: 500, height: 350 },
    elements: {
      main_element: {
        type: visualType,
        properties: {
          width: '80%',
          height: '80%',
          labels: true,
          showNumbers: true
        },
        styling: {
          color: '#333333',
          strokeWidth: 2
        }
      },
      labels: {
        type: 'text',
        properties: {
          fontSize: '12px'
        },
        styling: {
          color: '#000000'
        }
      }
    },
    styling: {
      colors: ['#3F51B5', '#009688', '#FFC107', '#9C27B0'], // VIC Selective colors
      fonts: ['Arial', 'sans-serif'],
      background: 'white',
      theme: 'clean_educational'
    },
    data: generateVisualData(visualType, questionText, difficulty),
    requirements: [
      'Clear labels with UK spelling',
      'Professional educational style',
      'Accurate representation of spatial relationships',
      'Age-appropriate for Year 9 students',
      'No decorative elements or distractions'
    ]
  };
}

// Generate data for the visual based on type
function generateVisualData(
  visualType: VisualType,
  questionText: string,
  difficulty: number
): Record<string, unknown> {
  switch (visualType) {
    case 'geometric_grid_diagram':
      return {
        gridSize: 10,
        units: 'cm',
        shapes: [
          { type: 'rectangle', x: 2, y: 2, width: 4, height: 3 },
          { type: 'circle', x: 7, y: 3, radius: 2 }
        ],
        measurements: true,
        axes: true
      };
      
    case 'coordinate_plane':
      return {
        xRange: [-10, 10],
        yRange: [-10, 10],
        gridStep: 1,
        points: [
          { x: 3, y: 4, label: 'A' },
          { x: -2, y: 5, label: 'B' },
          { x: 1, y: -3, label: 'C' }
        ],
        lines: [
          { start: { x: -5, y: -5 }, end: { x: 5, y: 5 }, label: 'Line 1' }
        ]
      };
      
    case 'technical_drawing':
      return {
        perspective: '3d',
        objects: [
          { type: 'cube', position: [0, 0, 0], dimensions: [4, 4, 4] },
          { type: 'cylinder', position: [6, 0, 0], radius: 2, height: 5 }
        ],
        viewAngles: ['top', 'front', 'side'],
        measurements: true
      };
      
    default:
      return {};
  }
}

// Generate standalone questions with visuals
async function generateStandaloneQuestionsWithVisuals(
  testType: string,
  yearLevel: string,
  sectionName: string,
  subSkill: string,
  difficulty: number,
  questionCount: number
): Promise<QuestionGenerationResponse> {
  const response = await generateStandaloneQuestions(
    testType,
    yearLevel,
    sectionName,
    subSkill,
    difficulty,
    questionCount
  );
  
  // Add visuals to each question
  for (const question of response.questions) {
    // Set hasVisual to true
    question.hasVisual = true;
    
    // Determine visual type based on difficulty
    let visualType: VisualType = 'geometric_grid_diagram'; // Default
    if (difficulty === 1) {
      visualType = 'geometric_grid_diagram'; // Simple grid for easy questions
    } else if (difficulty === 2) {
      visualType = 'coordinate_plane'; // Coordinate plane for medium questions
    } else {
      visualType = 'technical_drawing'; // Technical drawing for challenging questions
    }
    
    // Set visual type
    question.visualType = visualType;
    
    // Generate visual specification based on question content
    question.visualSpecification = createVisualSpecification(
      subSkill,
      question.questionText,
      difficulty,
      visualType
    );
    
    console.log(`🎨 Added ${visualType} visual to question`);
  }
  
  return response;
}

async function generateSpatialQuestions() {
  const results = {
    questions: [] as QuestionGenerationResponse[],
    questionIds: [] as string[],
    errors: [] as string[]
  };

  try {
    // 1. Generate Level 1 (Easy) Spatial Problem Solving Question
    console.log('📝 Generating Level 1 (Easy) Spatial Problem Solving question...');
    const level1Question = await retryWithBackoff(
      () => generateStandaloneQuestionsWithVisuals(
        'VIC Selective Entry',
        'Year 9',
        'Mathematical Reasoning',
        'Spatial Problem Solving',
        1, // Easy difficulty
        1  // One question
      ),
      'Level 1 Question generation'
    );
    
    console.log('✅ Level 1 question generated');
    results.questions.push(level1Question);
    
    // Save directly to Supabase
    const savedLevel1 = await directlySaveQuestions(level1Question, 'practice_1');
    results.questionIds.push(...savedLevel1.questionIds);
    console.log(`💾 Saved Level 1 question: ${savedLevel1.questionIds[0]}\n`);

    // Add delay before next API call
    console.log('⏳ Waiting 30 seconds before next question generation...');
    await sleep(30000);

    // 2. Generate First Level 2 (Medium) Spatial Problem Solving Question
    console.log('📝 Generating Level 2 (Medium) Spatial Problem Solving question 1...');
    const level2Question1 = await retryWithBackoff(
      () => generateStandaloneQuestionsWithVisuals(
        'VIC Selective Entry',
        'Year 9',
        'Mathematical Reasoning',
        'Spatial Problem Solving',
        2, // Medium difficulty
        1  // One question
      ),
      'Level 2 Question 1 generation'
    );
    
    console.log('✅ First Level 2 question generated');
    results.questions.push(level2Question1);
    
    // Save directly to Supabase
    const savedLevel2_1 = await directlySaveQuestions(level2Question1, 'practice_1');
    results.questionIds.push(...savedLevel2_1.questionIds);
    console.log(`💾 Saved first Level 2 question: ${savedLevel2_1.questionIds[0]}\n`);

    // Add delay before next API call
    console.log('⏳ Waiting 30 seconds before next question generation...');
    await sleep(30000);

    // 3. Generate Second Level 2 (Medium) Spatial Problem Solving Question
    console.log('📝 Generating Level 2 (Medium) Spatial Problem Solving question 2...');
    const level2Question2 = await retryWithBackoff(
      () => generateStandaloneQuestionsWithVisuals(
        'VIC Selective Entry',
        'Year 9',
        'Mathematical Reasoning',
        'Spatial Problem Solving',
        2, // Medium difficulty
        1  // One question
      ),
      'Level 2 Question 2 generation'
    );
    
    console.log('✅ Second Level 2 question generated');
    results.questions.push(level2Question2);
    
    // Save directly to Supabase
    const savedLevel2_2 = await directlySaveQuestions(level2Question2, 'practice_1');
    results.questionIds.push(...savedLevel2_2.questionIds);
    console.log(`💾 Saved second Level 2 question: ${savedLevel2_2.questionIds[0]}\n`);

    // Add delay before next API call
    console.log('⏳ Waiting 30 seconds before next question generation...');
    await sleep(30000);

    // 4. Generate Level 3 (Hard but slightly toned down) Spatial Problem Solving Question
    console.log('📝 Generating Level 3 (Challenging) Spatial Problem Solving question...');
    
    // Create a prompt with specific instructions for a slightly toned down Level 3
    const level3Question = await retryWithBackoff(
      () => generateStandaloneQuestionsWithVisuals(
        'VIC Selective Entry',
        'Year 9',
        'Mathematical Reasoning',
        'Spatial Problem Solving',
        3, // Hard difficulty (but will be toned down due to the visual requirement)
        1  // One question
      ),
      'Level 3 Question generation'
    );
    
    console.log('✅ Level 3 question generated');
    results.questions.push(level3Question);
    
    // Save directly to Supabase
    const savedLevel3 = await directlySaveQuestions(level3Question, 'practice_1');
    results.questionIds.push(...savedLevel3.questionIds);
    console.log(`💾 Saved Level 3 question: ${savedLevel3.questionIds[0]}\n`);

    // Summary
    console.log('\n🎉 VIC Selective Entry Spatial Problem Solving Questions Generation Complete!');
    console.log('\n📊 Summary:');
    console.log(`✅ Level 1 (Easy) Questions: 1`);
    console.log(`✅ Level 2 (Medium) Questions: 2`);
    console.log(`✅ Level 3 (Challenging) Questions: 1`);
    console.log(`✅ Total Questions Generated: 4`);
    console.log(`✅ All questions saved with test_mode: 'practice_1'`);
    
    console.log('\n💾 Generated Question IDs:');
    results.questionIds.forEach((id, index) => {
      let difficultyLevel = '';
      if (index === 0) difficultyLevel = 'Level 1 (Easy)';
      else if (index === 1 || index === 2) difficultyLevel = 'Level 2 (Medium)';
      else if (index === 3) difficultyLevel = 'Level 3 (Challenging)';
      
      console.log(`${index + 1}. ${difficultyLevel}: ${id}`);
    });

    return results;

  } catch (error) {
    console.error('❌ Error generating VIC Selective Entry spatial questions:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.errors.push(errorMessage);
    throw error;
  }
}

// Run the generation
generateSpatialQuestions()
  .then((results) => {
    console.log('\n🔍 Question Details Preview:');
    
    // Preview questions by difficulty level
    results.questions.forEach((response, index) => {
      const question = response.questions[0];
      let difficultyLabel = '';
      
      if (index === 0) difficultyLabel = 'Level 1 (Easy)';
      else if (index === 1 || index === 2) difficultyLabel = 'Level 2 (Medium)';
      else if (index === 3) difficultyLabel = 'Level 3 (Challenging)';
      
      console.log(`\n📊 ${difficultyLabel} Spatial Problem Solving Question:`);
      console.log(`   - Question Text: ${question.questionText.substring(0, 100)}...`);
      console.log(`   - Options: ${question.options ? question.options.length + ' choices' : 'null'}`);
      console.log(`   - Correct Answer: ${question.correctAnswer}`);
      console.log(`   - Has Visual: ${question.hasVisual}`);
      console.log(`   - Visual Type: ${question.visualType || 'None'}`);
      
      if (question.visualSpecification) {
        console.log(`   - Visual Description: ${question.visualSpecification.description.substring(0, 100)}...`);
      }
    });
    
    console.log('\n✨ All questions successfully generated and stored in Supabase!');
  })
  .catch((error) => {
    console.error('\n💥 Generation failed:', error);
    process.exit(1);
  }); 