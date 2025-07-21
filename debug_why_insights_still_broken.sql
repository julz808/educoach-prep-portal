-- COMPREHENSIVE DEBUG: WHY ARE INSIGHTS STILL SHOWING 0%?
-- Run this after completing a new diagnostic test

-- 1. Check if save_question_attempt is actually being called (look for recent attempts)
SELECT 
    'RECENT QUESTION ATTEMPTS' as check_type,
    COUNT(*) as total_recent_attempts,
    COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_attempts,
    COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_attempts,
    MAX(attempted_at) as most_recent_attempt
FROM question_attempt_history
WHERE attempted_at > NOW() - INTERVAL '1 hour';

-- 2. Check the most recent test sessions
SELECT 
    'RECENT TEST SESSIONS' as check_type,
    id,
    user_id,
    test_mode,
    section_name,
    status,
    answers_data IS NOT NULL as has_answers_data,
    question_order IS NOT NULL as has_question_order,
    correct_answers,
    total_questions,
    questions_answered,
    created_at
FROM user_test_sessions
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- 3. For the most recent session, check if any question attempts were created
WITH recent_session AS (
    SELECT id, user_id, section_name, test_mode
    FROM user_test_sessions
    WHERE created_at > NOW() - INTERVAL '1 hour'
    AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    'ATTEMPTS FOR RECENT SESSION' as check_type,
    rs.id as session_id,
    rs.section_name,
    COUNT(qah.id) as attempt_count,
    COUNT(CASE WHEN qah.is_correct = true THEN 1 END) as correct_count
FROM recent_session rs
LEFT JOIN question_attempt_history qah ON qah.session_id = rs.id
GROUP BY rs.id, rs.section_name;

-- 4. Check if there's an RLS policy blocking inserts
SELECT 
    'RLS POLICIES ON QUESTION_ATTEMPT_HISTORY' as check_type,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'question_attempt_history'
ORDER BY policyname;

-- 5. Test if we can manually insert a question attempt
DO $$
DECLARE
    test_user_id UUID;
    test_question_id UUID;
    test_session_id UUID;
BEGIN
    -- Get a recent user, question, and session
    SELECT user_id INTO test_user_id FROM user_test_sessions WHERE created_at > NOW() - INTERVAL '1 hour' LIMIT 1;
    SELECT id INTO test_question_id FROM questions LIMIT 1;
    SELECT id INTO test_session_id FROM user_test_sessions WHERE created_at > NOW() - INTERVAL '1 hour' LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_question_id IS NOT NULL AND test_session_id IS NOT NULL THEN
        -- Try to insert a test record
        INSERT INTO question_attempt_history (
            user_id,
            question_id,
            session_id,
            session_type,
            user_answer,
            is_correct,
            is_flagged,
            is_skipped,
            time_spent_seconds,
            attempted_at
        ) VALUES (
            test_user_id,
            test_question_id,
            test_session_id,
            'diagnostic',
            'A',
            true,
            false,
            false,
            60,
            NOW()
        );
        
        RAISE NOTICE 'TEST INSERT SUCCESSFUL - Manual insert works!';
        
        -- Delete the test record
        DELETE FROM question_attempt_history 
        WHERE user_id = test_user_id 
        AND question_id = test_question_id 
        AND session_id = test_session_id;
    ELSE
        RAISE NOTICE 'TEST INSERT SKIPPED - No recent session found';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST INSERT FAILED - Error: %', SQLERRM;
END $$;

-- 6. Check what's in answers_data for recent sessions
SELECT 
    'ANSWERS_DATA CHECK' as check_type,
    id as session_id,
    section_name,
    jsonb_object_length(answers_data) as answer_count,
    jsonb_pretty(answers_data) as answers_data_sample
FROM user_test_sessions
WHERE created_at > NOW() - INTERVAL '1 hour'
AND answers_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;