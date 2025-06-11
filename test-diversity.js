import { 
  generateQuestion
} from './src/engines/questionGeneration/questionGeneration.ts';

async function testDiversity() {
  console.log('🧪 Testing Question Diversity System');
  console.log('=' .repeat(40));
  
  // Initialize empty context
  const generationContext = {
    usedTopics: new Set(),
    usedNames: new Set(),
    usedLocations: new Set(),
    usedScenarios: new Set(),
    generatedQuestions: []
  };
  
  // Generate 5 questions for Mathematics Reasoning to test diversity
  for (let i = 1; i <= 5; i++) {
    console.log(`\n🎯 Generating Question ${i}/5:`);
    
    try {
      const request = {
        testType: 'VIC Selective Entry (Year 9 Entry)',
        sectionName: 'Mathematics Reasoning',
        subSkill: 'Number Operations & Problem Solving',
        difficulty: 2,
        responseType: 'multiple_choice',
        generateVisual: false,
        generationContext
      };
      
      const question = await generateQuestion(request);
      
      console.log(`📝 Question: ${question.question_text.substring(0, 100)}...`);
      console.log(`✅ Generated successfully`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to generate question ${i}: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Final Context State:');
  console.log(`Names used: ${Array.from(generationContext.usedNames).join(', ')}`);
  console.log(`Locations used: ${Array.from(generationContext.usedLocations).join(', ')}`);
  console.log(`Topics used: ${Array.from(generationContext.usedTopics).join(', ')}`);
  console.log(`Scenarios used: ${Array.from(generationContext.usedScenarios).join(', ')}`);
}

// Run the test
testDiversity().catch(console.error); 