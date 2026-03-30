import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Fractions, Decimals & Percentages')
    .in('test_mode', ['diagnostic', 'drill'])
    .order('test_mode')
    .order('question_number');

  let output = `(node:xxx) ExperimentalWarning: Type Stripping is an experimental feature...\nFRACTIONS, DECIMALS & PERCENTAGES - ALL Diagnostic+Drill Questions\n\n`;
  output += '='.repeat(80) + '\n';

  data?.forEach((q: any, index: number) => {
    output += `Q${index + 1}: ${q.test_mode} Q${q.question_number}\n`;
    output += '='.repeat(80) + '\n';
    output += `Question: ${q.question_text}\n`;
    if (q.options) {
      output += `Options: ${q.options.join(', ')}\n`;
    }
    output += `Correct: ${q.correct_answer}\n`;
    output += `ID: ${q.id}\n\n`;
  });

  fs.writeFileSync('/tmp/fractions_all_diagnostic_drill.txt', output);
  console.log(`Wrote ${data?.length} questions to /tmp/fractions_all_diagnostic_drill.txt`);
}

main();
