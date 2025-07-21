-- Fix save_question_attempt function to properly handle drill sessions
-- The original function only checked user_test_sessions but drill sessions are in drill_sessions table

CREATE OR REPLACE FUNCTION save_question_attempt(
    p_user_id UUID,
    p_question_id UUID,
    p_session_id UUID,
    p_user_answer TEXT,
    p_is_correct BOOLEAN,
    p_is_flagged BOOLEAN DEFAULT FALSE,
    p_is_skipped BOOLEAN DEFAULT FALSE,
    p_time_spent_seconds INTEGER DEFAULT 60
)
RETURNS VOID AS $$
DECLARE
    session_test_mode TEXT;
BEGIN
    -- First try to get test mode from user_test_sessions (diagnostic and practice tests)
    SELECT test_mode INTO session_test_mode
    FROM user_test_sessions
    WHERE id = p_session_id;
    
    -- If not found, check if this is a drill session
    IF session_test_mode IS NULL THEN
        -- Check if this session exists in drill_sessions table
        IF EXISTS (SELECT 1 FROM drill_sessions WHERE id = p_session_id) THEN
            session_test_mode := 'drill';
        ELSE
            session_test_mode := 'unknown';
        END IF;
    END IF;
    
    -- Normalize session_type (practice_1, practice_2, etc. become 'practice')
    IF session_test_mode LIKE 'practice_%' THEN
        session_test_mode := 'practice';
    END IF;
    
    -- Insert the question attempt record
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
        p_user_id,
        p_question_id,
        p_session_id,
        session_test_mode,
        p_user_answer,
        p_is_correct,
        p_is_flagged,
        p_is_skipped,
        p_time_spent_seconds,
        NOW()
    )
    ON CONFLICT (user_id, question_id, session_id) DO UPDATE SET
        user_answer = EXCLUDED.user_answer,
        is_correct = EXCLUDED.is_correct,
        is_flagged = EXCLUDED.is_flagged,
        is_skipped = EXCLUDED.is_skipped,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        attempted_at = NOW();
        
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't break the test flow
    RAISE LOG 'Error in save_question_attempt: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION save_question_attempt(UUID, UUID, UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER) TO authenticated;