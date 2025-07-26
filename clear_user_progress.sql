-- Clear All User Progress Script
-- This script removes all test-taking data, progress, and insights while preserving user accounts
-- Run this script in your Supabase SQL editor

-- WARNING: This will permanently delete all user progress data!
-- Make sure you have a backup if you need to restore this data later

-- Count records before deletion for reference
SELECT 
    'BEFORE CLEANUP - Record Counts:' as status,
    (SELECT COUNT(*) FROM user_test_sessions) as test_sessions,
    (SELECT COUNT(*) FROM test_section_states) as section_states,
    (SELECT COUNT(*) FROM drill_sessions) as drill_sessions,
    (SELECT COUNT(*) FROM question_attempt_history) as question_attempts,
    (SELECT COUNT(*) FROM writing_assessments) as writing_assessments,
    (SELECT COUNT(*) FROM user_sub_skill_performance) as sub_skill_performance,
    (SELECT COUNT(*) FROM user_profiles) as user_profiles_preserved;

-- 1. Clear all writing assessments (must be first due to foreign key to user_test_sessions)
DELETE FROM writing_assessments;

-- 2. Clear all question attempt history
DELETE FROM question_attempt_history;

-- 3. Clear all test section states
DELETE FROM test_section_states;

-- 4. Clear all test session data (diagnostic, practice, some drill sessions)
DELETE FROM user_test_sessions;

-- 5. Clear all drill sessions
DELETE FROM drill_sessions;

-- 6. Clear all sub-skill performance data
DELETE FROM user_sub_skill_performance;

-- 7. Reset user progress data (but keep user profiles)
UPDATE user_progress SET
    completed_diagnostic = false,
    diagnostic_accuracy = 0,
    diagnostic_study_time = 0,
    total_study_time = 0,
    practice_tests_completed = 0,
    practice_test_accuracy = 0,
    practice_test_study_time = 0,
    drill_sessions_completed = 0,
    drill_accuracy = 0,
    drill_study_time = 0,
    last_activity_at = NOW(),
    updated_at = NOW()
WHERE id IS NOT NULL;

-- 8. Display summary of what was cleared
SELECT 
    'AFTER CLEANUP - Verification:' as status,
    (SELECT COUNT(*) FROM user_profiles) as users_preserved,
    (SELECT COUNT(*) FROM user_test_sessions) as remaining_test_sessions,
    (SELECT COUNT(*) FROM test_section_states) as remaining_section_states,
    (SELECT COUNT(*) FROM drill_sessions) as remaining_drill_sessions,
    (SELECT COUNT(*) FROM question_attempt_history) as remaining_question_attempts,
    (SELECT COUNT(*) FROM writing_assessments) as remaining_writing_assessments,
    (SELECT COUNT(*) FROM user_sub_skill_performance) as remaining_sub_skill_performance,
    (SELECT COUNT(*) FROM user_progress WHERE 
        completed_diagnostic = true OR 
        practice_tests_completed > 0 OR 
        drill_sessions_completed > 0) as users_with_remaining_progress;

-- Verification queries - run these to confirm the cleanup worked
-- SELECT COUNT(*) as user_profiles_count FROM user_profiles;
-- SELECT COUNT(*) as test_sessions_count FROM user_test_sessions;
-- SELECT COUNT(*) as drill_sessions_count FROM drill_sessions;
-- SELECT COUNT(*) as question_attempts_count FROM question_attempt_history;
-- SELECT COUNT(*) as writing_assessments_count FROM writing_assessments;
-- SELECT COUNT(*) as sub_skill_performance_count FROM user_sub_skill_performance;
-- SELECT 
--     COUNT(*) as total_users,
--     COUNT(*) FILTER (WHERE completed_diagnostic = true) as users_with_diagnostic,
--     COUNT(*) FILTER (WHERE practice_tests_completed > 0) as users_with_practice,
--     COUNT(*) FILTER (WHERE drill_sessions_completed > 0) as users_with_drills
-- FROM user_progress;