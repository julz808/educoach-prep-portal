-- COMPREHENSIVE DIAGNOSTIC QUERY for user fce34bfa-98d5-44ed-848d-b550c3e785bc
-- Run this to see exactly what data exists and why insights are showing 0

-- 1. Check all test sessions for this user
SELECT 
    'USER_TEST_SESSIONS' as table_name,
    id as session_id,
    section_name,
    test_mode,
    status,
    final_score,
    correct_answers,
    total_questions,
    questions_answered,
    created_at,
    completed_at
FROM user_test_sessions 
WHERE user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
AND test_mode = 'diagnostic'
ORDER BY created_at DESC;

-- 2. Check question attempts for the most recent diagnostic sessions
WITH recent_sessions AS (
    SELECT id, section_name, created_at
    FROM user_test_sessions 
    WHERE user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
    AND test_mode = 'diagnostic'
    AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 10
)
SELECT 
    'QUESTION_ATTEMPT_HISTORY' as table_name,
    qah.session_id,
    rs.section_name,
    rs.created_at,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN qah.is_correct = true THEN 1 END) as correct_attempts,
    COUNT(CASE WHEN qah.is_correct = false THEN 1 END) as incorrect_attempts,
    COUNT(CASE WHEN qah.is_correct IS NULL THEN 1 END) as null_attempts
FROM question_attempt_history qah
JOIN recent_sessions rs ON qah.session_id = rs.id
WHERE qah.user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
GROUP BY qah.session_id, rs.section_name, rs.created_at
ORDER BY rs.created_at DESC;

-- 3. Check if there are any question attempts at all for this user
SELECT 
    'TOTAL_QUESTION_ATTEMPTS' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_count,
    COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_count,
    COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as null_count,
    COUNT(DISTINCT session_id) as unique_sessions
FROM question_attempt_history
WHERE user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc';

-- 4. Check recent question attempts with details
SELECT 
    'RECENT_ATTEMPTS_DETAIL' as table_name,
    session_id,
    question_id,
    is_correct,
    time_spent_seconds,
    attempted_at
FROM question_attempt_history
WHERE user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
ORDER BY attempted_at DESC
LIMIT 20;