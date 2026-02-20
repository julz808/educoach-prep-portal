import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCount() {
  console.log('Verifying total count in questions_v2...\n');

  // Method 1: Use count
  const { count: count1, error: error1 } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  console.log('Method 1 (count with head:true):', count1);

  // Method 2: Select all and count
  const { data: allData, error: error2 } = await supabase
    .from('questions_v2')
    .select('id');

  console.log('Method 2 (select all ids):', allData?.length);

  // Method 3: Count with explicit query
  const { count: count3, error: error3 } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  console.log('Method 3 (count exact):', count3);

  // Show unique test types
  const { data: testTypes } = await supabase
    .from('questions_v2')
    .select('test_type');

  const uniqueTestTypes = [...new Set(testTypes?.map(t => t.test_type))];
  console.log('\nUnique test types in database:');
  uniqueTestTypes.forEach(tt => console.log(`  - ${tt}`));

  // Count by test type
  console.log('\nCount by test type:');
  for (const testType of uniqueTestTypes) {
    const { count } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType);
    console.log(`  ${testType}: ${count}`);
  }
}

verifyCount().catch(console.error);
