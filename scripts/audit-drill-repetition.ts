import { supabase } from '../src/integrations/supabase/client.js';

async function auditDrillQuestions() {
  console.log('🔍 Auditing EduTest Reading Comprehension Drill Questions...\n');

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_text, sub_skill, difficulty, created_at')
    .eq('test_type', 'EduTest Scholarship (Year 7 Entry)')
    .eq('section_name', 'Reading Comprehension')
    .eq('test_mode', 'drill')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`Total drill questions found: ${questions.length}\n`);
  
  // Extract topics from question text
  const topics = new Map<string, number>();
  const topicExamples = new Map<string, string>();
  
  questions.forEach((q) => {
    const text = q.question_text.toLowerCase();
    
    // List of topics to check for
    const topicChecks = [
      { keyword: 'great barrier reef', topic: 'Great Barrier Reef' },
      { keyword: 'barrier reef', topic: 'Great Barrier Reef' },
      { keyword: 'saltwater crocodile', topic: 'Saltwater Crocodile' },
      { keyword: 'crocodile', topic: 'Crocodile' },
      { keyword: 'echidna', topic: 'Echidna' },
      { keyword: 'origami', topic: 'Origami' },
      { keyword: 'coral reef', topic: 'Coral Reef' },
      { keyword: 'coral', topic: 'Coral' },
      { keyword: 'kangaroo', topic: 'Kangaroo' },
      { keyword: 'koala', topic: 'Koala' },
      { keyword: 'wombat', topic: 'Wombat' },
      { keyword: 'tasmanian devil', topic: 'Tasmanian Devil' },
      { keyword: 'platypus', topic: 'Platypus' },
      { keyword: 'didgeridoo', topic: 'Didgeridoo' },
      { keyword: 'boomerang', topic: 'Boomerang' },
      { keyword: 'sydney opera house', topic: 'Sydney Opera House' },
      { keyword: 'uluru', topic: 'Uluru' },
      { keyword: 'ayers rock', topic: 'Uluru' },
      { keyword: 'outback', topic: 'Outback' },
      { keyword: 'eucalyptus', topic: 'Eucalyptus' },
      { keyword: 'aboriginal', topic: 'Aboriginal Culture' },
      { keyword: 'indigenous', topic: 'Indigenous Culture' },
      { keyword: 'reef', topic: 'Reef (Generic)' },
      { keyword: 'marsupial', topic: 'Marsupials' },
      { keyword: 'venom', topic: 'Venomous Animals' },
      { keyword: 'spider', topic: 'Spiders' },
      { keyword: 'snake', topic: 'Snakes' },
      { keyword: 'shark', topic: 'Sharks' },
      { keyword: 'whale', topic: 'Whales' },
      { keyword: 'dolphin', topic: 'Dolphins' },
      { keyword: 'penguin', topic: 'Penguins' },
      { keyword: 'parrot', topic: 'Parrots' },
      { keyword: 'cockatoo', topic: 'Cockatoos' },
      { keyword: 'kookaburra', topic: 'Kookaburra' },
      { keyword: 'emu', topic: 'Emu' },
      { keyword: 'cassowary', topic: 'Cassowary' },
      { keyword: 'dingo', topic: 'Dingo' },
      { keyword: 'wallaby', topic: 'Wallaby' },
      { keyword: 'possum', topic: 'Possum' },
      { keyword: 'bilby', topic: 'Bilby' },
      { keyword: 'quokka', topic: 'Quokka' },
      { keyword: 'numbat', topic: 'Numbat' },
      { keyword: 'sugar glider', topic: 'Sugar Glider' },
      { keyword: 'climate change', topic: 'Climate Change' },
      { keyword: 'global warming', topic: 'Global Warming' },
      { keyword: 'pollution', topic: 'Pollution' },
      { keyword: 'conservation', topic: 'Conservation' },
      { keyword: 'endangered', topic: 'Endangered Species' },
      { keyword: 'extinct', topic: 'Extinction' },
      { keyword: 'habitat', topic: 'Habitats' },
      { keyword: 'ecosystem', topic: 'Ecosystems' },
      { keyword: 'rainforest', topic: 'Rainforest' },
      { keyword: 'desert', topic: 'Desert' },
      { keyword: 'ocean', topic: 'Ocean' },
      { keyword: 'beach', topic: 'Beach' },
      { keyword: 'mountain', topic: 'Mountains' },
      { keyword: 'river', topic: 'Rivers' },
      { keyword: 'lake', topic: 'Lakes' },
      { keyword: 'wetland', topic: 'Wetlands' },
      { keyword: 'bush', topic: 'Australian Bush' },
      { keyword: 'australia', topic: 'Australia (General)' },
      { keyword: 'queensland', topic: 'Queensland' },
      { keyword: 'sydney', topic: 'Sydney' },
      { keyword: 'melbourne', topic: 'Melbourne' },
      { keyword: 'brisbane', topic: 'Brisbane' },
      { keyword: 'perth', topic: 'Perth' },
      { keyword: 'adelaide', topic: 'Adelaide' },
      { keyword: 'hobart', topic: 'Hobart' },
      { keyword: 'darwin', topic: 'Darwin' },
      { keyword: 'canberra', topic: 'Canberra' },
    ];
    
    let foundTopic = false;
    for (const check of topicChecks) {
      if (text.includes(check.keyword)) {
        topics.set(check.topic, (topics.get(check.topic) || 0) + 1);
        if (!topicExamples.has(check.topic)) {
          topicExamples.set(check.topic, q.question_text.substring(0, 150));
        }
        foundTopic = true;
        break;
      }
    }
    
    if (!foundTopic) {
      topics.set('Other/Unclassified', (topics.get('Other/Unclassified') || 0) + 1);
    }
  });
  
  // Sort topics by frequency
  const sortedTopics = Array.from(topics.entries()).sort((a, b) => b[1] - a[1]);
  
  console.log('=== TOPIC DISTRIBUTION (Most Frequent First) ===\n');
  sortedTopics.forEach(([topic, count]) => {
    const percentage = ((count / questions.length) * 100).toFixed(1);
    console.log(`${topic}: ${count} questions (${percentage}%)`);
    if (count > 5 && topicExamples.has(topic)) {
      console.log(`  Example: "${topicExamples.get(topic)}..."\n`);
    }
  });
  
  // Analyze sub-skill distribution
  console.log('\n=== SUB-SKILL DISTRIBUTION ===\n');
  const subSkills = new Map<string, number>();
  questions.forEach(q => {
    subSkills.set(q.sub_skill, (subSkills.get(q.sub_skill) || 0) + 1);
  });
  
  Array.from(subSkills.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([subSkill, count]) => {
      console.log(`${subSkill}: ${count} questions`);
    });
  
  // Analyze difficulty distribution
  console.log('\n=== DIFFICULTY DISTRIBUTION ===\n');
  const difficulties = new Map<number, number>();
  questions.forEach(q => {
    difficulties.set(q.difficulty, (difficulties.get(q.difficulty) || 0) + 1);
  });
  
  Array.from(difficulties.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([difficulty, count]) => {
      console.log(`Difficulty ${difficulty}: ${count} questions`);
    });
  
  // Check for exact duplicates
  console.log('\n=== CHECKING FOR DUPLICATE PASSAGES ===\n');
  const passageTexts = new Map<string, number>();
  questions.forEach(q => {
    // Extract just the passage part (before "Question:" or similar)
    const passageMatch = q.question_text.match(/^(.*?)(?:Question:|What |Which |How |Why |When |Where |Who |According to)/si);
    if (passageMatch) {
      const passage = passageMatch[1].trim().toLowerCase();
      passageTexts.set(passage, (passageTexts.get(passage) || 0) + 1);
    }
  });
  
  const duplicates = Array.from(passageTexts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
  
  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate passages:`);
    duplicates.slice(0, 5).forEach(([passage, count]) => {
      console.log(`\nDuplicated ${count} times:`);
      console.log(`"${passage.substring(0, 100)}..."`);
    });
  } else {
    console.log('No exact duplicate passages found.');
  }
  
  // Summary
  console.log('\n=== SUMMARY ===\n');
  console.log(`Total questions analyzed: ${questions.length}`);
  console.log(`Unique topics identified: ${topics.size}`);
  console.log(`Most common topic: ${sortedTopics[0][0]} (${sortedTopics[0][1]} questions)`);
  console.log(`Topic diversity score: ${(topics.size / Math.min(questions.length, 50) * 100).toFixed(1)}%`);
  
  const highRepetitionTopics = sortedTopics.filter(([_, count]) => count > 5);
  if (highRepetitionTopics.length > 0) {
    console.log(`\n⚠️  High repetition topics (>5 occurrences):`);
    highRepetitionTopics.forEach(([topic, count]) => {
      console.log(`   - ${topic}: ${count} times`);
    });
  }
}

// Run the audit
auditDrillQuestions().catch(console.error);