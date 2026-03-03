import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTestTypes() {
  // Check what test_types exist for VIC
  const { data: allVic, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name')
    .ilike('test_type', '%vic%')
    .limit(10);

  console.log('Sample VIC questions:');
  console.log(JSON.stringify(allVic, null, 2));

  // Also check for reading specifically
  const { data: reading } = await supabase
    .from('questions_v2')
    .select('test_type, section_name')
    .ilike('section_name', '%reading%')
    .ilike('test_type', '%vic%')
    .limit(5);

  console.log('\nVIC Reading questions:');
  console.log(JSON.stringify(reading, null, 2));
}

checkTestTypes().catch(console.error);
