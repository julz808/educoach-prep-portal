import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestion41() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', '461c6a09-ec2a-441a-aef7-3fe3f0b6f600')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Question 41 Details:');
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
  console.log('\nQuestion Text (first 300 chars):');
  console.log(data.question_text.substring(0, 300));
}

checkQuestion41().catch(console.error);
