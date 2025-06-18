-- Fix duplicate function issues by dropping all versions and creating clean ones

-- Drop all existing duplicate functions with specific signatures
DROP FUNCTION IF EXISTS get_diagnostic_progress(UUID, TEXT);
DROP FUNCTION IF EXISTS get_diagnostic_progress(UUID, CHARACTER VARYING);
DROP FUNCTION IF EXISTS get_diagnostic_progress(UUID, VARCHAR);

-- Create single clean get_diagnostic_progress function
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

-- Drop and recreate other potentially duplicate functions to be safe
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

-- Grant permissions with explicit parameter types
GRANT EXECUTE ON FUNCTION get_diagnostic_progress(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_resume_test_session(UUID, TEXT, TEXT, TEXT, INTEGER, UUID[]) TO authenticated;