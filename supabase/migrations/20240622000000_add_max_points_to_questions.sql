-- Migration: Add max_points column to questions table for proper scoring system
-- This allows writing questions to have different point values than multiple choice

-- Add max_points column to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS max_points INTEGER DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN questions.max_points IS 'Maximum possible points for this question. Default 1 for multiple choice, varies for writing based on rubric (15-50 points).';

-- Create index for performance when filtering by question type
-- This helps when we need to find all high-value questions
CREATE INDEX IF NOT EXISTS idx_questions_max_points 
ON questions(max_points) 
WHERE max_points > 1;

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'questions' 
    AND column_name = 'max_points'
  ) THEN
    RAISE NOTICE 'Successfully added max_points column to questions table';
  ELSE
    RAISE EXCEPTION 'Failed to add max_points column to questions table';
  END IF;
END $$;