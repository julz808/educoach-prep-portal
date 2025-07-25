-- Add text_answers_data column to drill_sessions table
-- This allows drill sessions to store written responses just like user_test_sessions

ALTER TABLE public.drill_sessions 
ADD COLUMN text_answers_data jsonb DEFAULT '{}'::jsonb;

-- Add comment to clarify usage
COMMENT ON COLUMN public.drill_sessions.text_answers_data IS 'Stores written responses for extended_response and short_answer questions in drill sessions. Format: {"question_index": "answer_text"}';

-- Update existing drill session functions to handle text answers

-- 1. Update update_drill_session_progress function
CREATE OR REPLACE FUNCTION update_drill_session_progress(
  p_session_id UUID,
  p_questions_answered INTEGER,
  p_questions_correct INTEGER,
  p_answers_data JSONB,
  p_text_answers_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  UPDATE drill_sessions 
  SET 
    questions_answered = p_questions_answered,
    questions_correct = p_questions_correct,
    answers_data = p_answers_data,
    text_answers_data = p_text_answers_data,
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- If no rows affected, session doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drill session not found: %', p_session_id;
  END IF;
  
  RAISE LOG 'Updated drill session progress: % answered, % correct, % text answers', 
    p_questions_answered, p_questions_correct, jsonb_object_keys(p_text_answers_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update complete_drill_session function
CREATE OR REPLACE FUNCTION complete_drill_session(
  p_session_id UUID,
  p_questions_answered INTEGER,
  p_questions_correct INTEGER,
  p_answers_data JSONB,
  p_text_answers_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  UPDATE drill_sessions 
  SET 
    status = 'completed',
    questions_answered = p_questions_answered,
    questions_correct = p_questions_correct,
    answers_data = p_answers_data,
    text_answers_data = p_text_answers_data,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- If no rows affected, session doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drill session not found: %', p_session_id;
  END IF;
  
  RAISE LOG 'Completed drill session: % answered, % correct, % text answers', 
    p_questions_answered, p_questions_correct, jsonb_object_keys(p_text_answers_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update get_drill_session_for_resume function to return text answers
CREATE OR REPLACE FUNCTION get_drill_session_for_resume(
  p_session_id UUID
)
RETURNS TABLE(
  session_id UUID,
  user_id UUID,
  sub_skill_id UUID,
  product_type TEXT,
  difficulty INTEGER,
  status TEXT,
  questions_total INTEGER,
  questions_answered INTEGER,
  questions_correct INTEGER,
  question_ids UUID[],
  answers_data JSONB,
  text_answers_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id,
    ds.user_id,
    ds.sub_skill_id,
    ds.product_type,
    ds.difficulty,
    ds.status,
    ds.questions_total,
    ds.questions_answered,
    ds.questions_correct,
    ds.question_ids,
    ds.answers_data,
    COALESCE(ds.text_answers_data, '{}'::jsonb) as text_answers_data,
    ds.started_at,
    ds.completed_at
  FROM drill_sessions ds
  WHERE ds.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;