import { generateStandaloneQuestions, saveGeneratedQuestions } from '../src/engines/question-generation/questionGenerationEngine';
import { getSubSkillsForSection, TEST_STRUCTURES } from '../src/data/curriculumData';

// Based on the error, it failed on "Numerical relationships (Difficulty 3)" in Quantitative Reasoning
// So we'll skip all the sub-skills that were completed and resume from there

const completedSubSkills = new Set([
  // Reading Reasoning - ALL COMPLETED
  'Inference,1', 'Inference,2', 'Inference,3',
  'Critical thinking,1', 'Critical thinking,2', 'Critical thinking,3',
  'Main idea identification,1', 'Main idea identification,2', 'Main idea identification,3',
  'Cause and effect,1', 'Cause and effect,2', 'Cause and effect,3',
  'Compare and contrast,1', 'Compare and contrast,2', 'Compare and contrast,3',
  'Sequencing,1', 'Sequencing,2', 'Sequencing,3',
  'Prediction,1', 'Prediction,2', 'Prediction,3',
  'Summarization,1', 'Summarization,2', 'Summarization,3',
  'Context clues,1', 'Context clues,2', 'Context clues,3',
  'Author\'s purpose,1', 'Author\'s purpose,2', 'Author\'s purpose,3',
  
  // Mathematical Reasoning - ALL COMPLETED
  'Fractions and decimals,1', 'Fractions and decimals,2', 'Fractions and decimals,3',
  'Measurement and geometry,1', 'Measurement and geometry,2', 'Measurement and geometry,3',
  'Data analysis,1', 'Data analysis,2', 'Data analysis,3',
  'Problem solving,1', 'Problem solving,2', 'Problem solving,3',
  'Number patterns,1', 'Number patterns,2', 'Number patterns,3',
  'Basic algebra,1', 'Basic algebra,2', 'Basic algebra,3',
  'Spatial problem solving,1', 'Spatial problem solving,2', 'Spatial problem solving,3',
  
  // Verbal Reasoning - ALL COMPLETED
  'Word analogies,1', 'Word analogies,2', 'Word analogies,3',
  'Antonyms,1', 'Antonyms,2', 'Antonyms,3',
  'Synonyms,1', 'Synonyms,2', 'Synonyms,3',
  'Sentence completion,1', 'Sentence completion,2', 'Sentence completion,3',
  'Reading comprehension,1', 'Reading comprehension,2', 'Reading comprehension,3',
  'Vocabulary in context,1', 'Vocabulary in context,2', 'Vocabulary in context,3',
  'Classification,1', 'Classification,2', 'Classification,3',
  'Letter and number series,1', 'Letter and number series,2', 'Letter and number series,3',
  
  // Quantitative Reasoning - PARTIALLY COMPLETED
  'Number sequences,1', 'Number sequences,2', 'Number sequences,3',
  'Numerical relationships,1', 'Numerical relationships,2',
  // FAILED ON: 'Numerical relationships,3'
]);

async function resumeDiagnosticTest() {
  console.log('🔄 Resuming VIC Selective Entry Diagnostic Test Generation...');
  
  const testType = 'VIC Selective Entry (Year 9 Entry)';
  const yearLevel = 'Year 9';
  
  // Get test structure for VIC Selective Entry
  const testStructure = TEST_STRUCTURES[testType];
  if (!testStructure) {
    throw new Error(`No test structure found for ${testType}`);
  }

  console.log(`📚 Found test structure for ${testType}`);

  let totalQuestionsGenerated = 0;
  const generatedQuestions: any[] = [];

  // Process each section
  for (const [sectionName] of Object.entries(testStructure)) {
    console.log(`\n📖 Processing section: ${sectionName}`);
    
    // Get sub-skills for this section
    const subSkills = getSubSkillsForSection(sectionName, testType);
    if (subSkills.length === 0) {
      console.log(`⚠️ No sub-skills found for ${sectionName}`);
      continue;
    }
    
    console.log(`🎯 Found ${subSkills.length} sub-skills in ${sectionName}`);

    for (const subSkill of subSkills) {
      console.log(`\n🔍 Processing sub-skill: ${subSkill}`);
      
      // For each difficulty level (1, 2, 3)
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        const skillKey = `${subSkill},${difficulty}`;
        
        if (completedSubSkills.has(skillKey)) {
          console.log(`✅ Skipping ${subSkill} (Difficulty ${difficulty}) - already completed`);
          continue;
        }
        
        console.log(`\n🎲 Generating ${subSkill} (Difficulty ${difficulty})`);
        
        try {
          // Generate one question for this sub-skill at this difficulty
          const questionCount = sectionName === 'Written Expression' && difficulty !== 2 ? 0 : 1;
          
          if (questionCount === 0) {
            console.log(`⏭️ Skipping ${subSkill} (Difficulty ${difficulty}) - Written Expression only includes difficulty 2`);
            continue;
          }
          
          const response = await generateStandaloneQuestions(
            testType,
            yearLevel,
            sectionName,
            subSkill,
            difficulty,
            questionCount
          );

          if (response.questions && response.questions.length > 0) {
            console.log(`✅ Generated ${response.questions.length} question(s) for ${subSkill} (Difficulty ${difficulty})`);
            
            // Save the questions to the database
            await saveGeneratedQuestions(response, undefined, 'diagnostic');
            
            generatedQuestions.push(...response.questions);
            totalQuestionsGenerated += response.questions.length;
            
            // Add a small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log(`⚠️ No questions generated for ${subSkill} (Difficulty ${difficulty})`);
          }
          
        } catch (error) {
          console.error(`❌ Error generating ${subSkill} (Difficulty ${difficulty}):`, error);
          console.log('💾 Saving current progress...');
          
          // Save current progress to a file
          const fs = await import('fs').then(m => m.promises);
          const progressData = {
            completed: Array.from(completedSubSkills),
            currentSection: sectionName,
            currentSubSkill: subSkill,
            currentDifficulty: difficulty,
            totalGenerated: totalQuestionsGenerated,
            errorDetails: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          };
          
          await fs.writeFile('diagnostic_test_progress.json', JSON.stringify(progressData, null, 2));
          console.log('💾 Progress saved to diagnostic_test_progress.json');
          
          // Continue to next question instead of stopping completely
          console.log('🔄 Continuing with next question...');
          continue;
        }
      }
    }
  }

  console.log(`\n🎉 Diagnostic test generation completed!`);
  console.log(`📊 Total questions generated in this session: ${totalQuestionsGenerated}`);
  console.log(`📋 Questions ready for diagnostic assessment`);

  return {
    questionsGenerated: totalQuestionsGenerated,
    questions: generatedQuestions
  };
}

// Run the script
resumeDiagnosticTest()
  .then(result => {
    console.log('✅ Resume script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Resume script failed:', error);
    process.exit(1);
  }); 