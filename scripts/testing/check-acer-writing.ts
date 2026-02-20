/**
 * Check what's in the ACER Writing database
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, sub_skill, question_text, test_mode, created_at')
    .eq('test_type', 'ACER Scholarship (Year 7 Entry)')
    .eq('section_name', 'Written Expression')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📝 Existing ACER Writing questions:');
  console.log('Total:', data.length);
  console.log('');

  data.forEach((q, i) => {
    const preview = q.question_text.slice(0, 150).replace(/\n/g, ' ');
    console.log(`${i + 1}. [${q.test_mode}] ${q.sub_skill}`);
    console.log(`   ${preview}...`);
    console.log(`   Created: ${q.created_at}`);
    console.log('');
  });
}

main().catch(console.error);
