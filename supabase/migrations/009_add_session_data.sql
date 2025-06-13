-- Add session_data column to test_attempts table for storing session metadata
ALTER TABLE test_attempts 
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}';

-- Add index for session_data queries
CREATE INDEX IF NOT EXISTS idx_test_attempts_session_data ON test_attempts USING GIN (session_data);

-- Add comment to explain the session_data column
COMMENT ON COLUMN test_attempts.session_data IS 'Stores session metadata including answers, current_question_index, flagged_questions, time_remaining, and status'; 