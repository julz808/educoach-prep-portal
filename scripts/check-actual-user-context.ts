import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserContext() {
  console.log('\n=== CHECKING ALL USERS WITH YEAR 5 NAPLAN DATA ===\n');

  // Find all users who have Year 5 NAPLAN data
  const { data: allUsers, error } = await supabase
    .from('user_test_sessions')
    .select('user_id, product_type')
    .eq('product_type', 'Year 5 NAPLAN');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Group by user_id
  const userMap = new Map<string, number>();
  allUsers?.forEach((row: any) => {
    const count = userMap.get(row.user_id) || 0;
    userMap.set(row.user_id, count + 1);
  });

  console.log(`Found ${userMap.size} users with Year 5 NAPLAN data:\n`);

  for (const [userId, sessionCount] of userMap.entries()) {
    console.log(`User: ${userId}`);
    console.log(`  Sessions: ${sessionCount}`);

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('student_first_name, student_last_name, parent_email')
      .eq('user_id', userId)
      .single();

    if (profile) {
      console.log(`  Name: ${profile.student_first_name} ${profile.student_last_name}`);
      console.log(`  Email: ${profile.parent_email || 'N/A'}`);
    }

    // Get auth user
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    if (authData?.user) {
      console.log(`  Auth Email: ${authData.user.email}`);
    }

    console.log('');
  }

  // Check for any question_attempt_history entries
  console.log('\n=== CHECKING QUESTION ATTEMPTS ===\n');
  const { data: attempts } = await supabase
    .from('question_attempt_history')
    .select('user_id, session_type')
    .limit(100);

  const attemptUsers = new Set(attempts?.map((a: any) => a.user_id) || []);
  console.log(`Found ${attemptUsers.size} users with question attempts`);
  attemptUsers.forEach(userId => {
    const count = attempts?.filter((a: any) => a.user_id === userId).length || 0;
    console.log(`  ${userId}: ${count} attempts`);
  });
}

checkUserContext().catch(console.error);
