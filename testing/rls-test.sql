-- RLS Policy Testing Script for EduCourse
-- This script tests that users cannot access each other's data

-- NOTE: This script requires TWO test users to be created first
-- Create test users in Supabase Auth before running this script

-- SETUP INSTRUCTIONS:
-- 1. Create two test users in Supabase Auth:
--    - testuser1@example.com
--    - testuser2@example.com
-- 2. Get their user IDs from auth.users table
-- 3. Replace the UUIDs below with actual user IDs
-- 4. Run this script as different users to test isolation

-- Test user IDs (REPLACE WITH ACTUAL USER IDs)
-- User 1: Replace with actual UUID
-- User 2: Replace with actual UUID

-- Test 1: Create test data for both users
-- Run this as admin/service role to insert test data

-- Insert test profiles for both users
INSERT INTO user_profiles (user_id, display_name, student_first_name, student_last_name, parent_first_name, parent_last_name, school_name, year_level)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test Student 1', 'Test', 'Student1', 'Test', 'Parent1', 'Test School 1', 7),
  ('00000000-0000-0000-0000-000000000002', 'Test Student 2', 'Test', 'Student2', 'Test', 'Parent2', 'Test School 2', 8);

-- Insert test progress for both users
INSERT INTO user_progress (user_id, product_type, total_questions_completed, total_questions_attempted, total_questions_correct)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'VIC Selective Entry (Year 9 Entry)', 50, 60, 45),
  ('00000000-0000-0000-0000-000000000002', 'NSW Selective Entry (Year 7 Entry)', 30, 40, 25);

-- Insert test sessions for both users
INSERT INTO user_test_sessions (user_id, product_type, test_mode, status, total_questions, questions_answered, correct_answers, final_score)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'VIC Selective Entry (Year 9 Entry)', 'diagnostic', 'completed', 20, 20, 15, 75.0),
  ('00000000-0000-0000-0000-000000000002', 'NSW Selective Entry (Year 7 Entry)', 'diagnostic', 'completed', 25, 25, 20, 80.0);

-- Test 2: Data isolation tests
-- These queries should be run while authenticated as each test user
-- Each user should only see their own data

-- Test as User 1 (testuser1@example.com)
-- Should only return User 1's data:

SELECT 'USER_PROFILES_TEST_USER1' as test_name, user_id, display_name 
FROM user_profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: 1 row (User 1's profile)

SELECT 'USER_PROFILES_ALL_AS_USER1' as test_name, COUNT(*) as visible_profiles
FROM user_profiles;
-- Expected: 1 (should only see own profile)

SELECT 'USER_PROGRESS_TEST_USER1' as test_name, user_id, product_type, total_questions_completed
FROM user_progress
WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: 1 row (User 1's progress)

SELECT 'USER_PROGRESS_ALL_AS_USER1' as test_name, COUNT(*) as visible_progress
FROM user_progress;
-- Expected: 1 (should only see own progress)

-- Test as User 2 (testuser2@example.com)  
-- Should only return User 2's data:

SELECT 'USER_PROFILES_TEST_USER2' as test_name, user_id, display_name
FROM user_profiles
WHERE user_id = '00000000-0000-0000-0000-000000000002';
-- Expected: 1 row (User 2's profile)

SELECT 'USER_PROFILES_ALL_AS_USER2' as test_name, COUNT(*) as visible_profiles
FROM user_profiles;
-- Expected: 1 (should only see own profile)

-- Test 3: Cross-user access attempts
-- These should return NO data when run as the wrong user

-- Run as User 1, try to access User 2's data:
SELECT 'CROSS_ACCESS_TEST_1_TO_2' as test_name, COUNT(*) as should_be_zero
FROM user_profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000002';
-- Expected: 0 (User 1 cannot see User 2's profile)

-- Run as User 2, try to access User 1's data:
SELECT 'CROSS_ACCESS_TEST_2_TO_1' as test_name, COUNT(*) as should_be_zero
FROM user_profiles
WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: 0 (User 2 cannot see User 1's profile)

-- Test 4: Reference table access
-- Both users should be able to read questions and other reference data

SELECT 'QUESTIONS_ACCESS_TEST' as test_name, COUNT(*) as total_questions
FROM questions
LIMIT 1;
-- Expected: Should work for both users (reference data is readable)

-- Test 5: Insert/Update restrictions
-- Users should not be able to insert/update data for other users

-- This should FAIL when run as User 1 (trying to insert for User 2):
-- INSERT INTO user_progress (user_id, product_type) 
-- VALUES ('00000000-0000-0000-0000-000000000002', 'Test Product');
-- Expected: Policy violation error

-- Test 6: Complex relationship tests
-- Test that test_section_states properly restricts access based on session ownership

-- Insert test session for User 1
INSERT INTO user_test_sessions (user_id, product_type, test_mode, status, total_questions)
VALUES ('00000000-0000-0000-0000-000000000001', 'VIC Selective Entry (Year 9 Entry)', 'practice', 'active', 20)
RETURNING id as session_id;

-- Insert section state for that session
-- (Use the session_id from above)
INSERT INTO test_section_states (test_session_id, section_name, status, current_question_index)
VALUES ('SESSION_ID_FROM_ABOVE', 'Reading Comprehension', 'in_progress', 0);

-- Test that User 2 cannot see User 1's section states
SELECT 'SECTION_STATES_ISOLATION_TEST' as test_name, COUNT(*) as should_be_zero
FROM test_section_states tss
JOIN user_test_sessions uts ON tss.test_session_id = uts.id
WHERE uts.user_id = '00000000-0000-0000-0000-000000000001';
-- Expected: 0 when run as User 2, >0 when run as User 1

-- Test 7: Cleanup (run as admin)
-- DELETE FROM user_profiles WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
-- DELETE FROM user_progress WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
-- DELETE FROM user_test_sessions WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- TESTING CHECKLIST:
-- □ Created two test users in Supabase Auth
-- □ Replaced UUIDs in this script with actual user IDs
-- □ Ran setup queries as admin
-- □ Tested queries as User 1 - sees only own data
-- □ Tested queries as User 2 - sees only own data  
-- □ Tested cross-access attempts - return zero results
-- □ Tested reference table access - works for both users
-- □ Tested insert restrictions - policy violations occur
-- □ Tested complex relationships - proper isolation
-- □ Cleaned up test data

-- SUCCESS CRITERIA:
-- ✅ Each user sees only their own data
-- ✅ Cross-user access attempts return no data
-- ✅ Reference tables readable by all authenticated users
-- ✅ Insert/update attempts for other users fail with policy violation
-- ✅ Complex relationships properly enforce user isolation