-- Add remaining missing database functions

-- 1. Add get_session_for_resume function
CREATE OR REPLACE FUNCTION get_session_for_resume(
  p_session_id UUID
)
RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  product_type TEXT,
  test_mode TEXT,
  section_name TEXT,
  total_questions INTEGER,
  current_question_index INTEGER,
  status TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  session_data JSONB,
  question_order UUID[],
  question_responses JSONB,
  section_states JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uts.id as session_id,
    uts.user_id,
    uts.product_type,
    uts.test_mode,
    uts.section_name,
    uts.total_questions,
    uts.current_question_index,
    uts.status,
    uts.started_at,
    jsonb_build_object(
      'answers', uts.answers_data,
      'flaggedQuestions', uts.flagged_questions,
      'timeRemainingSeconds', COALESCE(tss.time_remaining_seconds, 3600),
      'lastUpdated', uts.updated_at
    ) as session_data,
    uts.question_order,
    -- Get all question responses for this session
    COALESCE(
      (SELECT jsonb_object_agg(qah.question_id::text, 
        jsonb_build_object(
          'user_answer', qah.user_answer,
          'is_correct', qah.is_correct,
          'time_spent_seconds', qah.time_spent_seconds,
          'is_flagged', qah.is_flagged,
          'is_skipped', qah.is_skipped
        )
      )
      FROM question_attempt_history qah 
      WHERE qah.session_id = uts.id),
      '{}'::jsonb
    ) as question_responses,
    -- Get section states
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'section_name', tss_inner.section_name,
          'status', tss_inner.status,
          'current_question_index', tss_inner.current_question_index,
          'answers', tss_inner.answers,
          'flagged_questions', tss_inner.flagged_questions,
          'time_remaining_seconds', tss_inner.time_remaining_seconds
        )
      )
      FROM test_section_states tss_inner 
      WHERE tss_inner.test_session_id = uts.id),
      '[]'::jsonb
    ) as section_states
  FROM user_test_sessions uts
  LEFT JOIN test_section_states tss ON tss.test_session_id = uts.id
  WHERE uts.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add record_question_response function
CREATE OR REPLACE FUNCTION record_question_response(
  p_user_id UUID,
  p_question_id UUID,
  p_test_session_id UUID,
  p_product_type TEXT,
  p_user_answer TEXT,
  p_is_correct BOOLEAN,
  p_time_spent_seconds INTEGER,
  p_is_flagged BOOLEAN DEFAULT FALSE,
  p_is_skipped BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  -- Insert question attempt
  INSERT INTO question_attempt_history (
    user_id, question_id, session_id, session_type,
    user_answer, is_correct, is_flagged, is_skipped,
    time_spent_seconds, attempted_at
  ) VALUES (
    p_user_id, p_question_id, p_test_session_id, 
    (SELECT test_mode FROM user_test_sessions WHERE id = p_test_session_id),
    p_user_answer, p_is_correct, p_is_flagged, p_is_skipped,
    p_time_spent_seconds, now()
  )
  ON CONFLICT (user_id, question_id, session_id) 
  DO UPDATE SET
    user_answer = EXCLUDED.user_answer,
    is_correct = EXCLUDED.is_correct,
    is_flagged = EXCLUDED.is_flagged,
    is_skipped = EXCLUDED.is_skipped,
    time_spent_seconds = EXCLUDED.time_spent_seconds,
    attempted_at = EXCLUDED.attempted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add get_active_session_state function
CREATE OR REPLACE FUNCTION get_active_session_state(
  p_user_id UUID,
  p_product_type TEXT,
  p_test_mode TEXT,
  p_section_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  has_active_session BOOLEAN,
  session_id UUID,
  section_name TEXT,
  current_question INTEGER,
  total_questions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN uts.id IS NOT NULL THEN TRUE ELSE FALSE END as has_active_session,
    uts.id as session_id,
    uts.section_name,
    uts.current_question_index + 1 as current_question,
    uts.total_questions
  FROM user_test_sessions uts
  WHERE uts.user_id = p_user_id
    AND uts.product_type = p_product_type
    AND uts.test_mode = p_test_mode
    AND (p_section_name IS NULL OR uts.section_name = p_section_name)
    AND uts.status IN ('active', 'paused')
  ORDER BY uts.updated_at DESC
  LIMIT 1;
  
  -- If no active session found, return false
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT FALSE as has_active_session, NULL::UUID as session_id, 
           NULL::TEXT as section_name, 0 as current_question, 0 as total_questions;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add update_flagged_questions function
CREATE OR REPLACE FUNCTION update_flagged_questions(
  p_session_id UUID,
  p_section_name TEXT,
  p_flagged_questions INTEGER[]
)
RETURNS VOID AS $$
BEGIN
  -- Update section state
  UPDATE test_section_states
  SET flagged_questions = p_flagged_questions, last_updated = now()
  WHERE test_session_id = p_session_id AND section_name = p_section_name;
  
  -- Update session
  UPDATE user_test_sessions
  SET flagged_questions = to_jsonb(p_flagged_questions), updated_at = now()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add update_timer_state function
CREATE OR REPLACE FUNCTION update_timer_state(
  p_session_id UUID,
  p_section_name TEXT,
  p_time_remaining_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update section state
  UPDATE test_section_states
  SET time_remaining_seconds = p_time_remaining_seconds, last_updated = now()
  WHERE test_session_id = p_session_id AND section_name = p_section_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add rebuild_session_answers function
CREATE OR REPLACE FUNCTION rebuild_session_answers(
  p_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_answers JSONB := '{}';
  v_record RECORD;
  v_question_index INTEGER;
BEGIN
  -- Get question order for this session
  FOR v_record IN 
    SELECT qah.question_id, qah.user_answer, 
           ROW_NUMBER() OVER (ORDER BY qah.attempted_at) - 1 as question_index
    FROM question_attempt_history qah
    WHERE qah.session_id = p_session_id
    ORDER BY qah.attempted_at
  LOOP
    v_answers := jsonb_set(v_answers, ARRAY[v_record.question_index::TEXT], to_jsonb(v_record.user_answer));
  END LOOP;
  
  RETURN v_answers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_session_for_resume(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_question_response(UUID, UUID, UUID, TEXT, TEXT, BOOLEAN, INTEGER, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_session_state(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_flagged_questions(UUID, TEXT, INTEGER[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_timer_state(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION rebuild_session_answers(UUID) TO authenticated;