-- Fix drill session type mismatch issues
-- This script ensures all drill session functions use consistent types

-- First, let's check the actual structure of drill_sessions table
-- Run this query to see what types are actually in use:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'drill_sessions' ORDER BY ordinal_position;

-- Drop and recreate the function with proper types
DROP FUNCTION IF EXISTS get_drill_session_for_resume(UUID);

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
    ds.id::UUID,
    ds.user_id::UUID,
    ds.sub_skill_id::UUID,
    ds.product_type::TEXT,
    ds.difficulty::INTEGER,
    ds.status::TEXT,
    ds.questions_total::INTEGER,
    ds.questions_answered::INTEGER,
    ds.questions_correct::INTEGER,
    ds.question_ids::UUID[],
    ds.answers_data::JSONB,
    COALESCE(ds.text_answers_data, '{}'::jsonb)::JSONB,
    ds.started_at::TIMESTAMPTZ,
    ds.completed_at::TIMESTAMPTZ
  FROM drill_sessions ds
  WHERE ds.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure the create_or_resume function uses UUID
DROP FUNCTION IF EXISTS create_or_resume_drill_session(UUID, TEXT, TEXT, INTEGER, UUID[], INTEGER);
DROP FUNCTION IF EXISTS create_or_resume_drill_session(UUID, UUID, TEXT, INTEGER, UUID[], INTEGER);

CREATE OR REPLACE FUNCTION create_or_resume_drill_session(
  p_user_id UUID,
  p_sub_skill_id UUID,
  p_product_type TEXT,
  p_difficulty INTEGER,
  p_question_ids UUID[],
  p_questions_total INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_existing_session UUID;
  v_existing_status TEXT;
BEGIN
  -- Check for existing incomplete session
  SELECT id, status INTO v_existing_session, v_existing_status
  FROM drill_sessions
  WHERE user_id = p_user_id 
    AND sub_skill_id = p_sub_skill_id
    AND difficulty = p_difficulty
    AND product_type = p_product_type
    AND status IN ('in_progress', 'not_started')
  ORDER BY started_at DESC
  LIMIT 1;
  
  -- If found existing incomplete session, return it
  IF v_existing_session IS NOT NULL THEN
    RAISE LOG 'Resuming existing drill session: %', v_existing_session;
    RETURN v_existing_session;
  END IF;
  
  -- Create new session
  INSERT INTO drill_sessions (
    user_id,
    sub_skill_id,
    product_type,
    difficulty,
    status,
    questions_total,
    questions_answered,
    questions_correct,
    question_ids,
    answers_data,
    text_answers_data
  ) VALUES (
    p_user_id,
    p_sub_skill_id,
    p_product_type,
    p_difficulty,
    'in_progress',
    p_questions_total,
    0,
    0,
    p_question_ids,
    '{}'::jsonb,
    '{}'::jsonb
  ) RETURNING id INTO v_session_id;
  
  RAISE LOG 'Created new drill session: %', v_session_id;
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_drill_session_for_resume(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_resume_drill_session(UUID, UUID, TEXT, INTEGER, UUID[], INTEGER) TO authenticated;

-- Verify the fix by running a test query
-- This should return the column types:
SELECT 
  pg_typeof(session_id) as session_id_type,
  pg_typeof(user_id) as user_id_type,
  pg_typeof(sub_skill_id) as sub_skill_id_type,
  pg_typeof(product_type) as product_type_type,
  pg_typeof(difficulty) as difficulty_type
FROM get_drill_session_for_resume('00000000-0000-0000-0000-000000000000'::UUID)
LIMIT 1;