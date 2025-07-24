import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debugPurchase() {
  const userId = '2c2e5c44-d953-48bc-89d7-52b8333edbda';
  
  console.log('🔍 Checking user_products for user:', userId);
  
  // Check user_products table
  const { data: userProducts, error: productsError } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (productsError) {
    console.error('❌ Error querying user_products:', productsError);
  } else {
    console.log('✅ User products:', userProducts);
  }
  
  // Check specifically for Year 7 NAPLAN
  const { data: naplanAccess, error: naplanError } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .eq('product_type', 'Year 7 NAPLAN')
    .eq('is_active', true);
    
  if (naplanError) {
    console.error('❌ Error checking Year 7 NAPLAN access:', naplanError);
  } else {
    console.log('✅ Year 7 NAPLAN access:', naplanAccess);
  }
  
  // Check recent webhook logs by looking for any recent user_products entries
  const { data: recentPurchases, error: recentError } = await supabase
    .from('user_products')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });
    
  if (recentError) {
    console.error('❌ Error checking recent purchases:', recentError);
  } else {
    console.log('✅ Recent purchases (last 24h):', recentPurchases);
  }
}

debugPurchase().then(() => process.exit(0)).catch(console.error);