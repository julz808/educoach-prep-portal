-- Complete Test Session Flow Implementation
-- This migration implements the full test session flow with data persistence

BEGIN;

-- =============================================================================
-- 1. ENSURE PROPER TABLE STRUCTURE
-- =============================================================================

-- Handle table renaming more carefully
DO $$
BEGIN
  -- If test_attempts exists and user_test_sessions doesn't exist, rename it
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_attempts') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_test_sessions') THEN
    ALTER TABLE test_attempts RENAME TO user_test_sessions;
  END IF;
  
  -- If both exist, we need to merge or handle the conflict
  -- For now, we'll assume user_test_sessions is the correct one and drop test_attempts if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_attempts') 
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_test_sessions') THEN
    -- Drop the old test_attempts table after ensuring data is preserved
    -- You may want to manually verify data before running this
    DROP TABLE IF EXISTS test_attempts CASCADE;
  END IF;
END $$;

-- Update foreign key references
ALTER TABLE user_question_responses 
DROP CONSTRAINT IF EXISTS user_question_responses_test_session_id_fkey;

ALTER TABLE user_question_responses
ADD CONSTRAINT user_question_responses_test_session_id_fkey 
FOREIGN KEY (test_session_id) REFERENCES user_test_sessions(id);

-- Ensure user_test_sessions has all required columns
ALTER TABLE user_test_sessions
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
ADD COLUMN IF NOT EXISTS current_question_index INT4 DEFAULT 0,
ADD COLUMN IF NOT EXISTS questions_answered INT4 DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS test_template_id UUID REFERENCES test_templates(id),
ADD COLUMN IF NOT EXISTS section_scores JSONB,
ADD COLUMN IF NOT EXISTS sub_skill_performance JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_user_status ON user_test_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_product_mode ON user_test_sessions(product_type, test_mode);
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_session_data ON user_test_sessions USING GIN (session_data);

