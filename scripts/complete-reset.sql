-- COMPLETE DATABASE RESET - USE WITH CAUTION
-- This will delete ALL user data and cannot be undone

-- Delete from dependent tables first (in order)
DELETE FROM user_products;
DELETE FROM writing_assessments;
DELETE FROM question_attempt_history;
DELETE FROM drill_sessions;
DELETE FROM test_section_states;
DELETE FROM user_test_sessions;
DELETE FROM user_sub_skill_performance;
DELETE FROM user_progress;
DELETE FROM user_profiles;

-- Finally delete auth users
DELETE FROM auth.users;

-- Verify everything is clean
SELECT 'user_products' as table_name, COUNT(*) as count FROM user_products
UNION ALL
SELECT 'writing_assessments', COUNT(*) FROM writing_assessments
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;