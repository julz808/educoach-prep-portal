import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchNumberGridsMatricesQuestions() {
  console.log('Fetching Number Grids & Matrices questions...\n');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Number Grids & Matrices')
    .order('test_mode')
    .order('question_order');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} questions\n`);

  let output = 'VIC SELECTIVE ENTRY - NUMBER GRIDS & MATRICES\n';
  output += `ALL ${data.length} Questions\n`;
  output += '='.repeat(80) + '\n\n';

  data.forEach((q, index) => {
    output += `QUESTION ${index + 1} (ID: ${q.id})\n`;
    output += `Test Mode: ${q.test_mode}\n`;
    output += `Difficulty: ${q.difficulty}\n\n`;
    output += `Question Text:\n${q.question_text}\n\n`;
    output += `Options:\n`;
    const options = q.options as any;
    if (options) {
      ['A', 'B', 'C', 'D', 'E'].forEach(opt => {
        if (options[opt]) {
          output += `  ${opt}) ${options[opt]}\n`;
        }
      });
    } else {
      output += `  [No options - likely open-ended question]\n`;
    }
    output += `\nStored Answer: ${q.correct_answer}\n\n`;
    output += `Solution:\n${q.solution}\n\n`;
    output += '-'.repeat(80) + '\n\n';
  });

  const filename = '/tmp/number_grids_matrices_all.txt';
  fs.writeFileSync(filename, output);
  console.log(`✅ Saved to ${filename}`);
  console.log(`\nReady for manual verification of all ${data.length} questions.`);
}

fetchNumberGridsMatricesQuestions().catch(console.error);
