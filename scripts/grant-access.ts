import { createClient } from '@supabase/supabase-js';

// Hardcode the values for this emergency fix
const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function grantAccess(userEmail: string, productType: string) {
  try {
    // Find user by email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }

    const targetUser = user.users.find(u => u.email === userEmail);
    if (!targetUser) {
      console.error('❌ User not found:', userEmail);
      return;
    }

    console.log('👤 Found user:', targetUser.id, targetUser.email);

    // Check if access already exists
    const { data: existing } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', targetUser.id)
      .eq('product_type', productType)
      .single();

    if (existing) {
      console.log('✅ User already has access to this product');
      return;
    }

    // Grant access to the product
    const { data, error } = await supabase
      .from('user_products')
      .insert({
        user_id: targetUser.id,
        product_type: productType,
        is_active: true,
        purchased_at: new Date().toISOString(),
        stripe_session_id: 'manual_grant',
        amount_paid: 19900, // $199 AUD
        currency: 'aud'
      });

    if (error) {
      console.error('❌ Error granting access:', error);
      return;
    }

    console.log('✅ Access granted successfully!');
    console.log('Product:', productType);
    console.log('User:', userEmail);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get user email from command line arguments or use default
const userEmail = process.argv[2] || 'juliansunou@gmail.com';
const productType = process.argv[3] || 'ACER Scholarship (Year 7 Entry)';

console.log(`🚀 Granting access for: ${userEmail} to ${productType}`);
grantAccess(userEmail, productType);