import { supabase } from '../src/integrations/supabase/client.js';
import { generateQuestion } from '../src/engines/questionGeneration/questionGeneration.ts';

async function testDrillTopicCycling() {
  console.log('🧪 Testing drill question topic cycling...\n');

  // Test generating 5 drill questions for Reading Comprehension
  const testRequest = {
    testType: 'EduTest Scholarship (Year 7 Entry)',
    sectionName: 'Reading Comprehension',
    subSkill: 'Literal Comprehension & Detail Extraction',
    difficulty: 2,
    responseType: 'multiple_choice' as const,
    generateVisual: false,
    generationContext: {
      usedTopics: new Set<string>(),
      usedNames: new Set<string>(),
      usedLocations: new Set<string>(),
      usedScenarios: new Set<string>(),
      questionsBySubSkill: {}
    }
  };

  console.log('Generating 5 test drill questions...\n');

  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`--- Question ${i} ---`);
      const question = await generateQuestion(testRequest);
      
      // Extract the first few lines of the question text to see the topic
      const questionPreview = question.question_text.substring(0, 200).split('\n')[0];
      console.log(`Preview: ${questionPreview}...`);
      
      // Check if it contains common repetitive topics
      const text = question.question_text.toLowerCase();
      const commonTopics = [
        'great barrier reef', 'saltwater crocodile', 'echidna', 'origami',
        'kangaroo', 'koala', 'wombat', 'coral reef', 'sydney opera house'
      ];
      
      const foundTopics = commonTopics.filter(topic => text.includes(topic));
      if (foundTopics.length > 0) {
        console.log(`⚠️  Contains common topic: ${foundTopics.join(', ')}`);
      } else {
        console.log(`✅ Unique topic detected`);
      }
      
      console.log('');
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Failed to generate question ${i}:`, error);
    }
  }
  
  console.log('✅ Test completed!');
}

// Run the test
testDrillTopicCycling().catch(console.error);