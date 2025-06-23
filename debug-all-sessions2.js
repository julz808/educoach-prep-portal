// Debug script to check ALL sessions in database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugAllSessions() {
  console.log('🔍 Checking ALL sessions in database...\n');

  try {
    // Check total count of sessions
    const { count, error: countError } = await supabase
      .from('user_test_sessions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting sessions:', countError);
      return;
    }

    console.log(`Total sessions in database: ${count}`);

    if (count > 0) {
      // Get the most recent sessions (up to 10)
      const { data: recentSessions, error: sessionError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionError) {
        console.error('Error fetching recent sessions:', sessionError);
        return;
      }

      console.log('\nMost recent sessions:');
      recentSessions?.forEach(session => {
        console.log('  -', {
          id: session.id.substring(0, 8) + '...',
          user_id: session.user_id.substring(0, 8) + '...',
          product_type: session.product_type,
          test_mode: session.test_mode,
          section_name: session.section_name,
          status: session.status,
          created_at: session.created_at?.substring(0, 16)
        });
      });

      // Check unique user IDs
      const { data: userIds } = await supabase
        .from('user_test_sessions')
        .select('user_id')
        .limit(100);

      const uniqueUserIds = [...new Set(userIds?.map(s => s.user_id))];
      console.log(`\nUnique user IDs found (${uniqueUserIds.length}):`);
      uniqueUserIds.forEach(id => {
        console.log('  -', id.substring(0, 8) + '...');
      });
    }

    // Also check if user is authenticated correctly
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Error getting auth user:', authError);
    } else {
      console.log('\nCurrent authenticated user:');
      console.log('  ID:', authUser.user?.id);
      console.log('  Email:', authUser.user?.email);
    }

  } catch (error) {
    console.error('Error in debug script:', error);
  }
}

debugAllSessions().catch(console.error);