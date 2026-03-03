/**
 * Apply the writing assessment foreign key fix
 * This script removes the foreign key constraint that prevents storing
 * assessments for dynamically generated writing questions
 */

import { createClient } from '@supabase/supabase-js';

async function applyFix() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('  - VITE_SUPABASE_URL:', !!supabaseUrl);
    console.error('  - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    console.error('\n📝 Make sure these are set in your .env file');
    process.exit(1);
  }

  console.log('🔧 Connecting to Supabase with service role key...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // The SQL to execute
  const sql = `
-- Remove foreign key constraint to allow dynamic question IDs
ALTER TABLE writing_assessments
  DROP CONSTRAINT IF EXISTS writing_assessments_question_id_fkey;

-- Add comment explaining the change
COMMENT ON COLUMN writing_assessments.question_id IS
  'UUID of the question - may reference questions, questions_v2, or be a dynamically generated question ID';
`;

  console.log('\n📝 SQL to execute:');
  console.log(sql);
  console.log('\n⚠️  WARNING: This will modify your database schema.');
  console.log('⚠️  Make sure you understand what this does before proceeding.\n');

  // For safety, we'll just log what would be done
  // To actually execute, uncomment the code below

  console.log('✅ Script completed successfully (dry run)');
  console.log('\n📋 To apply this fix:');
  console.log('   1. Go to your Supabase dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Run the SQL shown above');
  console.log('   4. Or use: npx supabase db push (if using migrations)');

  /* UNCOMMENT TO ACTUALLY EXECUTE:
  try {
    const { error } = await supabase.rpc('exec', { sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      process.exit(1);
    }

    console.log('✅ Foreign key constraint removed successfully!');
    console.log('✅ Writing assessments can now be stored for any question ID');
  } catch (error) {
    console.error('❌ Failed to execute SQL:', error);
    process.exit(1);
  }
  */
}

applyFix();
