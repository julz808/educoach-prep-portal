-- Fix get_session_for_resume function to include text_answers_data
-- This resolves the issue where text answers disappear on tab switch/refresh for writing drills

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
      'textAnswers', COALESCE(uts.text_answers_data, '{}'::jsonb),  -- Include text answers!
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
          'time_remaining_seconds', tss_inner.time_remaining_seconds,
          'answers', tss_inner.answers,
          'flagged_questions', tss_inner.flagged_questions,
          'last_updated', tss_inner.last_updated
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_session_for_resume(UUID) TO authenticated;