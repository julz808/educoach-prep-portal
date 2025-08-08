import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  // Check what tables exist
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_schema_tables');
  
  if (tablesError) {
    // Try direct SQL query instead
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('Checking tables manually...');
      
      // Check specific tables
      const tablesToCheck = ['profiles', 'user_products', 'pending_purchases', 'user_test_sessions'];
      
      for (const table of tablesToCheck) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1);
          if (error) {
            console.log(`❌ Table '${table}' - Error: ${error.message}`);
          } else {
            console.log(`✅ Table '${table}' exists`);
          }
        } catch (e) {
          console.log(`❌ Table '${table}' - Exception: ${e.message}`);
        }
      }
    }
  }

  // Check user_products specifically
  console.log('\n🔍 Checking user_products table structure...');
  try {
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .limit(0); // Just get schema, no data
    
    if (error) {
      console.log('❌ user_products error:', error.message);
    } else {
      console.log('✅ user_products table accessible');
    }
  } catch (e) {
    console.log('❌ user_products exception:', e.message);
  }

  // Check for user with the correct user_id
  console.log('\n🔍 Checking direct user_products access...');
  const userId = 'c9435b2d-4548-4127-a7b7-24d873c9d695';
  
  try {
    const { data: userProducts, error: productsError } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId);
    
    if (productsError) {
      console.log('❌ Direct user_products query error:', productsError.message);
    } else {
      console.log(`✅ Found ${userProducts.length} products for user:`, userProducts);
    }
  } catch (e) {
    console.log('❌ Direct user_products query exception:', e.message);
  }
}

checkSchema().catch(console.error);