-- Fix UUID/text type mismatch in update_session_progress function

DROP FUNCTION IF EXISTS update_session_progress(UUID, INTEGER, JSONB, INTEGER[], INTEGER, UUID[]);

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
  WHERE id = p_session_id::UUID;  -- Explicit cast to ensure UUID comparison
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_session_progress(UUID, INTEGER, JSONB, INTEGER[], INTEGER, UUID[]) TO authenticated;