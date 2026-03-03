import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkColumns() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Column names in questions_v2:');
    console.log(Object.keys(data[0]));
    console.log('\nSample question:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkColumns();
