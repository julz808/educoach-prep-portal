-- Manual fix for registration timing issue
-- Run this in Supabase SQL Editor if registration errors persist

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
  v_max_retries INTEGER := 10;
BEGIN
  -- Wait for auth.users record to be available (timing fix)
  WHILE NOT v_user_exists AND v_retry_count < v_max_retries LOOP
    -- Check if user exists in auth.users table
    SELECT EXISTS(
      SELECT 1 FROM auth.users WHERE id = p_user_id
    ) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
      -- Wait 500ms before retrying
      PERFORM pg_sleep(0.5);
      v_retry_count := v_retry_count + 1;
    END IF;
  END LOOP;
  
  -- If user still doesn't exist after retries, return error
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth system after retries',
      'retry_count', v_retry_count
    );
  END IF;

  -- Insert user profile (now that we know user exists)
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
  v_result := jsonb_build_object(
    'success', true,
    'message', 'User registered successfully',
    'retry_count', v_retry_count
  );
  
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Return error with more details
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE,
    'user_exists_check', v_user_exists,
    'retry_count', v_retry_count
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;