-- =============================================================================
-- 2. SESSION MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to create or resume a test session
CREATE OR REPLACE FUNCTION create_or_resume_test_session(
  p_user_id UUID,
  p_product_type VARCHAR,
  p_test_mode VARCHAR,
  p_section_name VARCHAR,
  p_total_questions INT4 DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_existing_session RECORD;
BEGIN
  -- Check for existing in-progress session
  SELECT * INTO v_existing_session
  FROM user_test_sessions 
  WHERE user_id = p_user_id 
    AND product_type = p_product_type 
    AND test_mode = p_test_mode 
    AND section_name = p_section_name
    AND status = 'in_progress'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_session.id IS NOT NULL THEN
    -- Resume existing session
    RETURN v_existing_session.id;
  ELSE
    -- Create new session
    INSERT INTO user_test_sessions (
      user_id, product_type, test_mode, section_name,
      started_at, total_questions, status, current_question_index,
      questions_answered, session_data
    ) VALUES (
      p_user_id, p_product_type, p_test_mode, p_section_name,
      NOW(), p_total_questions, 'in_progress', 0,
      0, '{}'::jsonb
    ) RETURNING id INTO v_session_id;
    
    -- Initialize user progress if not exists
    INSERT INTO user_progress (user_id, product_type)
    VALUES (p_user_id, p_product_type)
    ON CONFLICT (user_id, product_type) DO NOTHING;
    
    RETURN v_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update session progress after each answer
CREATE OR REPLACE FUNCTION update_session_progress(
  p_session_id UUID,
  p_current_question_index INT4,
  p_answers JSONB,
  p_flagged_questions INT4[] DEFAULT '{}',
  p_time_remaining_seconds INT4 DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_questions_answered INT4;
BEGIN
  -- Count answered questions
  v_questions_answered := jsonb_object_length(p_answers);
  
  -- Update session with current progress
  UPDATE user_test_sessions 
  SET 
    current_question_index = p_current_question_index,
    questions_answered = v_questions_answered,
    session_data = jsonb_build_object(
      'answers', p_answers,
      'flagged_questions', p_flagged_questions,
      'time_remaining_seconds', p_time_remaining_seconds,
      'current_question_index', p_current_question_index,
      'last_updated', NOW()
    )
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Enhanced record_question_response function with session linking
CREATE OR REPLACE FUNCTION record_question_response(
  p_user_id UUID,
  p_question_id UUID,
  p_test_session_id UUID,
  p_product_type VARCHAR,
  p_user_answer TEXT,
  p_is_correct BOOLEAN,
  p_time_spent_seconds INT4 DEFAULT NULL,
  p_is_flagged BOOLEAN DEFAULT FALSE,
  p_is_skipped BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  -- Insert the question response with session link
  INSERT INTO user_question_responses (
    user_id, question_id, test_session_id, product_type, 
    user_answer, is_correct, time_spent_seconds, is_flagged, is_skipped
  ) VALUES (
    p_user_id, p_question_id, p_test_session_id, p_product_type,
    p_user_answer, p_is_correct, p_time_spent_seconds, p_is_flagged, p_is_skipped
  );
  
  -- Update user progress
  INSERT INTO user_progress (
    user_id, product_type, total_questions_completed, 
    total_study_time_seconds, last_activity_at
  )
  VALUES (
    p_user_id, p_product_type, 1, 
    COALESCE(p_time_spent_seconds, 0), NOW()
  )
  ON CONFLICT (user_id, product_type) 
  DO UPDATE SET 
    total_questions_completed = user_progress.total_questions_completed + 1,
    total_study_time_seconds = user_progress.total_study_time_seconds + COALESCE(p_time_spent_seconds, 0),
    last_activity_at = NOW(),
    updated_at = NOW();
  
  -- Update sub-skill performance if question has sub_skill_id
  UPDATE user_sub_skill_performance 
  SET 
    questions_attempted = questions_attempted + 1,
    questions_correct = questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    accuracy_percentage = ROUND(
      (questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END) * 100.0 / 
      (questions_attempted + 1), 2
    ),
    last_updated = NOW()
  WHERE user_id = p_user_id 
    AND sub_skill_id = (SELECT sub_skill_id FROM questions WHERE id = p_question_id)
    AND product_type = p_product_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get session with all answers for resumption
CREATE OR REPLACE FUNCTION get_session_for_resume(
  p_session_id UUID
) RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  product_type VARCHAR,
  test_mode VARCHAR,
  section_name VARCHAR,
  current_question_index INT4,
  questions_answered INT4,
  total_questions INT4,
  started_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR,
  session_data JSONB,
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
    uts.current_question_index,
    uts.questions_answered,
    uts.total_questions,
    uts.started_at,
    uts.status,
    uts.session_data,
    COALESCE(
      jsonb_object_agg(
        uqr.question_id, 
        jsonb_build_object(
          'user_answer', uqr.user_answer,
          'is_correct', uqr.is_correct,
          'time_spent_seconds', uqr.time_spent_seconds,
          'is_flagged', uqr.is_flagged,
          'created_at', uqr.created_at
        )
      ) FILTER (WHERE uqr.question_id IS NOT NULL),
      '{}'::jsonb
    ) as question_responses
  FROM user_test_sessions uts
  LEFT JOIN user_question_responses uqr ON uts.id = uqr.test_session_id
  WHERE uts.id = p_session_id
  GROUP BY uts.id, uts.user_id, uts.product_type, uts.test_mode, 
           uts.section_name, uts.current_question_index, uts.questions_answered,
           uts.total_questions, uts.started_at, uts.status, uts.session_data;
END;
$$ LANGUAGE plpgsql;

-- Enhanced complete_test_session function
CREATE OR REPLACE FUNCTION complete_test_session(
  p_session_id UUID,
  p_user_id UUID,
  p_product_type VARCHAR,
  p_test_mode VARCHAR,
  p_section_scores JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_total_correct INT4;
  v_total_questions INT4;
  v_session_score NUMERIC(5,2);
BEGIN
  -- Calculate session statistics from user_question_responses
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_correct = true) as correct
  INTO v_total_questions, v_total_correct
  FROM user_question_responses 
  WHERE test_session_id = p_session_id;
  
  -- Calculate percentage score
  v_session_score := CASE 
    WHEN v_total_questions > 0 THEN (v_total_correct::NUMERIC / v_total_questions) * 100
    ELSE 0
  END;
  
  -- Update test session as completed
  UPDATE user_test_sessions 
  SET 
    completed_at = NOW(),
    correct_answers = v_total_correct,
    total_questions = v_total_questions,
    section_scores = p_section_scores,
    status = 'completed'
  WHERE id = p_session_id;
  
  -- Update user progress for diagnostic completion
  IF p_test_mode = 'diagnostic' THEN
    UPDATE user_progress 
    SET 
      diagnostic_completed = true,
      diagnostic_score = v_session_score,
      updated_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
  
  -- Update practice test completion
  IF p_test_mode = 'practice' THEN
    UPDATE user_progress 
    SET 
      practice_tests_completed = array_append(
        COALESCE(practice_tests_completed, '{}'),
        (SELECT test_number FROM user_test_sessions WHERE id = p_session_id)
      ),
      updated_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get diagnostic progress with session info
CREATE OR REPLACE FUNCTION get_diagnostic_progress(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS TABLE (
  section_name VARCHAR,
  status VARCHAR,
  questions_completed INT4,
  total_questions INT4,
  session_id UUID,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_sessions AS (
    SELECT DISTINCT ON (uts.section_name)
      uts.section_name,
      uts.id as session_id,
      uts.status,
      uts.questions_answered,
      uts.total_questions,
      uts.created_at,
      uts.completed_at
    FROM user_test_sessions uts
    WHERE uts.user_id = p_user_id 
      AND uts.product_type = p_product_type 
      AND uts.test_mode = 'diagnostic'
    ORDER BY uts.section_name, uts.created_at DESC
  )
  SELECT 
    ls.section_name,
    CASE 
      WHEN ls.completed_at IS NOT NULL THEN 'completed'
      WHEN ls.questions_answered > 0 THEN 'in-progress'
      ELSE 'not-started'
    END as status,
    COALESCE(ls.questions_answered, 0) as questions_completed,
    COALESCE(ls.total_questions, 0) as total_questions,
    ls.session_id,
    COALESCE(ls.completed_at, ls.created_at) as last_updated
  FROM latest_sessions ls;
END;
$$ LANGUAGE plpgsql;

COMMIT; 