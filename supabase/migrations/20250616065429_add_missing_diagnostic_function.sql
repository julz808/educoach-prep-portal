-- Complete diagnostic progress functionality rebuild
-- This migration fixes all issues with diagnostic progress tracking

-- 1. Fix get_diagnostic_progress function with proper logic
DROP FUNCTION IF EXISTS get_diagnostic_progress(UUID, TEXT);

CREATE OR REPLACE FUNCTION get_diagnostic_progress(
  p_user_id UUID,
  p_product_type TEXT
)
RETURNS TABLE (
  section_name TEXT,
  status TEXT,
  questions_completed INTEGER,
  total_questions INTEGER,
  session_id UUID,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_sessions AS (
    -- Get the most recent session for each section
    SELECT DISTINCT ON (uts.section_name)
      uts.id as session_id,
      uts.section_name,
      uts.status as session_status,
      uts.questions_answered,
      uts.total_questions,
      uts.updated_at,
      tss.status as section_status,
      tss.last_updated as section_last_updated
    FROM user_test_sessions uts
    LEFT JOIN test_section_states tss ON tss.test_session_id = uts.id
    WHERE uts.user_id = p_user_id
      AND uts.product_type = p_product_type
      AND uts.test_mode = 'diagnostic'
      AND uts.section_name IS NOT NULL
    ORDER BY uts.section_name, uts.created_at DESC
  )
  SELECT 
    ls.section_name,
    -- Map status values properly (with hyphens for frontend)
    CASE 
      WHEN ls.session_status = 'completed' THEN 'completed'
      WHEN ls.session_status IN ('active', 'paused') AND ls.section_status = 'in_progress' THEN 'in-progress'
      WHEN ls.session_status IN ('active', 'paused') THEN 'in-progress'
      ELSE 'not-started'
    END as status,
    COALESCE(ls.questions_answered, 0) as questions_completed,
    COALESCE(ls.total_questions, 0) as total_questions,
    ls.session_id,
    COALESCE(ls.section_last_updated, ls.updated_at) as last_updated
  FROM latest_sessions ls
  ORDER BY ls.section_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add missing create_or_resume_test_session function
DROP FUNCTION IF EXISTS create_or_resume_test_session;

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

-- 3. Add missing complete_test_session function
DROP FUNCTION IF EXISTS complete_test_session;

CREATE OR REPLACE FUNCTION complete_test_session(
  p_session_id UUID,
  p_user_id UUID,
  p_product_type TEXT,
  p_test_mode TEXT,
  p_section_scores JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update session as completed
  UPDATE user_test_sessions
  SET 
    status = 'completed',
    completed_at = now(),
    updated_at = now(),
    section_scores = p_section_scores
  WHERE id = p_session_id AND user_id = p_user_id;

  -- Update section state as completed
  UPDATE test_section_states
  SET 
    status = 'completed',
    completed_at = now(),
    last_updated = now()
  WHERE test_session_id = p_session_id;

  -- Mark diagnostic as completed in user progress if this is diagnostic mode
  IF p_test_mode = 'diagnostic' THEN
    UPDATE user_progress
    SET 
      diagnostic_completed = true,
      updated_at = now()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add missing update_session_progress function
DROP FUNCTION IF EXISTS update_session_progress;

CREATE OR REPLACE FUNCTION update_session_progress(
  p_session_id UUID,
  p_current_question_index INTEGER,
  p_answers JSONB,
  p_flagged_questions INTEGER[],
  p_time_remaining_seconds INTEGER,
  p_question_order UUID[] DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_test_sessions
  SET 
    current_question_index = p_current_question_index,
    answers_data = p_answers,
    flagged_questions = to_jsonb(p_flagged_questions),
    questions_answered = jsonb_object_length(p_answers),
    updated_at = now(),
    question_order = COALESCE(p_question_order, question_order)
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add missing update_section_state function  
DROP FUNCTION IF EXISTS update_section_state;

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
  -- First try to update existing record
  UPDATE test_section_states
  SET 
    current_question_index = p_current_question_index,
    answers = p_answers,
    flagged_questions = p_flagged_questions,
    time_remaining_seconds = p_time_remaining_seconds,
    status = 'in_progress',
    last_updated = now()
  WHERE test_session_id = p_session_id AND section_name = p_section_name;

  -- If no record was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO test_section_states (
      test_session_id, section_name, current_question_index,
      answers, flagged_questions, time_remaining_seconds,
      status, started_at, last_updated
    ) VALUES (
      p_session_id, p_section_name, p_current_question_index,
      p_answers, p_flagged_questions, p_time_remaining_seconds,
      'in_progress', now(), now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_diagnostic_progress(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_resume_test_session(UUID, TEXT, TEXT, TEXT, INTEGER, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_test_session(UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_progress(UUID, INTEGER, JSONB, INTEGER[], INTEGER, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_section_state(UUID, TEXT, INTEGER, JSONB, INTEGER[], INTEGER) TO authenticated;