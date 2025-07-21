-- CLEAR ALL USER TEST ATTEMPTS AND QUESTION HISTORY
-- This script removes all test data while preserving user accounts and product access
-- Use this to reset all test data for fresh testing

-- WARNING: This will delete ALL test progress for ALL users
-- Make sure you want to do this before running!

-- First, let's check what columns exist in user_progress
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_progress'
ORDER BY ordinal_position;

BEGIN;

-- 1. Delete all question attempt history
DELETE FROM question_attempt_history;

-- 2. Delete all writing assessments (must be before test sessions due to foreign key)
DELETE FROM writing_assessments;

-- 3. Delete all test section states
DELETE FROM test_section_states;

-- 4. Delete all drill sessions
DELETE FROM drill_sessions;

-- 5. Delete all user sub-skill performance records
DELETE FROM user_sub_skill_performance;

-- 6. Delete all user test sessions (must be after writing assessments)
DELETE FROM user_test_sessions;

-- 7. Delete all user progress records (simpler than trying to reset)
-- They will be recreated automatically when users access products
DELETE FROM user_progress;

COMMIT;

-- Verify the cleanup by checking remaining data
SELECT 'Test Cleanup Complete' as status;

SELECT 
    'question_attempt_history' as table_name,
    COUNT(*) as records_remaining
FROM question_attempt_history
UNION ALL
SELECT 
    'user_test_sessions' as table_name,
    COUNT(*) as records_remaining
FROM user_test_sessions
UNION ALL
SELECT 
    'test_section_states' as table_name,
    COUNT(*) as records_remaining
FROM test_section_states
UNION ALL
SELECT 
    'drill_sessions' as table_name,
    COUNT(*) as records_remaining
FROM drill_sessions
UNION ALL
SELECT 
    'writing_assessments' as table_name,
    COUNT(*) as records_remaining
FROM writing_assessments
UNION ALL
SELECT 
    'user_sub_skill_performance' as table_name,
    COUNT(*) as records_remaining
FROM user_sub_skill_performance
UNION ALL
SELECT 
    'user_progress' as table_name,
    COUNT(*) as records_remaining
FROM user_progress;

-- Show what was preserved
SELECT 'Preserved Data:' as status;

SELECT 
    'user_profiles' as preserved_table,
    COUNT(*) as record_count
FROM user_profiles
UNION ALL
SELECT 
    'user_products' as preserved_table,
    COUNT(*) as record_count
FROM user_products
UNION ALL
SELECT 
    'questions' as preserved_table,
    COUNT(*) as record_count
FROM questions;