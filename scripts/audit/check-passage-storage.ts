import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPassageStorage() {
  console.log('Checking how passages are stored...\n');

  // Check ACER (we know it has reading passages)
  const { data: acerQuestions } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('product_type', 'ACER Scholarship (Year 7 Entry)')
    .eq('section_name', 'Humanities')
    .limit(5);

  if (acerQuestions && acerQuestions.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('ACER HUMANITIES - SAMPLE QUESTION STRUCTURE');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    const q = acerQuestions[0];
    console.log('Question columns:');
    console.log('─'.repeat(80));
    Object.keys(q).forEach(key => {
      const value = q[key];
      if (value === null) {
        console.log(`${key}: null`);
      } else if (typeof value === 'object') {
        console.log(`${key}: [object] ${JSON.stringify(value).substring(0, 100)}...`);
      } else {
        console.log(`${key}: ${typeof value} (${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''})`);
      }
    });

    console.log('\n\nFull passage_data content:');
    console.log('─'.repeat(80));
    if (q.passage_data) {
      console.log(JSON.stringify(q.passage_data, null, 2).substring(0, 1000));
    } else {
      console.log('passage_data is null');
    }

    console.log('\n\nFull question_text content:');
    console.log('─'.repeat(80));
    console.log(q.question_text);
  }

  // Check NSW Reading
  const { data: nswQuestions } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('product_type', 'NSW Selective Entry (Year 7 Entry)')
    .eq('section_name', 'Reading')
    .limit(5);

  if (nswQuestions && nswQuestions.length > 0) {
    console.log('\n\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('NSW READING - SAMPLE QUESTION STRUCTURE');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    const q = nswQuestions[0];
    console.log('passage_data:', q.passage_data ? 'EXISTS' : 'NULL');
    console.log('passage_id:', q.passage_id || 'NULL');

    console.log('\n\nFull question_text:');
    console.log('─'.repeat(80));
    console.log(q.question_text.substring(0, 800));
  }

  // Check how many questions have passage_data vs passage embedded in question_text
  const { data: allQuestions } = await supabase
    .from('questions_v2')
    .select('product_type, section_name, passage_data, question_text')
    .limit(1000);

  if (allQuestions) {
    const stats = {
      withPassageData: 0,
      withPassageInText: 0,
      neither: 0
    };

    allQuestions.forEach(q => {
      if (q.passage_data !== null) {
        stats.withPassageData++;
      } else if (q.question_text && q.question_text.toLowerCase().includes('passage:')) {
        stats.withPassageInText++;
      } else {
        stats.neither++;
      }
    });

    console.log('\n\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('PASSAGE STORAGE ANALYSIS (first 1000 questions)');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(`Questions with passage_data column: ${stats.withPassageData}`);
    console.log(`Questions with passage in question_text: ${stats.withPassageInText}`);
    console.log(`Questions with neither: ${stats.neither}`);
  }
}

checkPassageStorage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
