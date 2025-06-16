-- Migration: Fix Session Persistence Issues
-- Add question_order column and update functions to properly preserve question order

BEGIN;

-- Add question_order column to store the ordered list of question IDs
ALTER TABLE user_test_sessions 
ADD COLUMN IF NOT EXISTS question_order UUID[] DEFAULT '{}';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_question_order 
ON user_test_sessions USING GIN (question_order);

-- Update create_or_resume_test_session to handle question order
CREATE OR REPLACE FUNCTION create_or_resume_test_session(
  p_user_id UUID,
  p_product_type TEXT,
  p_test_mode TEXT,
  p_section_name TEXT,
  p_total_questions INTEGER DEFAULT NULL,
  p_question_order UUID[] DEFAULT '{}'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id TEXT;
  v_existing_session RECORD;
  v_test_template_id UUID;
BEGIN
  -- Generate session ID
  v_session_id := 'session_' || p_user_id::TEXT || '_' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
  
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
  
  -- If existing session found, return its ID
  IF v_existing_session.session_id IS NOT NULL THEN
    RETURN v_existing_session.session_id;
  END IF;
  
  -- Get or create test template
  SELECT id INTO v_test_template_id
  FROM test_templates
  WHERE product_type = p_product_type
    AND test_mode = p_test_mode
    AND section_name = p_section_name
  LIMIT 1;
  
  -- Create new session with question order
  INSERT INTO user_test_sessions (
    session_id,
    user_id,
    product_type,
    test_mode,
    section_name,
    test_template_id,
    total_questions,
    question_order,
    status,
    current_question_index,
    questions_answered,
    session_data,
    created_at,
    updated_at
  ) VALUES (
    v_session_id,
    p_user_id,
    p_product_type,
    p_test_mode,
    p_section_name,
    v_test_template_id,
    COALESCE(p_total_questions, array_length(p_question_order, 1), 0),
    p_question_order,
    'in_progress',
    0,
    0,
    jsonb_build_object(
      'startedAt', NOW(),
      'timeRemainingSeconds', 3600,
      'flaggedQuestions', '[]'::jsonb,
      'answers', '{}'::jsonb
    ),
    NOW(),
    NOW()
  );
  
  RETURN v_session_id;
END;
$$;

-- Update update_session_progress to preserve existing session data and question order
CREATE OR REPLACE FUNCTION update_session_progress(
  p_session_id TEXT,
  p_current_question_index INTEGER,
  p_answers JSONB DEFAULT '{}'::jsonb,
  p_flagged_questions INTEGER[] DEFAULT '{}',
  p_time_remaining_seconds INTEGER DEFAULT NULL,
  p_question_order UUID[] DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_data JSONB;
  v_merged_data JSONB;
  v_current_order UUID[];
BEGIN
  -- Get existing session data and question order
  SELECT session_data, question_order INTO v_existing_data, v_current_order
  FROM user_test_sessions
  WHERE session_id = p_session_id;
  
  -- If no existing data, initialize
  IF v_existing_data IS NULL THEN
    v_existing_data := '{}'::jsonb;
  END IF;
  
  -- Merge session data, preserving existing fields and updating provided ones
  v_merged_data := v_existing_data;
  
  -- Update specific fields
  IF p_answers IS NOT NULL AND p_answers != '{}'::jsonb THEN
    v_merged_data := v_merged_data || jsonb_build_object('answers', p_answers);
  END IF;
  
  IF p_flagged_questions IS NOT NULL THEN
    v_merged_data := v_merged_data || jsonb_build_object('flaggedQuestions', to_jsonb(p_flagged_questions));
  END IF;
  
  IF p_time_remaining_seconds IS NOT NULL THEN
    v_merged_data := v_merged_data || jsonb_build_object('timeRemainingSeconds', p_time_remaining_seconds);
  END IF;
  
  -- Always update lastUpdated
  v_merged_data := v_merged_data || jsonb_build_object('lastUpdated', NOW());
  
  -- Update question order if provided and not already set
  IF p_question_order IS NOT NULL AND array_length(p_question_order, 1) > 0 THEN
    IF v_current_order IS NULL OR array_length(v_current_order, 1) = 0 THEN
      v_current_order := p_question_order;
    END IF;
  END IF;
  
  -- Update the session
  UPDATE user_test_sessions
  SET 
    current_question_index = p_current_question_index,
    questions_answered = (
      SELECT COUNT(*)
      FROM jsonb_object_keys(COALESCE(p_answers, '{}'::jsonb))
    ),
    session_data = v_merged_data,
    question_order = v_current_order,
    updated_at = NOW()
  WHERE session_id = p_session_id;
  
  -- Log the update
  RAISE NOTICE 'Session % updated: question %, answers %, time %', 
    p_session_id, p_current_question_index, 
    jsonb_object_keys(COALESCE(p_answers, '{}'::jsonb)), 
    p_time_remaining_seconds;
END;
$$;

-- Update get_session_for_resume to include question order
CREATE OR REPLACE FUNCTION get_session_for_resume(p_session_id TEXT)
RETURNS TABLE (
  session_id TEXT,
  user_id UUID,
  product_type TEXT,
  test_mode TEXT,
  section_name TEXT,
  total_questions INTEGER,
  current_question_index INTEGER,
  status TEXT,
  session_data JSONB,
  question_order UUID[],
  started_at TIMESTAMP WITH TIME ZONE,
  question_responses JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_responses JSONB := '{}'::jsonb;
  v_response RECORD;
BEGIN
  -- Get all question responses for this session
  FOR v_response IN
    SELECT 
      question_id,
      user_answer,
      is_correct,
      time_spent_seconds,
      is_flagged,
      is_skipped
    FROM user_question_responses
    WHERE test_session_id = p_session_id
    ORDER BY created_at
  LOOP
    v_responses := v_responses || jsonb_build_object(
      v_response.question_id::TEXT,
      jsonb_build_object(
        'user_answer', v_response.user_answer,
        'is_correct', v_response.is_correct,
        'time_spent_seconds', v_response.time_spent_seconds,
        'is_flagged', v_response.is_flagged,
        'is_skipped', v_response.is_skipped
      )
    );
  END LOOP;
  
  -- Return session data with question responses
  RETURN QUERY
  SELECT 
    uts.session_id,
    uts.user_id,
    uts.product_type,
    uts.test_mode,
    uts.section_name,
    uts.total_questions,
    uts.current_question_index,
    uts.status,
    uts.session_data,
    uts.question_order,
    uts.created_at as started_at,
    v_responses as question_responses
  FROM user_test_sessions uts
  WHERE uts.session_id = p_session_id;
END;
$$;

-- Add helper function to get question order from session
CREATE OR REPLACE FUNCTION get_session_question_order(p_session_id TEXT)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order UUID[];
BEGIN
  SELECT question_order INTO v_order
  FROM user_test_sessions
  WHERE session_id = p_session_id;
  
  RETURN COALESCE(v_order, '{}');
END;
$$;

-- Add function to rebuild answers from question responses (fallback method)
CREATE OR REPLACE FUNCTION rebuild_session_answers(p_session_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_answers JSONB := '{}'::jsonb;
  v_response RECORD;
  v_question_order UUID[];
  v_question_index INTEGER;
BEGIN
  -- Get question order
  SELECT question_order INTO v_question_order
  FROM user_test_sessions
  WHERE session_id = p_session_id;
  
  -- If no question order, return empty
  IF v_question_order IS NULL OR array_length(v_question_order, 1) = 0 THEN
    RETURN v_answers;
  END IF;
  
  -- Build answers based on question order
  FOR v_response IN
    SELECT 
      question_id,
      user_answer
    FROM user_question_responses
    WHERE test_session_id = p_session_id
      AND user_answer IS NOT NULL
  LOOP
    -- Find the index of this question in the order
    SELECT array_position(v_question_order, v_response.question_id::UUID) - 1 
    INTO v_question_index;
    
    -- Add to answers if found in order
    IF v_question_index IS NOT NULL AND v_question_index >= 0 THEN
      v_answers := v_answers || jsonb_build_object(
        v_question_index::TEXT, 
        v_response.user_answer
      );
    END IF;
  END LOOP;
  
  RETURN v_answers;
END;
$$;

COMMIT; 