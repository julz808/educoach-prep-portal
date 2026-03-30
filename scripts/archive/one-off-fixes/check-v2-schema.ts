import { supabase } from '../src/integrations/supabase/client';

async function checkV2Schema() {
  console.log('🔍 Checking questions_v2 table schema...\n');

  // Try to describe the table by attempting an empty insert (will show required columns in error)
  const { error } = await supabase
    .from('questions_v2')
    .insert({});

  if (error) {
    console.log('Error from empty insert (shows schema info):', error);
  }

  // Try to select with limit 0 to see column names
  const { data, error: selectError } = await supabase
    .from('questions_v2')
    .select('*')
    .limit(0);

  console.log('\n📊 Select query result:');
  console.log('  Data:', data);
  console.log('  Error:', selectError);

  // Check if table exists by trying a simple count
  const { count, error: countError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  console.log('\n📈 Count query result:');
  console.log('  Count:', count);
  console.log('  Error:', countError);

  // Also check questions table (V1) for comparison
  const { data: v1Sample, error: v1Error } = await supabase
    .from('questions')
    .select('*')
    .limit(1);

  if (!v1Error && v1Sample && v1Sample.length > 0) {
    console.log('\n📋 Sample V1 question columns:');
    console.log('  Columns:', Object.keys(v1Sample[0]).join(', '));
  }
}

checkV2Schema().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
