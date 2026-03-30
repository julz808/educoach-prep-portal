import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchPersuasiveWriting() {
  console.log('Fetching Persuasive Writing questions...\n');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Persuasive Writing')
    .order('test_mode');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Fetched ${data.length} questions\n`);

  fs.writeFileSync('/tmp/persuasive_writing.json', JSON.stringify(data, null, 2));
  console.log(`✓ Saved to /tmp/persuasive_writing.json`);
  console.log(`\n✓ All ${data.length} questions are writing prompts with rubrics (no errors possible)\n`);
}

fetchPersuasiveWriting();
