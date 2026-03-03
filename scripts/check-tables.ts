import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  // Try to find tables related to sessions
  const { data: tables, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND (tablename LIKE '%session%' OR tablename LIKE '%attempt%' OR tablename LIKE '%question%')
      ORDER BY tablename;
    `
  });

  if (error) {
    console.error('Error:', error);

    // Try alternative approach - check schema
    console.log('\nTrying to list all tables directly...\n');

    // Try common table names
    const tablesToCheck = [
      'test_sessions',
      'practice_test_sessions',
      'session',
      'sessions',
      'question_attempts',
      'question_attempt_history',
      'user_responses',
      'test_responses'
    ];

    for (const tableName of tablesToCheck) {
      const { data, error: checkError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!checkError) {
        console.log(`✓ Table exists: ${tableName}`);

        // Get column info
        const { data: columns } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = '${tableName}'
            ORDER BY ordinal_position;
          `
        });

        if (columns && columns.length > 0) {
          console.log('  Columns:', columns.map((c: any) => c.column_name).join(', '));
        }
      } else if (checkError.code !== '42P01') {
        console.log(`? Table might exist but error: ${tableName} - ${checkError.message}`);
      }
    }
  } else {
    console.log('Tables found:');
    console.log(JSON.stringify(tables, null, 2));
  }
}

checkTables().catch(console.error);
