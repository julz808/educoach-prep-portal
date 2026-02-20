import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking available tables...\n');

  // Query to get all tables
  const { data: tables, error } = await supabase.rpc('exec_sql', {
    sql: `SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name LIKE '%question%'
          ORDER BY table_name;`
  }).select();

  if (error) {
    // Try alternative method
    console.log('Trying alternative method...');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);

    if (!questionsError) {
      console.log('✅ Found "questions" table');

      // Check for visual questions
      const { data: visualQuestions, error: visualError } = await supabase
        .from('questions')
        .select('*')
        .not('visual_content', 'is', null)
        .limit(5);

      if (!visualError && visualQuestions) {
        console.log(`✅ Found ${visualQuestions.length} sample visual questions in "questions" table`);
        console.log('\nSample question structure:');
        if (visualQuestions.length > 0) {
          console.log(JSON.stringify(Object.keys(visualQuestions[0]), null, 2));
        }
      }
    } else {
      console.log('❌ "questions" table not found:', questionsError);
    }
  } else {
    console.log('Tables:', tables);
  }
}

checkTables().catch(console.error);
