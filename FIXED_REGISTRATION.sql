-- FINAL FIX: Make register_new_user function more lenient and faster
-- This reduces timeout issues while still handling the foreign key constraint properly

CREATE OR REPLACE FUNCTION register_new_user(
  p_user_id UUID,
  p_email TEXT,
  p_student_first_name TEXT,
  p_student_last_name TEXT,
  p_parent_first_name TEXT,
  p_parent_last_name TEXT,
  p_parent_email TEXT,
  p_school_name TEXT,
  p_year_level INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_user_exists BOOLEAN := FALSE;
  v_retry_count INTEGER := 0;
  v_max_retries INTEGER := 3; -- Reduced from 10 to 3
BEGIN
  -- Quick check for auth.users record (reduced retries)
  WHILE NOT v_user_exists AND v_retry_count < v_max_retries LOOP
    SELECT EXISTS(
      SELECT 1 FROM auth.users WHERE id = p_user_id
    ) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
      -- Shorter wait time: 200ms instead of 500ms
      PERFORM pg_sleep(0.2);
      v_retry_count := v_retry_count + 1;
    END IF;
  END LOOP;
  
  -- Don't fail if user doesn't exist yet - just try the insert
  -- The foreign key constraint will handle the actual validation
  
  BEGIN
    -- Insert user profile - let the foreign key constraint handle validation
    INSERT INTO user_profiles (
      user_id,
      student_first_name,
      student_last_name,
      parent_first_name,
      parent_last_name,
      parent_email,
      school_name,
      year_level,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_student_first_name,
      p_student_last_name,
      p_parent_first_name,
      p_parent_last_name,
      p_parent_email,
      p_school_name,
      p_year_level,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      student_first_name = EXCLUDED.student_first_name,
      student_last_name = EXCLUDED.student_last_name,
      parent_first_name = EXCLUDED.parent_first_name,
      parent_last_name = EXCLUDED.parent_last_name,
      parent_email = EXCLUDED.parent_email,
      school_name = EXCLUDED.school_name,
      year_level = EXCLUDED.year_level,
      updated_at = NOW();

  EXCEPTION WHEN foreign_key_violation THEN
    -- If foreign key fails, return a user-friendly message
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Account is still being set up. Please wait a moment and try again.',
      'retry_suggested', true,
      'retry_count', v_retry_count
    );
  END;

  -- Initialize user progress for all products
  INSERT INTO user_progress (
    user_id,
    product_type,
    created_at,
    updated_at
  )
  SELECT 
    p_user_id,
    unnest(ARRAY[
      'VIC Selective Entry (Year 9 Entry)',
      'NSW Selective Entry (Year 7 Entry)',
      'Year 5 NAPLAN',
      'Year 7 NAPLAN',
      'EduTest Scholarship (Year 7 Entry)',
      'ACER Scholarship (Year 7 Entry)'
    ]),
    NOW(),
    NOW()
  ON CONFLICT (user_id, product_type) DO NOTHING;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User registered successfully',
    'retry_count', v_retry_count
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error with details
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE,
    'retry_count', v_retry_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;