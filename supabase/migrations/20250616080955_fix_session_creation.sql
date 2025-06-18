-- Add the missing session creation function

-- This is the critical function that handles session creation/resuming
CREATE OR REPLACE FUNCTION create_or_resume_test_session(
  p_user_id UUID,
  p_product_type TEXT,
  p_test_mode TEXT,
  p_section_name TEXT,
  p_total_questions INTEGER DEFAULT NULL,
  p_question_order UUID[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_existing_session UUID;
BEGIN
  -- Check for existing active session for this section
  SELECT id INTO v_existing_session
  FROM user_test_sessions
  WHERE user_id = p_user_id
    AND product_type = p_product_type
    AND test_mode = p_test_mode
    AND section_name = p_section_name
    AND status IN ('active', 'paused')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_session IS NOT NULL THEN
    -- Resume existing session
    UPDATE user_test_sessions 
    SET status = 'active', updated_at = now()
    WHERE id = v_existing_session;
    
    RETURN v_existing_session;
  ELSE
    -- Create new session
    INSERT INTO user_test_sessions (
      user_id, product_type, test_mode, section_name, 
      total_questions, status, question_order
    ) VALUES (
      p_user_id, p_product_type, p_test_mode, p_section_name,
      p_total_questions, 'active', p_question_order
    ) RETURNING id INTO v_session_id;

    -- Create corresponding section state
    INSERT INTO test_section_states (
      test_session_id, section_name, status, started_at
    ) VALUES (
      v_session_id, p_section_name, 'in_progress', now()
    );

    RETURN v_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_or_resume_test_session(UUID, TEXT, TEXT, TEXT, INTEGER, UUID[]) TO authenticated;
