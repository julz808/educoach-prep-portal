-- Phase 3: Supabase RPC Functions for Performance Tracking
-- Atomic updates across multiple tables for consistent performance tracking

-- =============================================================================
-- RECORD QUESTION RESPONSE FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION record_question_response(
  p_user_id UUID,
  p_question_id UUID,
  p_session_id UUID,
  p_product_type VARCHAR,
  p_answer TEXT,
  p_is_correct BOOLEAN,
  p_time_spent INT4
) RETURNS VOID AS $$
DECLARE
  v_sub_skill_id UUID;
BEGIN
  -- Get sub_skill_id from question
  SELECT sub_skill_id INTO v_sub_skill_id FROM questions WHERE id = p_question_id;
  
  -- Insert response
  INSERT INTO user_question_responses (
    user_id, question_id, test_session_id, product_type,
    user_answer, is_correct, time_spent_seconds
  ) VALUES (
    p_user_id, p_question_id, p_session_id, p_product_type,
    p_answer, p_is_correct, p_time_spent
  );
  
  -- Update user_progress
  INSERT INTO user_progress (user_id, product_type, total_questions_completed, total_study_time_seconds, last_activity_at)
  VALUES (p_user_id, p_product_type, 1, p_time_spent, NOW())
  ON CONFLICT (user_id, product_type) 
  DO UPDATE SET 
    total_questions_completed = user_progress.total_questions_completed + 1,
    total_study_time_seconds = user_progress.total_study_time_seconds + p_time_spent,
    last_activity_at = NOW(),
    updated_at = NOW();
  
  -- Update sub_skill performance
  IF v_sub_skill_id IS NOT NULL THEN
    INSERT INTO user_sub_skill_performance (
      user_id, sub_skill_id, product_type, questions_attempted, questions_correct
    ) VALUES (
      p_user_id, v_sub_skill_id, p_product_type, 1, CASE WHEN p_is_correct THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, sub_skill_id, product_type)
    DO UPDATE SET
      questions_attempted = user_sub_skill_performance.questions_attempted + 1,
      questions_correct = user_sub_skill_performance.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
      accuracy_percentage = (user_sub_skill_performance.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::NUMERIC / 
                           (user_sub_skill_performance.questions_attempted + 1) * 100,
      last_updated = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPLETE TEST SESSION FUNCTION
-- =============================================================================

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
  -- Calculate session statistics
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
  
  -- Update test session
  UPDATE test_attempts 
  SET 
    completed_at = NOW(),
    correct_answers = v_total_correct,
    total_questions = v_total_questions,
    section_scores = p_section_scores
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
        (SELECT test_number FROM test_attempts WHERE id = p_session_id)
      ),
      updated_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GET USER DASHBOARD STATS FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_dashboard_stats(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS TABLE (
  total_questions_completed INT4,
  total_study_time_seconds INT4,
  overall_accuracy NUMERIC(5,2),
  streak_days INT4,
  diagnostic_completed BOOLEAN,
  diagnostic_score NUMERIC(5,2),
  practice_tests_completed INT4[],
  last_activity_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.total_questions_completed,
    up.total_study_time_seconds,
    CASE 
      WHEN up.total_questions_completed > 0 THEN
        (SELECT (COUNT(*) FILTER (WHERE is_correct = true)::NUMERIC / COUNT(*)) * 100
         FROM user_question_responses 
         WHERE user_id = p_user_id AND product_type = p_product_type)
      ELSE 0::NUMERIC(5,2)
    END as overall_accuracy,
    up.streak_days,
    up.diagnostic_completed,
    up.diagnostic_score,
    up.practice_tests_completed,
    up.last_activity_at
  FROM user_progress up
  WHERE up.user_id = p_user_id AND up.product_type = p_product_type;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GET SUB-SKILL PERFORMANCE FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_sub_skill_performance(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS TABLE (
  section_name VARCHAR,
  sub_skill_name VARCHAR,
  questions_attempted INT4,
  questions_correct INT4,
  accuracy_percentage NUMERIC(5,2),
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.section_name,
    ss.name as sub_skill_name,
    ussp.questions_attempted,
    ussp.questions_correct,
    ussp.accuracy_percentage,
    ussp.last_updated
  FROM user_sub_skill_performance ussp
  JOIN sub_skills ss ON ss.id = ussp.sub_skill_id
  JOIN test_sections ts ON ts.id = ss.section_id
  WHERE ussp.user_id = p_user_id 
    AND ussp.product_type = p_product_type
    AND ussp.questions_attempted > 0
  ORDER BY ts.section_order, ss.name;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UPDATE STREAK FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_last_activity DATE;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_current_streak INT4;
BEGIN
  -- Get current progress
  SELECT 
    DATE(last_activity_at),
    streak_days
  INTO v_last_activity, v_current_streak
  FROM user_progress 
  WHERE user_id = p_user_id AND product_type = p_product_type;
  
  -- Update streak logic
  IF v_last_activity IS NULL THEN
    -- First activity
    v_current_streak := 1;
  ELSIF v_last_activity = v_yesterday THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_activity = v_today THEN
    -- Same day, no change
    RETURN;
  ELSE
    -- Streak broken
    v_current_streak := 1;
  END IF;
  
  -- Update the streak
  UPDATE user_progress 
  SET 
    streak_days = v_current_streak,
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND product_type = p_product_type;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIALIZE USER PROGRESS FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION initialize_user_progress(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_progress (
    user_id, 
    product_type, 
    created_at, 
    updated_at
  ) VALUES (
    p_user_id, 
    p_product_type, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id, product_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql; 