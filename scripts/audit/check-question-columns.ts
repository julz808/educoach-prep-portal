import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 Checking questions table structure...\n');

  // Get a sample question to see the structure
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (questions && questions.length > 0) {
    console.log('✅ Sample question columns:');
    console.log(Object.keys(questions[0]).join(', '));
    console.log('\n📋 Sample question data:');
    console.log(JSON.stringify(questions[0], null, 2));
  } else {
    console.log('⚠️  No questions found');
  }
}

checkColumns().catch(console.error);
