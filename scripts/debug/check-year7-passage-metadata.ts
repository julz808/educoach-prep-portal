import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkMetadata() {
  const { data, error } = await supabase
    .from('passages_v2')
    .select('id, title, passage_type, generation_metadata')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Reading')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📋 Year 7 NAPLAN Reading Passage Metadata (Sample):');
  console.log('━'.repeat(80));

  data.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.passage_type}: ${p.title}`);
    console.log('   Sub-skills in metadata:', p.generation_metadata?.sub_skills || 'N/A');
  });
}

checkMetadata();
