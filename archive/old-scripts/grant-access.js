import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function grantAccess() {
  const userId = '2c2e5c44-d953-48bc-89d7-52b8333edbda';
  
  console.log('🔑 Granting Year 7 NAPLAN access to user:', userId);
  
  const { data, error } = await supabase
    .from('user_products')
    .insert({
      user_id: userId,
      product_type: 'Year 7 NAPLAN',
      purchased_at: new Date().toISOString(),
      is_active: true,
      stripe_session_id: 'manual_grant_year7_naplan_' + Date.now(),
      amount_paid: 19900,
      currency: 'aud'
    });
    
  if (error) {
    console.error('❌ Error granting access:', error);
  } else {
    console.log('✅ Access granted successfully:', data);
  }
  
  // Verify access was granted
  const { data: verifyData, error: verifyError } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', 'Year 7 NAPLAN')
    .eq('is_active', true);
    
  if (verifyError) {
    console.error('❌ Error verifying access:', verifyError);
  } else {
    console.log('✅ Verification - Year 7 NAPLAN access:', verifyData);
  }
}

grantAccess().then(() => process.exit(0)).catch(console.error);