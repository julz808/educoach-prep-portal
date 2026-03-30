import { supabase } from '../src/integrations/supabase/client';

async function copyV1toV2() {
  console.log('📋 Starting migration from questions → questions_v2...\n');

  // Step 1: Check if V2 table exists and is empty
  const { data: v2Data, error: v2Error } = await supabase
    .from('questions_v2')
    .select('id')
    .limit(1);

  if (v2Error) {
    console.error('❌ Error checking V2 table:', v2Error);
    console.log('💡 Make sure the questions_v2 table exists in your database');
    return;
  }

  if (v2Data && v2Data.length > 0) {
    console.log('⚠️  Warning: questions_v2 table already has data');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>(resolve => {
      readline.question('Do you want to delete existing data and re-import? (yes/no): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled');
      return;
    }

    // Delete existing data
    console.log('🗑️  Deleting existing data from questions_v2...');
    const { error: deleteError } = await supabase
      .from('questions_v2')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Error deleting data:', deleteError);
      return;
    }
  }

  // Step 2: Fetch all data from V1 table
  console.log('📥 Fetching data from questions table...');
  const { data: v1Questions, error: v1Error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at');

  if (v1Error) {
    console.error('❌ Error fetching V1 data:', v1Error);
    return;
  }

  console.log(`✅ Found ${v1Questions.length} questions in V1 table\n`);

  // Step 3: Copy data in batches (Supabase has a limit of ~1000 rows per insert)
  const batchSize = 500;
  let copied = 0;
  let failed = 0;

  for (let i = 0; i < v1Questions.length; i += batchSize) {
    const batch = v1Questions.slice(i, i + batchSize);
    console.log(`📤 Copying batch ${Math.floor(i / batchSize) + 1} (${batch.length} questions)...`);

    const { error: insertError } = await supabase
      .from('questions_v2')
      .insert(batch);

    if (insertError) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError);
      failed += batch.length;
    } else {
      copied += batch.length;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} copied successfully`);
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  Total questions in V1: ${v1Questions.length}`);
  console.log(`  Successfully copied: ${copied}`);
  console.log(`  Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now set VITE_USE_V2_QUESTIONS=true in your .env file');
  } else {
    console.log('\n⚠️  Migration completed with errors. Please check the logs above.');
  }

  // Also copy passages
  console.log('\n📋 Copying passages → passages_v2...');

  const { data: v1Passages, error: passageV1Error } = await supabase
    .from('passages')
    .select('*');

  if (passageV1Error) {
    console.error('❌ Error fetching passages:', passageV1Error);
    return;
  }

  console.log(`✅ Found ${v1Passages.length} passages in V1 table`);

  if (v1Passages.length > 0) {
    const { error: passageInsertError } = await supabase
      .from('passages_v2')
      .insert(v1Passages);

    if (passageInsertError) {
      console.error('❌ Error copying passages:', passageInsertError);
    } else {
      console.log(`✅ Copied ${v1Passages.length} passages successfully`);
    }
  }
}

copyV1toV2().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
