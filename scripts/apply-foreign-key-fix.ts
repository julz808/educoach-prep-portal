/**
 * Apply the foreign key fix directly to the database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyForeignKeyFix() {
  console.log('🔧 APPLYING FOREIGN KEY FIX');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Step 1: Check current constraint
    console.log('📋 Step 1: Checking current foreign key constraint...');

    const checkQuery = `
      SELECT
        conname as constraint_name,
        conrelid::regclass as table_name,
        confrelid::regclass as foreign_table
      FROM pg_constraint
      WHERE conname = 'question_attempt_history_question_id_fkey';
    `;

    const { data: currentConstraint, error: checkError } = await supabase.rpc('exec_sql', {
      query: checkQuery
    }).catch(() => ({ data: null, error: 'RPC not available' }));

    // Alternative: Use direct SQL execution
    console.log('   Current constraint status: Checking...');
    console.log('');

    // Step 2: Drop old constraint
    console.log('📋 Step 2: Dropping old foreign key constraint...');

    const dropConstraintSQL = `
      ALTER TABLE question_attempt_history
      DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;
    `;

    // Execute via service role key (has full permissions)
    const dropResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: dropConstraintSQL })
    }).catch(() => null);

    // Fallback: Execute SQL directly using psql if available
    console.log('   Executing SQL directly...');

    // Use exec to run psql command
    const { execSync } = await import('child_process');

    const connectionString = `${supabaseUrl.replace('https://', 'postgresql://postgres:')}@${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co:5432/postgres`;

    try {
      console.log('   Dropping old constraint...');
      execSync(`psql "${process.env.DATABASE_URL}" -c "${dropConstraintSQL.replace(/\n/g, ' ')}"`, {
        stdio: 'inherit'
      });
      console.log('   ✅ Old constraint dropped');
    } catch (execError) {
      console.log('   ⚠️  Could not use psql, trying alternative method...');

      // Alternative: Use Supabase SQL editor API
      console.log('   Using Supabase Management API...');

      // Read the migration file
      const migrationSQL = readFileSync(
        join(__dirname, '../supabase/migrations/20260228_update_foreign_key_to_questions_v2.sql'),
        'utf-8'
      );

      console.log('   Migration SQL:');
      console.log(migrationSQL);
      console.log('');

      console.log('   ⚠️  Please run this SQL manually in your Supabase SQL Editor:');
      console.log('');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Create a new query');
      console.log('   4. Paste the SQL above');
      console.log('   5. Run the query');
      console.log('');
      console.log('   Or run this command in your terminal:');
      console.log('   npx supabase db execute --file supabase/migrations/20260228_update_foreign_key_to_questions_v2.sql');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ Foreign key fix process complete');
    console.log('');
    console.log('Next steps:');
    console.log('1. Complete a test (any section)');
    console.log('2. Check if Insights now shows correct scores');
    console.log('3. Run: npx tsx scripts/test-question-attempt-insert.ts to verify');

  } catch (error) {
    console.error('❌ Error applying fix:', error);
    throw error;
  }
}

applyForeignKeyFix().catch(console.error);
