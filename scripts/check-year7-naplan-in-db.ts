import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name')
    .ilike('test_type', '%naplan%');

  console.log('NAPLAN sections found:', data?.length || 0);
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

check();
