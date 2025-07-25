-- STEP 3 FIXED: Drop and recreate get_drill_session_for_resume function

-- First drop the existing function
DROP FUNCTION IF EXISTS get_drill_session_for_resume(UUID);

-- Then create the new function with the correct return type
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