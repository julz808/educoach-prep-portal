// EduTest Year 6 Full Practice Test Generator
// Generates a complete practice test with all sections using the current generation system

import { generateTestSection, saveGeneratedQuestions } from '../src/services/questionGenerationService.js';

// EduTest Year 6 Test Structure
const EDUTEST_YEAR_6_SECTIONS = {
  "Reading_Comprehension": { questions: 35, time: 30, format: "MC, short answer" },
  "Mathematics": { questions: 35, time: 30, format: "MC, short answer" },
  "Written_Expression": { questions: 2, time: 25, format: "Extended response" },
  "Verbal_Reasoning": { questions: 30, time: 30, format: "MC" },
  "Non_verbal_Reasoning": { questions: 30, time: 30, format: "MC" }
};

async function generateFullEduTestYear6() {
  console.log('🚀 Starting EduTest Year 6 Full Practice Test Generation...\n');
  
  const testResults = {
    testType: 'EduTest_Year_6',
    totalQuestions: 0,
    totalVisualQuestions: 0,
    sections: {},
    generatedAt: new Date().toISOString(),
    estimatedDuration: 145 // minutes total
  };

  // Generate each section
  for (const [sectionName, config] of Object.entries(EDUTEST_YEAR_6_SECTIONS)) {
    console.log(`📚 Generating Section: ${sectionName}`);
    console.log(`   Target Questions: ${config.questions} | Time: ${config.time} min | Format: ${config.format}`);
    
    try {
      // Generate questions for this section
      const sectionResponses = await generateTestSection('EduTest_Year_6', sectionName, config.questions);
      
      // Calculate section statistics
      const sectionStats = {
        sectionName,
        responses: sectionResponses.length,
        totalQuestions: sectionResponses.reduce((sum, r) => sum + r.questions.length, 0),
        visualQuestions: sectionResponses.reduce((sum, r) => 
          sum + r.questions.filter(q => q.hasVisual).length, 0),
        subSkillsCovered: sectionResponses.map(r => r.metadata.subSkill),
        timeAllotted: config.time,
        format: config.format,
        questionsBySubSkill: {}
      };

      // Organize questions by sub-skill
      sectionResponses.forEach(response => {
        const subSkill = response.metadata.subSkill;
        sectionStats.questionsBySubSkill[subSkill] = {
          count: response.questions.length,
          difficulty: response.metadata.difficulty,
          hasVisuals: response.questions.some(q => q.hasVisual),
          visualTypes: response.questions
            .filter(q => q.hasVisual)
            .map(q => q.visualType)
            .filter((type, index, arr) => arr.indexOf(type) === index)
        };
      });

      // Save to database (mock for now, but structure is ready)
      console.log(`   💾 Saving ${sectionStats.totalQuestions} questions to database...`);
      const savedResults = [];
      for (const response of sectionResponses) {
        const saved = await saveGeneratedQuestions(response);
        savedResults.push(saved);
      }

      // Update test results
      testResults.sections[sectionName] = {
        ...sectionStats,
        savedQuestionIds: savedResults.flatMap(r => r.questionIds),
        savedPassageIds: savedResults.map(r => r.passageId).filter(Boolean)
      };
      
      testResults.totalQuestions += sectionStats.totalQuestions;
      testResults.totalVisualQuestions += sectionStats.visualQuestions;

      console.log(`   ✅ Section Complete: ${sectionStats.totalQuestions} questions generated`);
      console.log(`      - Visual Questions: ${sectionStats.visualQuestions}`);
      console.log(`      - Sub-skills: ${sectionStats.subSkillsCovered.join(', ')}`);
      console.log('');

    } catch (error) {
      console.error(`   ❌ Error generating section ${sectionName}:`, error.message);
      testResults.sections[sectionName] = { error: error.message };
    }
  }

  // Generate final test summary
  console.log('🎯 EduTest Year 6 Practice Test Generation Complete!\n');
  console.log('📊 TEST SUMMARY:');
  console.log(`   Total Questions Generated: ${testResults.totalQuestions}`);
  console.log(`   Visual Questions: ${testResults.totalVisualQuestions} (${Math.round(testResults.totalVisualQuestions/testResults.totalQuestions*100)}%)`);
  console.log(`   Estimated Duration: ${testResults.estimatedDuration} minutes`);
  console.log(`   Sections: ${Object.keys(testResults.sections).length}`);
  
  console.log('\n📋 SECTION BREAKDOWN:');
  Object.entries(testResults.sections).forEach(([name, stats]) => {
    if (stats.error) {
      console.log(`   ${name}: ❌ ${stats.error}`);
    } else {
      console.log(`   ${name}: ${stats.totalQuestions} questions (${stats.visualQuestions} visual)`);
      console.log(`      Sub-skills: ${Object.keys(stats.questionsBySubSkill).length}`);
      console.log(`      Time: ${stats.timeAllotted} min | Format: ${stats.format}`);
    }
  });

  console.log('\n🗂️  DATABASE STORAGE:');
  const totalSavedQuestions = Object.values(testResults.sections)
    .filter(s => !s.error)
    .reduce((sum, s) => sum + (s.savedQuestionIds?.length || 0), 0);
  const totalSavedPassages = Object.values(testResults.sections)
    .filter(s => !s.error)
    .reduce((sum, s) => sum + (s.savedPassageIds?.length || 0), 0);
  
  console.log(`   Questions Saved: ${totalSavedQuestions}`);
  console.log(`   Passages Saved: ${totalSavedPassages}`);
  console.log(`   Ready for Practice Test Assembly: ✅`);

  return testResults;
}

// Run the generator
if (typeof window === 'undefined') {
  // Node.js environment
  generateFullEduTestYear6()
    .then(results => {
      console.log('\n🎉 Generation complete! Results:', JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    });
} else {
  // Browser environment - export for use
  window.generateFullEduTestYear6 = generateFullEduTestYear6;
}

export { generateFullEduTestYear6 }; 