import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllPurchases() {
  console.log('🔍 Checking ALL recent purchases...\n');

  // Get recent completed purchases
  const { data: completedPurchases, error: completedError } = await supabase
    .from('user_products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get recent pending purchases
  const { data: pendingPurchases, error: pendingError } = await supabase
    .from('pending_purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (completedError) {
    console.error('❌ Error fetching completed purchases:', completedError);
  }

  if (pendingError) {
    console.error('❌ Error fetching pending purchases:', pendingError);
  }

  console.log(`📦 Total completed purchases: ${completedPurchases?.length || 0}`);
  console.log(`⏳ Total pending purchases: ${pendingPurchases?.length || 0}\n`);

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
      console.log(`  Stripe Session: ${purchase.stripe_session_id || 'N/A'}`);
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
      console.log(`  Expires: ${new Date(purchase.expires_at).toLocaleString()}`);
      console.log(`  Stripe Session: ${purchase.stripe_session_id}`);
      console.log('');
    });
  }

  // Show unique product types
  const completedProductTypes = new Set(completedPurchases?.map(p => p.product_type) || []);
  const pendingProductTypes = new Set(pendingPurchases?.map(p => p.product_type) || []);

  console.log('\n📋 Product Types Found:');
  console.log('  Completed:', Array.from(completedProductTypes).join(', ') || 'None');
  console.log('  Pending:', Array.from(pendingProductTypes).join(', ') || 'None');
}

checkAllPurchases().catch(console.error);
