import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkQuestionsV2() {
  console.log('\n🔍 CHECKING QUESTIONS_V2 TABLE\n');

  const { count } = await supabase
    .from('questions_v2')
    .select('id', { count: 'exact', head: true })
    .eq('product_type', 'Year 5 NAPLAN')
    .eq('test_mode', 'practice_1');

  console.log(`📊 Total questions in questions_v2 for Year 5 NAPLAN practice_1: ${count || 0}\n`);

  const { data: sample } = await supabase
    .from('questions_v2')
    .select('id, section_name, sub_skill')
    .eq('product_type', 'Year 5 NAPLAN')
    .eq('test_mode', 'practice_1')
    .eq('section_name', 'Numeracy')
    .limit(5);

  console.log('Sample Numeracy questions from questions_v2:');
  sample?.forEach((q, i) => console.log(`  ${i + 1}. ID: ${q.id.substring(0, 8)}..., Sub-skill: ${q.sub_skill}`));

  if (!sample || sample.length === 0) {
    console.log('\n❌ NO NUMERACY QUESTIONS FOUND IN QUESTIONS_V2!');
    console.log('\nLet me check what sections exist:');

    const { data: sections } = await supabase
      .from('questions_v2')
      .select('section_name')
      .eq('product_type', 'Year 5 NAPLAN')
      .eq('test_mode', 'practice_1');

    const uniqueSections = [...new Set(sections?.map(s => s.section_name))];
    console.log('Available sections:', uniqueSections);
  }
}

checkQuestionsV2().catch(console.error);
