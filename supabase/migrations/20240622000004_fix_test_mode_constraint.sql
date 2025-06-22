-- Fix test_mode constraint by cleaning up existing data first

-- First, drop the existing constraint
ALTER TABLE user_test_sessions DROP CONSTRAINT IF EXISTS user_test_sessions_test_mode_check;

-- Update any existing 'practice' mode sessions to 'practice_1' 
-- (since we can't determine which specific practice test they were from)
UPDATE user_test_sessions 
SET test_mode = 'practice_1' 
WHERE test_mode = 'practice';

-- Add new constraint with specific practice test modes
ALTER TABLE user_test_sessions ADD CONSTRAINT user_test_sessions_test_mode_check 
CHECK (test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'drill'));