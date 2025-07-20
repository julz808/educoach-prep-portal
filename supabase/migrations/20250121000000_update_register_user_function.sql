-- Update the register_new_user function to include parent_email
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
BEGIN
  -- Insert user profile
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
    'message', 'User registered successfully'
  );
  
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Return error
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;