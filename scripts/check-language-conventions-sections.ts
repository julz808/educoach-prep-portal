import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSections() {
  console.log('🔍 Checking all section names for Year 5 and Year 7 NAPLAN...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name')
    .in('test_type', ['year-5-naplan', 'year-7-naplan']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} questions\n`);

  // Get unique combinations
  const uniqueCombos = new Set(questions?.map(q => `${q.test_type} | ${q.section_name}`) || []);

  console.log('Unique test_type | section_name combinations:');
  Array.from(uniqueCombos).sort().forEach(combo => {
    const count = questions?.filter(q => `${q.test_type} | ${q.section_name}` === combo).length || 0;
    console.log(`  ${combo} (${count} questions)`);
  });
}

checkSections();
