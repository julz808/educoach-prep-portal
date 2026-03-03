import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking question_attempt_history...\n');
  const { data, error } = await supabase
    .from('question_attempt_history')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Columns in question_attempt_history:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}`);
      });
      console.log('\nSample row:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No data found');
    }
  }

  // Check user_progress
  console.log('\n\nChecking user_progress table...\n');
  const { data: progressData, error: progressError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', '52efea0e-d9a8-4f7c-95bb-9e903dd9d3b6')
    .limit(1);

  if (progressError) {
    console.error('Error:', progressError);
  } else {
    if (progressData && progressData.length > 0) {
      console.log('Columns in user_progress:');
      Object.keys(progressData[0]).forEach(key => {
        console.log(`  - ${key}`);
      });
    }
  }
}

checkSchema().catch(console.error);
