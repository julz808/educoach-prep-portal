-- Add parent_email column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS parent_email text;

-- Add a check constraint for valid email format (optional) - only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'valid_parent_email' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles
        ADD CONSTRAINT valid_parent_email 
        CHECK (parent_email IS NULL OR parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;