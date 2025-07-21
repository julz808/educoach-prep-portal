-- CLEAR ALL USER TEST ATTEMPTS AND QUESTION HISTORY
-- This script removes all test data while preserving user accounts and product access
-- Use this to reset all test data for fresh testing

-- WARNING: This will delete ALL test progress for ALL users
-- Make sure you want to do this before running!

DO $$
DECLARE
    deleted_attempts INTEGER;
    deleted_sessions INTEGER;
    deleted_section_states INTEGER;
    deleted_drill_sessions INTEGER;
    deleted_progress INTEGER;
    deleted_writing INTEGER;
    deleted_sub_skill_perf INTEGER;
BEGIN
    RAISE NOTICE 'Starting test data cleanup...';
    
    -- 1. Delete all question attempt history
    DELETE FROM question_attempt_history;
    GET DIAGNOSTICS deleted_attempts = ROW_COUNT;
    RAISE NOTICE 'Deleted % question attempt records', deleted_attempts;
    
    -- 2. Delete all writing assessments (must be before test sessions due to foreign key)
    DELETE FROM writing_assessments;
    GET DIAGNOSTICS deleted_writing = ROW_COUNT;
    RAISE NOTICE 'Deleted % writing assessment records', deleted_writing;
    
    -- 3. Delete all test section states
    DELETE FROM test_section_states;
    GET DIAGNOSTICS deleted_section_states = ROW_COUNT;
    RAISE NOTICE 'Deleted % test section state records', deleted_section_states;
    
    -- 4. Delete all drill sessions
    DELETE FROM drill_sessions;
    GET DIAGNOSTICS deleted_drill_sessions = ROW_COUNT;
    RAISE NOTICE 'Deleted % drill session records', deleted_drill_sessions;
    
    -- 5. Delete all user sub-skill performance records
    DELETE FROM user_sub_skill_performance;
    GET DIAGNOSTICS deleted_sub_skill_perf = ROW_COUNT;
    RAISE NOTICE 'Deleted % user sub-skill performance records', deleted_sub_skill_perf;
    
    -- 6. Delete all user test sessions (must be after writing assessments)
    DELETE FROM user_test_sessions;
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
    RAISE NOTICE 'Deleted % user test session records', deleted_sessions;
    
    -- 7. Reset all user progress (but keep the records with zero values)
    UPDATE user_progress SET
        questions_attempted = 0,
        questions_correct = 0,
        overall_accuracy = 0,
        study_time_seconds = 0,
        diagnostic_completed = false,
        practice_tests_completed = ARRAY[]::INTEGER[],
        last_activity = NOW(),
        updated_at = NOW();
    GET DIAGNOSTICS deleted_progress = ROW_COUNT;
    RAISE NOTICE 'Reset % user progress records', deleted_progress;
    
    RAISE NOTICE 'Test data cleanup completed successfully!';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Question attempts deleted: %', deleted_attempts;
    RAISE NOTICE '- Writing assessments deleted: %', deleted_writing;
    RAISE NOTICE '- Test sessions deleted: %', deleted_sessions;
    RAISE NOTICE '- Section states deleted: %', deleted_section_states;
    RAISE NOTICE '- Drill sessions deleted: %', deleted_drill_sessions;
    RAISE NOTICE '- Sub-skill performance deleted: %', deleted_sub_skill_perf;
    RAISE NOTICE '- User progress reset: %', deleted_progress;
    RAISE NOTICE '';
    RAISE NOTICE 'What was preserved:';
    RAISE NOTICE '- User accounts and profiles';
    RAISE NOTICE '- Product access (user_products)';
    RAISE NOTICE '- Questions and curriculum data';
    RAISE NOTICE '- All system configuration';
    
END $$;

-- Verify the cleanup by checking remaining data
SELECT 
    'VERIFICATION' as table_name,
    'question_attempt_history' as table_type,
    COUNT(*) as remaining_records
FROM question_attempt_history

UNION ALL

SELECT 
    'VERIFICATION' as table_name,
    'user_test_sessions' as table_type,
    COUNT(*) as remaining_records
FROM user_test_sessions

UNION ALL

SELECT 
    'VERIFICATION' as table_name,
    'test_section_states' as table_type,
    COUNT(*) as remaining_records
FROM test_section_states

UNION ALL

SELECT 
    'VERIFICATION' as table_name,
    'drill_sessions' as table_type,
    COUNT(*) as remaining_records
FROM drill_sessions

UNION ALL

SELECT 
    'VERIFICATION' as table_name,
    'writing_assessments' as table_type,
    COUNT(*) as remaining_records
FROM writing_assessments

UNION ALL

SELECT 
    'VERIFICATION' as table_name,
    'user_sub_skill_performance' as table_type,
    COUNT(*) as remaining_records
FROM user_sub_skill_performance

UNION ALL

SELECT 
    'VERIFICATION' as table_name,
    'user_progress_reset' as table_type,
    COUNT(*) as remaining_records
FROM user_progress
WHERE questions_attempted = 0 AND questions_correct = 0;

-- Show preserved data
SELECT 
    'PRESERVED' as table_name,
    'user_profiles' as table_type,
    COUNT(*) as preserved_records
FROM user_profiles

UNION ALL

SELECT 
    'PRESERVED' as table_name,
    'user_products' as table_type,
    COUNT(*) as preserved_records
FROM user_products

UNION ALL

SELECT 
    'PRESERVED' as table_name,
    'questions' as table_type,
    COUNT(*) as preserved_records
FROM questions;