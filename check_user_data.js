import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.TNpEFgSITMB1ZBIfhQkmkpgudf5bfxH3vVqJPgHPLjY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserData() {
  console.log('🔍 Checking data for juliansunou@gmail.com...\n');
  
  try {
    // Check user_profiles table schema and data
    console.log('📧 Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Error querying user_profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles.length} total profiles in database`);
      
      // Find profiles for juliansunou@gmail.com
      const julianProfiles = profiles.filter(p => p.parent_email === 'juliansunou@gmail.com');
      console.log(`📧 Found ${julianProfiles.length} profiles for juliansunou@gmail.com:`);
      julianProfiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. User ID: ${profile.user_id}`);
        console.log(`     Student: ${profile.student_first_name} ${profile.student_last_name}`);
        console.log(`     Year Level: ${profile.year_level}`);
        console.log(`     School: ${profile.school_name}`);
        console.log('');
      });
      
      // Show actual schema from first profile
      if (profiles.length > 0) {
        console.log('🗂️ Actual database schema (fields found):');
        Object.keys(profiles[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof profiles[0][key]}`);
        });
      }
    }
    
    // Check user_products table
    console.log('\n💳 Checking user_products table...');
    const { data: products, error: productsError } = await supabase
      .from('user_products')
      .select('*');
    
    if (productsError) {
      console.error('❌ Error querying user_products:', productsError);
    } else {
      console.log(`✅ Found ${products.length} total products purchased`);
      if (products.length > 0) {
        console.log('🛒 User products schema:');
        Object.keys(products[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof products[0][key]}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkUserData();