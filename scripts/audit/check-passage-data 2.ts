import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' PASSAGE DATA CHECK');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Check passages_v2 table
  const { data: passages, count: passageCount } = await supabase
    .from('passages_v2')
    .select('*', { count: 'exact', head: false })
    .limit(5);

  console.log(`📊 passages_v2 table: ${passageCount} total passages\n`);

  if (passages && passages.length > 0) {
    console.log('Sample passage structure:');
    console.log(JSON.stringify(passages[0], null, 2));
    console.log();
  }

  // Check questions with passage references
  const { data: questionsWithPassages, count: questionPassageCount } = await supabase
    .from('questions_v2')
    .select('passage_id, test_type, section_name', { count: 'exact', head: false })
    .not('passage_id', 'is', null)
    .limit(5);

  console.log(`📊 questions_v2 with passage_id: ${questionPassageCount} questions\n`);

  if (questionsWithPassages && questionsWithPassages.length > 0) {
    console.log('Sample question passage references:');
    questionsWithPassages.forEach((q, idx) => {
      console.log(`${idx + 1}. Test: ${q.test_type}`);
      console.log(`   Section: ${q.section_name}`);
      console.log(`   Passage ID: ${q.passage_id}`);
    });
    console.log();
  }

  // Check if passages use 'stimulus_id' instead
  const { data: questionsWithStimulus, count: stimulusCount } = await supabase
    .from('questions_v2')
    .select('stimulus_id, test_type, section_name', { count: 'exact', head: false })
    .not('stimulus_id', 'is', null)
    .limit(5);

  console.log(`📊 questions_v2 with stimulus_id: ${stimulusCount || 0} questions\n`);

  if (questionsWithStimulus && questionsWithStimulus.length > 0) {
    console.log('Sample question stimulus references:');
    questionsWithStimulus.forEach((q, idx) => {
      console.log(`${idx + 1}. Test: ${q.test_type}`);
      console.log(`   Section: ${q.section_name}`);
      console.log(`   Stimulus ID: ${q.stimulus_id}`);
    });
    console.log();
  }

  // Get a full sample question to see all fields
  const { data: sampleQuestion } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'EduTest Scholarship (Year 7 Entry)')
    .eq('section_name', 'Reading Comprehension')
    .limit(1);

  if (sampleQuestion && sampleQuestion.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' FULL READING QUESTION SAMPLE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(JSON.stringify(sampleQuestion[0], null, 2));
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════════════\n');
})();
