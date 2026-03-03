-- Function to clear test mode progress (practice, drill, or diagnostic)
CREATE OR REPLACE FUNCTION clear_test_mode_progress(
  p_user_id UUID,
  p_product_type TEXT,
  p_test_mode TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First, delete writing assessments for sessions we're about to delete
  DELETE FROM writing_assessments
  WHERE session_id IN (
    SELECT id FROM user_test_sessions
    WHERE user_id = p_user_id
    AND product_type = p_product_type
    AND test_mode ILIKE p_test_mode || '%'
  );

  -- Now delete test sessions for this test mode and product
  DELETE FROM user_test_sessions
  WHERE user_id = p_user_id
    AND product_type = p_product_type
    AND test_mode ILIKE p_test_mode || '%';

  -- If clearing drills or diagnostic, also clear sub-skill performance for this product
  IF p_test_mode IN ('drill', 'diagnostic') THEN
    DELETE FROM user_sub_skill_performance
    WHERE user_id = p_user_id
    AND product_type = p_product_type;
  END IF;

  RAISE NOTICE 'Cleared % progress for product % and user: %', p_test_mode, p_product_type, p_user_id;
END;
$$;

-- Function to clear all progress for a specific product
CREATE OR REPLACE FUNCTION clear_product_progress(
  p_user_id UUID,
  p_product_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First, delete writing assessments (foreign key dependency)
  DELETE FROM writing_assessments
  WHERE session_id IN (
    SELECT id FROM user_test_sessions
    WHERE user_id = p_user_id
    AND product_type = p_product_type
  );

  -- Delete all test sessions for this product
  DELETE FROM user_test_sessions
  WHERE user_id = p_user_id
  AND product_type = p_product_type;

  -- Delete sub-skill performance for this product
  DELETE FROM user_sub_skill_performance
  WHERE user_id = p_user_id
  AND product_type = p_product_type;

  -- Delete user progress for this product
  DELETE FROM user_progress
  WHERE user_id = p_user_id
  AND product_type = p_product_type;

  RAISE NOTICE 'Cleared all progress for product % and user: %', p_product_type, p_user_id;
END;
$$;

-- Function to clear ALL progress across all products
CREATE OR REPLACE FUNCTION clear_all_user_progress(
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First, delete writing assessments (foreign key dependency)
  DELETE FROM writing_assessments
  WHERE session_id IN (
    SELECT id FROM user_test_sessions WHERE user_id = p_user_id
  );

  -- Delete all test sessions
  DELETE FROM user_test_sessions
  WHERE user_id = p_user_id;

  -- Delete all question responses (if table exists, ignore if not)
  BEGIN
    DELETE FROM user_question_responses
    WHERE user_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, skip
    NULL;
  END;

  -- Delete all sub-skill performance
  DELETE FROM user_sub_skill_performance
  WHERE user_id = p_user_id;

  -- Delete all user progress
  DELETE FROM user_progress
  WHERE user_id = p_user_id;

  RAISE NOTICE 'Cleared ALL progress for user: %', p_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION clear_test_mode_progress(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_product_progress(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_all_user_progress(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION clear_test_mode_progress IS 'Clears progress for a specific test mode (practice/drill/diagnostic) within a product. Must be called by the authenticated user.';
COMMENT ON FUNCTION clear_product_progress IS 'Clears all progress for a specific product. Must be called by the authenticated user.';
COMMENT ON FUNCTION clear_all_user_progress IS 'Clears ALL progress across all products. Must be called by the authenticated user.';
