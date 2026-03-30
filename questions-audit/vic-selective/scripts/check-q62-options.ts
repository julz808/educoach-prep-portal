import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestion62() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', '054b1e50-99d4-4ace-956c-c42afd1f512a')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Question 62 Details:');
  console.log('====================');
  console.log('Stored Answer:', data.correct_answer);
  console.log('\nOptions:');
  const opts = data.options;
  if (opts) {
    Object.keys(opts).sort().forEach(key => {
      console.log(`  ${key}) ${opts[key]}`);
    });
  } else {
    console.log('  No options found (null)!');
  }
}

checkQuestion62().catch(console.error);
