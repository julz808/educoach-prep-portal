import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Checking VIC Selective questions schema...\n');

  const { data, error, count } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact' })
    .like('test_type', 'vic-selective%')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total VIC questions:', count);

  if (data && data.length > 0) {
    console.log('\nColumns in questions_v2:');
    Object.keys(data[0]).forEach(col => console.log(`  - ${col}`));

    console.log('\nSample question:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No VIC questions found');
  }
}

main();
