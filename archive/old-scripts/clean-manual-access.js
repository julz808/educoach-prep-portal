import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanManualAccess() {
  const userId = '2c2e5c44-d953-48bc-89d7-52b8333edbda';
  
  console.log('🧹 Removing manual Year 7 NAPLAN access record...');
  
  // Remove the manual grant I created
  const { data, error } = await supabase
    .from('user_products')
    .delete()
    .eq('user_id', userId)
    .eq('product_type', 'Year 7 NAPLAN')
    .eq('stripe_session_id', 'manual_grant_year7_naplan_1753365253045');
    
  if (error) {
    console.error('❌ Error removing manual access:', error);
  } else {
    console.log('✅ Manual access record removed');
  }
  
  // Verify it's gone
  const { data: verifyData, error: verifyError } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', 'Year 7 NAPLAN')
    .eq('is_active', true);
    
  if (verifyError) {
    console.error('❌ Error verifying removal:', verifyError);
  } else {
    console.log(`✅ Verification - Year 7 NAPLAN records remaining: ${verifyData.length}`);
    if (verifyData.length > 0) {
      verifyData.forEach(record => {
        console.log(`   - Session: ${record.stripe_session_id}`);
      });
    }
  }
}

cleanManualAccess().then(() => process.exit(0)).catch(console.error);