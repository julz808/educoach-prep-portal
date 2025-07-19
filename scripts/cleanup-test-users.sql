-- Test User Cleanup Script
-- Run this in Supabase SQL Editor to clean up test data

-- STEP 1: See what users exist
SELECT 
  au.id,
  au.email,
  au.created_at,
  up.student_first_name,
  up.student_last_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- STEP 2: Count related data for each user
SELECT 
  au.email,
  COUNT(DISTINCT up.id) as profiles,
  COUNT(DISTINCT uprog.id) as progress_records,
  COUNT(DISTINCT uprod.id) as purchased_products,
  COUNT(DISTINCT uts.id) as test_sessions
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN user_progress uprog ON au.id = uprog.user_id
LEFT JOIN user_products uprod ON au.id = uprod.user_id
LEFT JOIN user_test_sessions uts ON au.id = uts.user_id
GROUP BY au.id, au.email
ORDER BY au.created_at DESC;

-- STEP 3: Delete specific test user (REPLACE 'user_id_here' with actual ID)
-- Uncomment and modify as needed:

/*
-- Delete all user data for a specific user
DELETE FROM user_progress WHERE user_id = 'user_id_here';
DELETE FROM user_products WHERE user_id = 'user_id_here';
DELETE FROM user_test_sessions WHERE user_id = 'user_id_here';
DELETE FROM drill_sessions WHERE user_id = 'user_id_here';
DELETE FROM question_attempt_history WHERE user_id = 'user_id_here';
DELETE FROM user_sub_skill_performance WHERE user_id = 'user_id_here';
DELETE FROM test_section_states WHERE user_id = 'user_id_here';
DELETE FROM user_profiles WHERE user_id = 'user_id_here';
*/

-- STEP 4: Clean up users created in the last hour (for testing)
-- WARNING: This deletes recent test users - be careful!
/*
DELETE FROM user_progress 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE created_at > NOW() - INTERVAL '1 hour'
);

DELETE FROM user_products 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE created_at > NOW() - INTERVAL '1 hour'
);

DELETE FROM user_profiles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE created_at > NOW() - INTERVAL '1 hour'
);
*/