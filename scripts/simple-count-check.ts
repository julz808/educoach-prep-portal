import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { count: total } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  const { count: year7Naplan } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('test_type', 'Year 7 NAPLAN');

  const { count: year5Naplan } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('test_type', 'Year 5 NAPLAN');

  const { count: acer } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('test_type', 'ACER Scholarship (Year 7 Entry)');

  console.log('\n📊 Questions_v2 counts:');
  console.log(`  Total: ${total}`);
  console.log(`  Year 7 NAPLAN: ${year7Naplan}`);
  console.log(`  Year 5 NAPLAN: ${year5Naplan}`);
  console.log(`  ACER Scholarship (Year 7 Entry): ${acer}`);
  console.log('');

  // Get Year 7 NAPLAN sections
  const { data: y7Sections } = await supabase
    .from('questions_v2')
    .select('section_name')
    .eq('test_type', 'Year 7 NAPLAN')
    .limit(1000);

  const y7UniqueSection = new Set(y7Sections?.map(s => s.section_name) || []);
  console.log('Year 7 NAPLAN sections:', Array.from(y7UniqueSection).sort());
}

check();
