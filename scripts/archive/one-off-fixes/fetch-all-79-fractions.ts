import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Fractions, Decimals & Percentages')
    .order('test_mode');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Total Fractions questions: ${data.length}`);

  let output = 'FRACTIONS, DECIMALS & PERCENTAGES - ALL 79 Questions\n\n';
  output += '='.repeat(80) + '\n';

  data.forEach((q: any, index: number) => {
    output += `Q${index + 1}: ${q.test_mode}\n`;
    output += '='.repeat(80) + '\n';
    output += `Question: ${q.question_text}\n`;
    if (q.options && Array.isArray(q.options)) {
      output += `Options: ${q.options.join(', ')}\n`;
    } else {
      output += `Options: [No options - likely free response]\n`;
    }
    output += `Correct: ${q.correct_answer}\n`;
    output += `ID: ${q.id}\n\n`;
  });

  fs.writeFileSync('/tmp/fractions_all_79.txt', output);
  console.log(`Wrote all ${data.length} questions to /tmp/fractions_all_79.txt`);
}

main();
