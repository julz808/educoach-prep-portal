/**
 * TEST SCRIPT: Verify New Topics Are Being Used
 * 
 * This script tests that the enhanced topic cycling system is returning
 * the new topics and not the old ones.
 */

import { topicCyclingManager } from './scripts/enhanced-topic-cycling-system';

async function testNewTopics() {
  console.log('🔍 Testing New Topic System...\n');

  try {
    // Test each text type to see what topics are being returned
    const testTypes = ['narrative', 'informational', 'persuasive', 'procedural', 'descriptive'];
    
    for (const textType of testTypes) {
      console.log(`📖 Testing ${textType.toUpperCase()} topics:`);
      
      // Get a few topics to see what's being returned
      for (let i = 0; i < 3; i++) {
        const result = await topicCyclingManager.getNextTopicForSubSkill(
          'reading_comprehension',
          7,
          'EduTest Scholarship (Year 7 Entry)',
          'practice_1'
        );
        
        console.log(`   ${i + 1}. Topic: "${result.topic}"`);
        console.log(`      Text Type: ${result.textType}`);
        console.log('');
      }
    }

    // Check if we're getting new topics by looking for specific new topics
    console.log('🆕 Looking for specific new topics...');
    
    const newTopicSamples = [
      "A teenage inventor discovers their AI companion has developed genuine emotions",
      "The science behind CRISPR gene editing and its medical applications", 
      "Why schools should eliminate standardized testing in favor of portfolio assessment",
      "How to set up a productive morning routine that energizes your entire day",
      "The golden moment when sunrise breaks through morning mist over sleeping valleys"
    ];

    let foundNewTopics = 0;
    
    // Test multiple topics to see if we encounter any of our new ones
    for (let i = 0; i < 20; i++) {
      const result = await topicCyclingManager.getNextTopicForSubSkill(
        'reading_comprehension',
        7,
        'Test Product',
        'test_mode'
      );
      
      if (newTopicSamples.includes(result.topic)) {
        console.log(`✅ Found new topic: "${result.topic}"`);
        foundNewTopics++;
      }
    }

    if (foundNewTopics > 0) {
      console.log(`\n🎉 SUCCESS: Found ${foundNewTopics} new topics! The system is using the refreshed topic list.`);
    } else {
      console.log(`\n⚠️  WARNING: No new topics found in 20 samples. The system might still be using old topics or cached state.`);
    }

  } catch (error) {
    console.error('❌ Error testing topics:', error);
  }
}

// Run the test
testNewTopics().catch(console.error);