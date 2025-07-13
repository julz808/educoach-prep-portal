-- Fix drill_sessions foreign key constraint issue

-- Drop the foreign key constraint that's causing the issue
ALTER TABLE drill_sessions 
DROP CONSTRAINT IF EXISTS drill_sessions_sub_skill_id_fkey;

-- Add a comment to clarify that sub_skill_id is used as an identifier but not a foreign key
COMMENT ON COLUMN drill_sessions.sub_skill_id IS 'Generated UUID identifier for grouping drill sessions by sub-skill. Not a foreign key to sub_skills table.';

-- Also update the function to use UUID parameter type to match the table
DROP FUNCTION IF EXISTS create_or_resume_drill_session(UUID, TEXT, TEXT, INTEGER, UUID[], INTEGER);

CREATE OR REPLACE FUNCTION create_or_resume_drill_session(
  p_user_id UUID,
  p_sub_skill_id UUID,  -- Changed from TEXT to UUID
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
    AND status IN ('active', 'not_started')
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
    started_at
  ) VALUES (
    p_user_id,
    p_sub_skill_id,
    p_product_type,
    p_difficulty,
    'active',
    p_questions_total,
    0,
    0,
    p_question_ids,
    '{}'::jsonb,
    NOW()
  ) RETURNING id INTO v_session_id;
  
  RAISE LOG 'Created new drill session: %', v_session_id;
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_or_resume_drill_session(UUID, UUID, TEXT, INTEGER, UUID[], INTEGER) TO authenticated;