-- Add all remaining missing database functions that are being called

-- 1. get_session_question_order function
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
  
  RETURN COALESCE(v_question_order, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_user_dashboard_stats function
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(
  p_user_id UUID,
  p_product_type TEXT
)
RETURNS TABLE (
  total_study_time INTEGER,
  current_streak INTEGER,
  diagnostic_completed BOOLEAN,
  practice_tests_completed INTEGER,
  drill_sessions_completed INTEGER,
  overall_accuracy NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.total_study_time_minutes, 0) as total_study_time,
    COALESCE(up.current_streak, 0) as current_streak,
    COALESCE(up.diagnostic_completed, false) as diagnostic_completed,
    COALESCE(up.practice_tests_completed, 0) as practice_tests_completed,
    COALESCE(up.drill_sessions_completed, 0) as drill_sessions_completed,
    COALESCE(up.overall_accuracy_percentage, 0.0) as overall_accuracy
  FROM user_progress up
  WHERE up.user_id = p_user_id AND up.product_type = p_product_type
  LIMIT 1;
  
  -- If no record exists, return default values
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 0, 0, false, 0, 0, 0.0::numeric;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to all functions
GRANT EXECUTE ON FUNCTION get_session_question_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(UUID, TEXT) TO authenticated;
