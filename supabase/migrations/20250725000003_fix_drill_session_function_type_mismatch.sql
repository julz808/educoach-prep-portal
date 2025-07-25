-- Fix type inconsistencies in drill session functions
-- All functions should use UUID for sub_skill_id to match the table schema
-- Based on README.md, drill_sessions.sub_skill_id is UUID

-- 1. Fix get_active_drill_session to use UUID instead of TEXT
DROP FUNCTION IF EXISTS get_active_drill_session(UUID, TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION get_active_drill_session(
  p_user_id UUID,
  p_sub_skill_id UUID,  -- Changed from TEXT to UUID
  p_difficulty INTEGER,
  p_product_type TEXT
)
RETURNS TABLE (
  session_id UUID,
  status TEXT,
  questions_answered INTEGER,
  questions_total INTEGER,
  questions_correct INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id as session_id,
    ds.status,
    ds.questions_answered,
    ds.questions_total,
    ds.questions_correct
  FROM drill_sessions ds
  WHERE ds.user_id = p_user_id 
    AND ds.sub_skill_id = p_sub_skill_id
    AND ds.difficulty = p_difficulty
    AND ds.product_type = p_product_type
  ORDER BY ds.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_drill_session_for_resume to use UUID consistently
CREATE OR REPLACE FUNCTION get_drill_session_for_resume(
  p_session_id UUID
)
RETURNS TABLE(
  session_id UUID,
  user_id UUID,
  sub_skill_id UUID,  -- Keep as UUID to match table
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
    ds.created_at as started_at,
    ds.completed_at
  FROM drill_sessions ds
  WHERE ds.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions for updated functions
GRANT EXECUTE ON FUNCTION get_active_drill_session(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_drill_session_for_resume(UUID) TO authenticated;