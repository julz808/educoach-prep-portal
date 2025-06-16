-- Real-time session management functions for EduCourse
-- These functions should be added to your Supabase project

-- Function to update flagged questions in real-time
CREATE OR REPLACE FUNCTION update_flagged_questions(
  p_session_id UUID,
  p_section_name TEXT,
  p_flagged_questions INTEGER[]
)
RETURNS VOID AS $$
BEGIN
  -- Update or insert section state with flagged questions
  INSERT INTO test_section_states (
    test_session_id,
    section_name,
    flagged_questions,
    last_updated
  )
  VALUES (
    p_session_id,
    p_section_name,
    p_flagged_questions,
    NOW()
  )
  ON CONFLICT (test_session_id, section_name)
  DO UPDATE SET
    flagged_questions = EXCLUDED.flagged_questions,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timer state in real-time
CREATE OR REPLACE FUNCTION update_timer_state(
  p_session_id UUID,
  p_section_name TEXT,
  p_time_remaining_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update or insert section state with timer
  INSERT INTO test_section_states (
    test_session_id,
    section_name,
    time_remaining_seconds,
    last_updated
  )
  VALUES (
    p_session_id,
    p_section_name,
    p_time_remaining_seconds,
    NOW()
  )
  ON CONFLICT (test_session_id, section_name)
  DO UPDATE SET
    time_remaining_seconds = EXCLUDED.time_remaining_seconds,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update section state comprehensively
CREATE OR REPLACE FUNCTION update_section_state(
  p_session_id UUID,
  p_section_name TEXT,
  p_current_question_index INTEGER,
  p_answers JSONB,
  p_flagged_questions INTEGER[],
  p_time_remaining_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update or insert complete section state
  INSERT INTO test_section_states (
    test_session_id,
    section_name,
    status,
    current_question_index,
    time_remaining_seconds,
    flagged_questions,
    answers,
    last_updated
  )
  VALUES (
    p_session_id,
    p_section_name,
    'in_progress',
    p_current_question_index,
    p_time_remaining_seconds,
    p_flagged_questions,
    p_answers,
    NOW()
  )
  ON CONFLICT (test_session_id, section_name)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_question_index = EXCLUDED.current_question_index,
    time_remaining_seconds = EXCLUDED.time_remaining_seconds,
    flagged_questions = EXCLUDED.flagged_questions,
    answers = EXCLUDED.answers,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active session state for resume checking
CREATE OR REPLACE FUNCTION get_active_session_state(
  p_user_id UUID,
  p_product_type TEXT,
  p_test_mode TEXT,
  p_section_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  session_id UUID,
  current_question_index INTEGER,
  time_remaining_seconds INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uts.id as session_id,
    COALESCE(tss.current_question_index, uts.current_question_index) as current_question_index,
    COALESCE(tss.time_remaining_seconds, 3600) as time_remaining_seconds,
    uts.status
  FROM user_test_sessions uts
  LEFT JOIN test_section_states tss ON tss.test_session_id = uts.id 
    AND (p_section_name IS NULL OR tss.section_name = p_section_name)
  WHERE uts.user_id = p_user_id
    AND uts.product_type = p_product_type
    AND uts.test_mode = p_test_mode
    AND uts.status IN ('active', 'paused')
  ORDER BY uts.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_flagged_questions TO authenticated;
GRANT EXECUTE ON FUNCTION update_timer_state TO authenticated;
GRANT EXECUTE ON FUNCTION update_section_state TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_session_state TO authenticated;