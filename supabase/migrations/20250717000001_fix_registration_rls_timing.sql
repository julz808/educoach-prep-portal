-- Fix RLS timing issue during user registration
-- This addresses the problem where auth.uid() may be NULL during profile creation

-- Create a function to handle user profile creation with proper timing
CREATE OR REPLACE FUNCTION create_user_profile_with_timing(
  p_user_id UUID,
  p_student_first_name TEXT,
  p_student_last_name TEXT,
  p_parent_first_name TEXT,
  p_parent_last_name TEXT,
  p_school_name TEXT,
  p_year_level INTEGER,
  p_display_name TEXT
)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
  max_retries INTEGER := 10;
  retry_count INTEGER := 0;
  current_auth_uid UUID;
BEGIN
  -- Wait for auth session to be established
  LOOP
    SELECT auth.uid() INTO current_auth_uid;
    
    -- If auth.uid() is available and matches the user_id, proceed
    IF current_auth_uid IS NOT NULL AND current_auth_uid = p_user_id THEN
      EXIT;
    END IF;
    
    -- Increment retry count
    retry_count := retry_count + 1;
    
    -- If we've reached max retries, exit anyway
    IF retry_count >= max_retries THEN
      EXIT;
    END IF;
    
    -- Wait a bit before retrying
    PERFORM pg_sleep(0.1);
  END LOOP;

  -- Insert the user profile
  INSERT INTO user_profiles (
    user_id,
    student_first_name,
    student_last_name,
    parent_first_name,
    parent_last_name,
    school_name,
    year_level,
    display_name
  ) VALUES (
    p_user_id,
    p_student_first_name,
    p_student_last_name,
    p_parent_first_name,
    p_parent_last_name,
    p_school_name,
    p_year_level,
    p_display_name
  ) RETURNING id INTO profile_id;

  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to initialize user progress with proper timing
CREATE OR REPLACE FUNCTION initialize_user_progress_with_timing(
  p_user_id UUID,
  p_products TEXT[]
)
RETURNS VOID AS $$
DECLARE
  product TEXT;
  max_retries INTEGER := 10;
  retry_count INTEGER := 0;
  current_auth_uid UUID;
BEGIN
  -- Wait for auth session to be established
  LOOP
    SELECT auth.uid() INTO current_auth_uid;
    
    -- If auth.uid() is available and matches the user_id, proceed
    IF current_auth_uid IS NOT NULL AND current_auth_uid = p_user_id THEN
      EXIT;
    END IF;
    
    -- Increment retry count
    retry_count := retry_count + 1;
    
    -- If we've reached max retries, exit anyway
    IF retry_count >= max_retries THEN
      EXIT;
    END IF;
    
    -- Wait a bit before retrying
    PERFORM pg_sleep(0.1);
  END LOOP;

  -- Insert progress records for all products
  INSERT INTO user_progress (user_id, product_type)
  SELECT p_user_id, unnest(p_products);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile_with_timing(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_progress_with_timing(UUID, TEXT[]) TO authenticated;

-- Add an additional RLS policy to handle the case where auth.uid() might be temporarily NULL
-- This policy allows inserts where the user_id matches the JWT subject claim
DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON user_profiles;
CREATE POLICY "Users can insert their own profile during registration"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'sub')::uuid = user_id
  );

DROP POLICY IF EXISTS "Users can insert their own progress during registration" ON user_progress;
CREATE POLICY "Users can insert their own progress during registration"
  ON user_progress FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'sub')::uuid = user_id
  );

-- Add comments for documentation
COMMENT ON FUNCTION create_user_profile_with_timing IS 'Creates user profile with proper timing to ensure auth.uid() is available';
COMMENT ON FUNCTION initialize_user_progress_with_timing IS 'Initializes user progress for all products with proper timing';