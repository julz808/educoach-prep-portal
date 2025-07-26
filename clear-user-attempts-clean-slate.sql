-- CLEAR ALL USER ATTEMPTS AND RESULTS - CLEAN SLATE
-- 
-- This script clears all user attempt data while preserving:
-- ✅ User profiles and accounts
-- ✅ Questions and test content  
-- ✅ Product access permissions
-- ✅ System configuration
--
-- Only deletes: Test sessions, attempts, progress, and results

-- WARNING: This will reset ALL users to a clean slate - no progress will remain

-- STEP 1: Clear all test session data and attempts
DELETE FROM writing_assessments;
DELETE FROM question_attempt_history;
DELETE FROM test_section_states;
DELETE FROM user_test_sessions;
DELETE FROM drill_sessions;

-- STEP 2: Clear user progress and performance data
DELETE FROM user_sub_skill_performance;

-- STEP 3: Reset user progress counters (but keep user profiles)
UPDATE user_progress SET
    total_questions_attempted = 0,
    total_questions_correct = 0,
    overall_accuracy = 0.0,
    total_study_time_seconds = 0,
    diagnostic_completed = false,
    diagnostic_score = NULL,
    practice_tests_completed = 0,
    drill_sessions_completed = 0,
    last_activity_at = NOW(),
    updated_at = NOW();

-- VERIFICATION: Check what remains and what was cleared
SELECT 
    'CLEARED - writing_assessments' as status, 
    COUNT(*) as count 
FROM writing_assessments

UNION ALL

SELECT 
    'CLEARED - question_attempt_history', 
    COUNT(*) 
FROM question_attempt_history

UNION ALL

SELECT 
    'CLEARED - test_section_states', 
    COUNT(*) 
FROM test_section_states

UNION ALL

SELECT 
    'CLEARED - user_test_sessions', 
    COUNT(*) 
FROM user_test_sessions

UNION ALL

SELECT 
    'CLEARED - drill_sessions', 
    COUNT(*) 
FROM drill_sessions

UNION ALL

SELECT 
    'CLEARED - user_sub_skill_performance', 
    COUNT(*) 
FROM user_sub_skill_performance

UNION ALL

SELECT 
    'PRESERVED - user_profiles', 
    COUNT(*) 
FROM user_profiles

UNION ALL

SELECT 
    'PRESERVED - questions', 
    COUNT(*) 
FROM questions

UNION ALL

SELECT 
    'PRESERVED - user_products (access)', 
    COUNT(*) 
FROM user_products

UNION ALL

SELECT 
    'RESET - user_progress (counters only)', 
    COUNT(*) 
FROM user_progress

ORDER BY status;

-- Summary message
SELECT 
    CONCAT(
        'Clean slate complete! All user attempts, sessions, and progress cleared. ',
        'User accounts, questions, and product access preserved. ',
        'Users can now start fresh with all content available.'
    ) as summary;