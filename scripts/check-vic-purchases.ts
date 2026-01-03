import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVicPurchases() {
  console.log('🔍 Checking recent VIC selective entry purchases...\n');

  // Get recent purchases from user_products (completed purchases)
  const { data: completedPurchases, error: completedError } = await supabase
    .from('user_products')
    .select('*')
    .eq('product_type', 'vic-selective')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get recent pending purchases
  const { data: pendingPurchases, error: pendingError } = await supabase
    .from('pending_purchases')
    .select('*')
    .eq('product_type', 'vic-selective')
    .order('created_at', { ascending: false })
    .limit(5);

  const purchases = [...(completedPurchases || []), ...(pendingPurchases || [])];
  const purchasesError = completedError || pendingError;

  if (purchasesError) {
    console.error('❌ Error fetching purchases:', purchasesError);
    return;
  }

  console.log(`📊 Found ${purchases?.length || 0} VIC selective purchases\n`);

  console.log(`📦 Completed purchases: ${completedPurchases?.length || 0}`);
  console.log(`⏳ Pending purchases: ${pendingPurchases?.length || 0}\n`);

  if (completedPurchases && completedPurchases.length > 0) {
    console.log('=== COMPLETED PURCHASES ===\n');
    completedPurchases.forEach((purchase, index) => {
      console.log(`Purchase #${index + 1}:`);
      console.log(`  ID: ${purchase.id}`);
      console.log(`  User ID: ${purchase.user_id}`);
      console.log(`  Product: ${purchase.product_type}`);
      console.log(`  Amount: $${(purchase.amount_paid / 100).toFixed(2)} ${purchase.currency.toUpperCase()}`);
      console.log(`  Active: ${purchase.is_active}`);
      console.log(`  Purchased: ${new Date(purchase.purchased_at).toLocaleString()}`);
      console.log(`  Stripe Session: ${purchase.stripe_session_id}`);
      console.log('');
    });
  }

  if (pendingPurchases && pendingPurchases.length > 0) {
    console.log('=== PENDING PURCHASES ===\n');
    pendingPurchases.forEach((purchase, index) => {
      console.log(`Pending Purchase #${index + 1}:`);
      console.log(`  ID: ${purchase.id}`);
      console.log(`  Email: ${purchase.customer_email}`);
      console.log(`  Product: ${purchase.product_type}`);
      console.log(`  Amount: $${(purchase.amount_paid / 100).toFixed(2)} ${purchase.currency.toUpperCase()}`);
      console.log(`  Payment Status: ${purchase.payment_status}`);
      console.log(`  Processed: ${purchase.is_processed}`);
      console.log(`  Created: ${new Date(purchase.created_at).toLocaleString()}`);
      console.log(`  Stripe Session: ${purchase.stripe_session_id}`);
      console.log('');
    });

    // Get the most recent purchase details
    const latestPurchase = purchases[0];
    console.log('🎯 Most recent purchase details:');
    console.log(JSON.stringify(latestPurchase, null, 2));
  } else {
    console.log('⚠️  No VIC selective purchases found');
  }
}

checkVicPurchases().catch(console.error);
