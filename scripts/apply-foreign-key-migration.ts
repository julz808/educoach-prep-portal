import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('\n🔧 APPLYING FOREIGN KEY MIGRATION\n');

  const sql = `
-- Drop the old foreign key constraint
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- Add new foreign key constraint pointing to questions_v2
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;
  `.trim();

  console.log('Executing SQL:\n');
  console.log(sql);
  console.log('\n');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error:', error);

    // Try executing each statement separately
    console.log('\nTrying statements separately...\n');

    const dropSql = 'ALTER TABLE question_attempt_history DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey';
    const { error: dropError } = await supabase.rpc('exec_sql', { sql_query: dropSql });

    if (dropError) {
      console.error('❌ Drop constraint error:', dropError);
    } else {
      console.log('✅ Dropped old constraint');
    }

    const addSql = `ALTER TABLE question_attempt_history ADD CONSTRAINT question_attempt_history_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions_v2(id) ON DELETE CASCADE`;
    const { error: addError } = await supabase.rpc('exec_sql', { sql_query: addSql });

    if (addError) {
      console.error('❌ Add constraint error:', addError);
    } else {
      console.log('✅ Added new constraint');
    }
  } else {
    console.log('✅ Migration applied successfully!');
  }
}

applyMigration().catch(console.error);
