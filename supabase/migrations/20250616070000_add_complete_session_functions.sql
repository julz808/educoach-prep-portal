-- Add all missing session management functions for EduCourse
-- These functions handle test session creation, progress tracking, and completion

-- Add unique constraint for test_section_states if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'test_section_states_session_section_unique'
  ) THEN
    ALTER TABLE test_section_states 
    ADD CONSTRAINT test_section_states_session_section_unique 
    UNIQUE (test_session_id, section_name);
  END IF;
END $$;

-- Function to create or resume a test session
CREATE OR REPLACE FUNCTION create_or_resume_test_session(
  p_user_id UUID,
  p_product_type TEXT,
  p_test_mode TEXT,
  p_section_name TEXT,
  p_total_questions INTEGER DEFAULT NULL,
  p_question_order UUID[] DEFAULT '{}'::UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Check if there's an existing active session for this section
  SELECT id INTO v_session_id
  FROM user_test_sessions
  WHERE user_id = p_user_id
    AND product_type = p_product_type
    AND test_mode = p_test_mode
    AND (section_name = p_section_name OR current_section = p_section_name)
    AND status IN ('active', 'paused')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If session exists, return it (resume)
  IF v_session_id IS NOT NULL THEN
    -- Update the session with new question order if provided
    IF array_length(p_question_order, 1) > 0 THEN
      UPDATE user_test_sessions 
      SET 
        question_order = p_question_order,
        total_questions = COALESCE(p_total_questions, total_questions),
        updated_at = NOW()
      WHERE id = v_session_id;
    END IF;
    
    RETURN v_session_id;
  END IF;

  -- Create new session
  INSERT INTO user_test_sessions (
    user_id,
    product_type,
    test_mode,
    section_name,
    current_section,
    status,
    total_questions,
    question_order,
    started_at,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_product_type,
    p_test_mode,
    p_section_name,
    p_section_name,
    'active',
    p_total_questions,
    p_question_order,
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_session_id;

  -- Create initial section state
  INSERT INTO test_section_states (
    test_session_id,
    section_name,
    status,
    current_question_index,
    time_remaining_seconds,
    started_at,
    last_updated
  )
  VALUES (
    v_session_id,
    p_section_name,
    'in_progress',
    0,
    3600, -- Default 1 hour
    NOW(),
    NOW()
  );

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get session data for resume
CREATE OR REPLACE FUNCTION get_session_for_resume(
  p_session_id UUID
)
RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  product_type TEXT,
  test_mode TEXT,
  section_name TEXT,
  current_section TEXT,
  status TEXT,
  current_question_index INTEGER,
  total_questions INTEGER,
  started_at TIMESTAMPTZ,
  question_order UUID[],
  question_responses JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uts.id as session_id,
    uts.user_id,
    uts.product_type,
    uts.test_mode,
    uts.section_name,
    uts.current_section,
    uts.status,
    COALESCE(tss.current_question_index, uts.current_question_index) as current_question_index,
    uts.total_questions,
    uts.started_at,
    uts.question_order,
    COALESCE(uts.answers_data, '{}'::JSONB) as question_responses
  FROM user_test_sessions uts
  LEFT JOIN test_section_states tss ON tss.test_session_id = uts.id
  WHERE uts.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record question responses
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
  -- Insert into question attempt history
  INSERT INTO question_attempt_history (
    user_id,
    question_id,
    session_id,
    session_type,
    user_answer,
    is_correct,
    is_flagged,
    is_skipped,
    time_spent_seconds,
    attempted_at
  )
  VALUES (
    p_user_id,
    p_question_id,
    p_test_session_id,
    CASE 
      WHEN p_product_type LIKE '%diagnostic%' THEN 'diagnostic'
      WHEN p_product_type LIKE '%practice%' THEN 'practice'
      WHEN p_product_type LIKE '%drill%' THEN 'drill'
      ELSE 'diagnostic'
    END,
    p_user_answer,
    p_is_correct,
    p_is_flagged,
    p_is_skipped,
    p_time_spent_seconds,
    NOW()
  );

  -- Update session answers data
  UPDATE user_test_sessions
  SET 
    answers_data = COALESCE(answers_data, '{}'::JSONB) || 
                   jsonb_build_object(p_question_id::TEXT, jsonb_build_object(
                     'user_answer', p_user_answer,
                     'is_correct', p_is_correct,
                     'time_spent_seconds', p_time_spent_seconds,
                     'is_flagged', p_is_flagged,
                     'is_skipped', p_is_skipped
                   )),
    questions_answered = questions_answered + 1,
    correct_answers = correct_answers + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_test_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session progress
CREATE OR REPLACE FUNCTION update_session_progress(
  p_session_id UUID,
  p_current_question_index INTEGER,
  p_answers JSONB,
  p_flagged_questions INTEGER[],
  p_time_remaining_seconds INTEGER,
  p_question_order UUID[] DEFAULT '{}'::UUID[]
)
RETURNS VOID AS $$
BEGIN
  -- Update main session
  UPDATE user_test_sessions
  SET 
    current_question_index = p_current_question_index,
    flagged_questions = jsonb_build_array(p_flagged_questions),
    time_remaining_seconds = p_time_remaining_seconds,
    question_order = CASE 
      WHEN array_length(p_question_order, 1) > 0 THEN p_question_order
      ELSE question_order
    END,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Update section state for the current section
  UPDATE test_section_states
  SET 
    current_question_index = p_current_question_index,
    time_remaining_seconds = p_time_remaining_seconds,
    flagged_questions = p_flagged_questions,
    answers = p_answers,
    last_updated = NOW()
  WHERE test_session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a test session
CREATE OR REPLACE FUNCTION complete_test_session(
  p_session_id UUID,
  p_user_id UUID,
  p_product_type TEXT,
  p_test_mode TEXT,
  p_section_scores JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
DECLARE
  v_total_questions INTEGER;
  v_correct_answers INTEGER;
  v_final_score NUMERIC;
BEGIN
  -- Get session stats
  SELECT 
    COALESCE(total_questions, 0),
    COALESCE(correct_answers, 0)
  INTO v_total_questions, v_correct_answers
  FROM user_test_sessions
  WHERE id = p_session_id;

  -- Calculate final score
  v_final_score := CASE 
    WHEN v_total_questions > 0 THEN 
      ROUND((v_correct_answers::NUMERIC / v_total_questions::NUMERIC) * 100, 2)
    ELSE 0
  END;

  -- Update session to completed
  UPDATE user_test_sessions
  SET 
    status = 'completed',
    completed_at = NOW(),
    final_score = v_final_score,
    section_scores = p_section_scores,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Update section states to completed
  UPDATE test_section_states
  SET 
    status = 'completed',
    completed_at = NOW(),
    last_updated = NOW()
  WHERE test_session_id = p_session_id;

  -- Update user progress for diagnostic completion
  IF p_test_mode = 'diagnostic' THEN
    INSERT INTO user_progress (
      user_id,
      product_type,
      diagnostic_completed,
      diagnostic_score,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_product_type,
      TRUE,
      v_final_score,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, product_type)
    DO UPDATE SET
      diagnostic_completed = TRUE,
      diagnostic_score = GREATEST(user_progress.diagnostic_score, v_final_score),
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get session question order
CREATE OR REPLACE FUNCTION get_session_question_order(
  p_session_id UUID
)
RETURNS UUID[] AS $$
DECLARE
  v_question_order UUID[];
BEGIN
  SELECT question_order INTO v_question_order
  FROM user_test_sessions
  WHERE id = p_session_id;

  RETURN COALESCE(v_question_order, '{}'::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rebuild session answers from question responses
CREATE OR REPLACE FUNCTION rebuild_session_answers(
  p_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_answers JSONB := '{}'::JSONB;
  v_response RECORD;
  v_question_index INTEGER := 0;
BEGIN
  -- Get all question responses for this session in order
  FOR v_response IN
    SELECT 
      qah.question_id,
      qah.user_answer,
      qah.is_correct,
      qah.attempted_at
    FROM question_attempt_history qah
    WHERE qah.session_id = p_session_id
    ORDER BY qah.attempted_at ASC
  LOOP
    v_answers := v_answers || jsonb_build_object(
      v_question_index::TEXT, 
      v_response.user_answer
    );
    v_question_index := v_question_index + 1;
  END LOOP;

  RETURN v_answers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the get_diagnostic_progress function to return proper status values with hyphens
DROP FUNCTION IF EXISTS get_diagnostic_progress(UUID, TEXT);

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
  SELECT 
    COALESCE(tss.section_name, uts.section_name, uts.current_section) as section_name,
    CASE 
      WHEN uts.status = 'completed' THEN 'completed'
      WHEN uts.status IN ('active', 'paused') AND tss.status = 'in_progress' THEN 'in-progress'
      WHEN uts.status IN ('active', 'paused') THEN 'in-progress'
      WHEN tss.status = 'not_started' THEN 'not-started'
      WHEN tss.status = 'in_progress' THEN 'in-progress'
      WHEN tss.status = 'completed' THEN 'completed'
      ELSE 'not-started'
    END as status,
    COALESCE(uts.questions_answered, 0) as questions_completed,
    COALESCE(uts.total_questions, 0) as total_questions,
    uts.id as session_id,
    COALESCE(tss.last_updated, uts.updated_at, uts.created_at) as last_updated
  FROM user_test_sessions uts
  LEFT JOIN test_section_states tss ON tss.test_session_id = uts.id
  WHERE uts.user_id = p_user_id
    AND uts.product_type = p_product_type
    AND uts.test_mode = 'diagnostic'
  ORDER BY uts.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to all functions
GRANT EXECUTE ON FUNCTION create_or_resume_test_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_for_resume TO authenticated;
GRANT EXECUTE ON FUNCTION record_question_response TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_progress TO authenticated;
GRANT EXECUTE ON FUNCTION complete_test_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_question_order TO authenticated;
GRANT EXECUTE ON FUNCTION rebuild_session_answers TO authenticated;
GRANT EXECUTE ON FUNCTION get_diagnostic_progress TO authenticated;

-- Add constraints and indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_user_product_mode 
ON user_test_sessions(user_id, product_type, test_mode) 
WHERE status IN ('active', 'paused');

CREATE INDEX IF NOT EXISTS idx_test_section_states_session_section 
ON test_section_states(test_session_id, section_name);

CREATE INDEX IF NOT EXISTS idx_question_attempt_history_session 
ON question_attempt_history(session_id, attempted_at);