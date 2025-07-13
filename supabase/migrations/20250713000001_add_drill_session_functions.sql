-- Add missing database functions for drill session management
-- This fixes the issue where drill sessions are created but never properly updated or completed

-- 1. Function to update drill session progress when questions are answered
CREATE OR REPLACE FUNCTION update_drill_session_progress(
  p_session_id UUID,
  p_questions_answered INTEGER,
  p_questions_correct INTEGER,
  p_answers_data JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE drill_sessions 
  SET 
    questions_answered = p_questions_answered,
    questions_correct = p_questions_correct,
    answers_data = p_answers_data,
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- If no rows affected, session doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drill session not found: %', p_session_id;
  END IF;
  
  RAISE LOG 'Updated drill session progress: % answered, % correct', p_questions_answered, p_questions_correct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to complete a drill session
CREATE OR REPLACE FUNCTION complete_drill_session(
  p_session_id UUID,
  p_questions_answered INTEGER,
  p_questions_correct INTEGER,
  p_answers_data JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE drill_sessions 
  SET 
    status = 'completed',
    questions_answered = p_questions_answered,
    questions_correct = p_questions_correct,
    answers_data = p_answers_data,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- If no rows affected, session doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drill session not found: %', p_session_id;
  END IF;
  
  RAISE LOG 'Completed drill session: % (%/% correct)', p_session_id, p_questions_correct, p_questions_answered;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get drill session state for resuming
CREATE OR REPLACE FUNCTION get_drill_session_for_resume(
  p_session_id UUID
)
RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  sub_skill_id TEXT,
  product_type TEXT,
  difficulty INTEGER,
  status TEXT,
  questions_total INTEGER,
  questions_answered INTEGER,
  questions_correct INTEGER,
  question_ids UUID[],
  answers_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id as session_id,
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
    ds.created_at as started_at,
    ds.completed_at
  FROM drill_sessions ds
  WHERE ds.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to get active drill session for a user/sub-skill/difficulty
CREATE OR REPLACE FUNCTION get_active_drill_session(
  p_user_id UUID,
  p_sub_skill_id TEXT,
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

-- 5. Function to create or resume drill session
CREATE OR REPLACE FUNCTION create_or_resume_drill_session(
  p_user_id UUID,
  p_sub_skill_id TEXT,
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
  ORDER BY created_at DESC
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
    answers_data
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
    '{}'::jsonb
  ) RETURNING id INTO v_session_id;
  
  RAISE LOG 'Created new drill session: %', v_session_id;
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to all functions
GRANT EXECUTE ON FUNCTION update_drill_session_progress(UUID, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_drill_session(UUID, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_drill_session_for_resume(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_drill_session(UUID, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_resume_drill_session(UUID, TEXT, TEXT, INTEGER, UUID[], INTEGER) TO authenticated;