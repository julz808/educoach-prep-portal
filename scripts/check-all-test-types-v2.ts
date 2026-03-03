import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Checking all test types in questions_v2...\n');

  // Get all distinct test types
  const { data, error } = await supabase
    .from('questions_v2')
    .select('test_type')
    .limit(1000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Get unique test types and count
  const testTypes = new Map<string, number>();
  data?.forEach(row => {
    const count = testTypes.get(row.test_type) || 0;
    testTypes.set(row.test_type, count + 1);
  });

  console.log('Test types found:');
  Array.from(testTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} questions`);
    });

  // Also check one question to see schema
  const { data: sample } = await supabase
    .from('questions_v2')
    .select('*')
    .limit(1);

  if (sample && sample.length > 0) {
    console.log('\nColumns in questions_v2:');
    Object.keys(sample[0]).forEach(col => console.log(`  - ${col}`));
  }
}

main();
