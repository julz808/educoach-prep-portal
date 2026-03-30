import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchNumberOperationsQuestions() {
  console.log('Fetching first 30 Number Operations & Properties questions...\n');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Number Operations & Properties')
    .order('test_mode')
    .limit(30);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Fetched ${data.length} questions\n`);

  // Format for manual review
  let output = 'VIC SELECTIVE ENTRY - NUMBER OPERATIONS & PROPERTIES\n';
  output += 'First 30 Questions for Manual Verification\n';
  output += '=' .repeat(80) + '\n\n';

  data.forEach((q, index) => {
    output += `QUESTION ${index + 1} (ID: ${q.id})\n`;
    output += `Test Mode: ${q.test_mode}\n`;
    output += `Difficulty: ${q.difficulty_level || 'N/A'}\n`;
    output += `\nQuestion Text:\n${q.question_text}\n`;

    if (q.options && q.options.length > 0) {
      output += `\nOptions:\n`;
      q.options.forEach((opt: string, i: number) => {
        const letter = String.fromCharCode(65 + i); // A, B, C, D, E
        output += `  ${letter}. ${opt}\n`;
      });
    }

    output += `\nStored Answer: ${q.correct_answer}\n`;

    if (q.solution) {
      output += `\nSolution:\n${q.solution}\n`;
    }

    output += '\n' + '-'.repeat(80) + '\n\n';
  });

  // Save to /tmp/
  const filename = '/tmp/number_operations_q1_30.txt';
  fs.writeFileSync(filename, output);
  console.log(`✓ Saved to ${filename}`);
  console.log(`\nTotal questions fetched: ${data.length}`);
  console.log('\nReady for manual verification!');
}

fetchNumberOperationsQuestions();
