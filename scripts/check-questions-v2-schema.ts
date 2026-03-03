import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  console.log('🔍 Checking questions_v2 schema...\n');

  // Get one question to see all columns
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
    Object.keys(data[0]).sort().forEach(key => {
      console.log(`  - ${key}: ${typeof data[0][key]} ${data[0][key] === null ? '(null)' : ''}`);
    });
  }
}

checkSchema();
