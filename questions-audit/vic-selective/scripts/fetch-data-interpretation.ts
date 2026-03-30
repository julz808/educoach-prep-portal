import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchDataInterpretation() {
  console.log('Fetching Data Interpretation - Tables & Graphs questions...\n');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Data Interpretation - Tables & Graphs')
    .order('test_mode');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Fetched ${data.length} questions\n`);

  let output = 'VIC SELECTIVE ENTRY - DATA INTERPRETATION: TABLES & GRAPHS\n';
  output += `ALL ${data.length} Questions\n`;
  output += '=' .repeat(80) + '\n\n';

  data.forEach((q, index) => {
    output += `QUESTION ${index + 1} (ID: ${q.id})\n`;
    output += `Test Mode: ${q.test_mode}\n`;
    output += `Difficulty: ${q.difficulty || 'N/A'}\n`;
    output += `\nQuestion Text:\n${q.question_text}\n`;

    if (q.answer_options && q.answer_options.length > 0) {
      output += `\nOptions:\n`;
      q.answer_options.forEach((opt: string) => {
        output += `  ${opt}\n`;
      });
    }

    output += `\nStored Answer: ${q.correct_answer}\n`;

    if (q.solution) {
      output += `\nSolution:\n${q.solution}\n`;
    }

    output += '\n' + '-'.repeat(80) + '\n\n';
  });

  const filename = '/tmp/data_interpretation_all.txt';
  fs.writeFileSync(filename, output);
  console.log(`✓ Saved to ${filename}`);
  console.log(`\nReady for manual verification!`);
}

fetchDataInterpretation();
