import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPassages() {
  // First, let's check what test types exist
  console.log('\n🔍 Checking available test types...\n');

  const { data: testTypes, error: ttError } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, test_mode')
    .like('test_type', '%Year 5%')
    .limit(5);

  if (testTypes && testTypes.length > 0) {
    console.log('Found test types:');
    testTypes.forEach(t => console.log(`  - ${t.test_type} / ${t.section_name} / ${t.test_mode}`));
    console.log();
  }

  // Check drill questions for Year 5 Reading - passages are embedded in question_text
  console.log('\n📝 Checking Year 5 NAPLAN Reading drill mini-passages (embedded in questions)...\n');

  const { data: questions, error: qError } = await supabase
    .from('questions_v2')
    .select('question_text, sub_skill, created_at, test_type')
    .eq('test_type', 'Year 5 NAPLAN')
    .eq('section_name', 'Reading')
    .eq('test_mode', 'skill_drill')
    .order('created_at', { ascending: false })
    .limit(20);

  if (qError) {
    console.error('Error:', qError);
    process.exit(1);
  }

  if (!questions || questions.length === 0) {
    console.log('No questions found for Year 5 NAPLAN Reading skill drills.\n');
    return;
  }

  console.log(`Found ${questions.length} recent drill questions:\n`);

  // Analyze passage topics
  const topics: string[] = [];

  questions.forEach((q: any, i) => {
    console.log(`${i + 1}. [${q.sub_skill}]`);

    // Extract passage from question text (passages are between "Read this passage:" and the actual question)
    const passageMatch = q.question_text.match(/Read this passage:\s*\n\n['"]?([^'"]+?)['"]?\n\n(?:What|Which|According|Why|How)/s);

    if (passageMatch) {
      const passage = passageMatch[1].trim();
      const preview = passage.substring(0, 150).replace(/\n/g, ' ');
      console.log(`   📖 "${preview}..."`);

      // Identify topic
      let topic = 'unknown';
      if (passage.match(/koala|kangaroo|platypus|wombat|echidna|wallaby|dingo|possum|kookaburra/i)) {
        topic = 'Australian animals';
      } else if (passage.match(/animal|creature|species|wildlife|habitat/i)) {
        topic = 'Animals (non-Australian)';
      } else if (passage.match(/science|research|study|experiment/i)) {
        topic = 'Science';
      } else if (passage.match(/history|ancient|civilization|century/i)) {
        topic = 'History';
      } else if (passage.match(/technology|computer|digital|innovation/i)) {
        topic = 'Technology';
      } else if (passage.match(/people|person|human|family|friend/i)) {
        topic = 'Human interest';
      }

      topics.push(topic);
      console.log(`   🏷️  Topic: ${topic}`);
    } else {
      console.log(`   ⚠️  Could not extract passage`);
    }

    console.log();
  });

  // Summary
  console.log('\n📊 TOPIC DISTRIBUTION SUMMARY:\n');
  const topicCounts = topics.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([topic, count]) => {
      const percentage = ((count / topics.length) * 100).toFixed(1);
      console.log(`   ${topic}: ${count} passages (${percentage}%)`);
    });
}

checkPassages();
