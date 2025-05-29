-- Migration: Add test_mode column to questions table
-- Purpose: Distinguish between diagnostic, drill, and practice test questions

-- Add test_mode column to questions table
ALTER TABLE questions 
ADD COLUMN test_mode VARCHAR NOT NULL DEFAULT 'practice_1' 
CHECK (test_mode IN (
  'diagnostic', 
  'drill', 
  'practice_1', 
  'practice_2', 
  'practice_3', 
  'practice_4', 
  'practice_5'
));

-- Add index for performance when filtering by test_mode
CREATE INDEX idx_questions_test_mode ON questions(test_mode);

-- Add composite index for common query patterns
CREATE INDEX idx_questions_type_mode ON questions(test_type, test_mode);
CREATE INDEX idx_questions_section_mode ON questions(section_name, test_mode);

-- Add comments for documentation
COMMENT ON COLUMN questions.test_mode IS 'Specifies the intended use of the question: diagnostic (assessment), drill (practice), or practice_1-5 (practice tests)';

-- Update existing questions to have a default test_mode
-- This is safe because we're setting a default value
UPDATE questions SET test_mode = 'practice_1' WHERE test_mode IS NULL; 