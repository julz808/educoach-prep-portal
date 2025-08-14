import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.TNpEFgSITMB1ZBIfhQkmkpgudf5bfxH3vVqJPgHPLjY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileForSpecificUser() {
  // Simulate being logged in as one of the known users
  const userIds = [
    '6a82f695-c584-4618-b05f-fd5911718eb9', // Julz Ou
    '3028dc2a-30cf-4be3-9481-fdf76fd5a4c7'  // Ryan Ou
  ];

  for (const userId of userIds) {
    console.log(`\n🔍 Testing profile fetch for user ID: ${userId}`);
    
    try {
      // This simulates what the frontend code does
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ Error:', error);
      } else if (data && data.length > 0) {
        const profile = data[0];
        console.log('✅ Profile found:');
        console.log(`   Student: ${profile.student_first_name} ${profile.student_last_name}`);
        console.log(`   Year Level: ${profile.year_level}`);
        console.log(`   School: ${profile.school_name}`);
        console.log(`   Parent Email: ${profile.parent_email}`);
        console.log(`   Created: ${profile.created_at}`);
      } else {
        console.log('❌ No profile found for this user');
      }
    } catch (err) {
      console.error('💥 Unexpected error:', err);
    }
  }
}

testProfileForSpecificUser();