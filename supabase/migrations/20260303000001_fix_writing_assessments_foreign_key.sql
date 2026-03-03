-- Fix writing_assessments foreign key constraint
-- Writing questions can be dynamically generated and may not exist in questions table
-- Remove the foreign key constraint to allow storing assessments for any question

-- Drop the foreign key constraint on question_id
ALTER TABLE writing_assessments
  DROP CONSTRAINT IF EXISTS writing_assessments_question_id_fkey;

-- Keep question_id as NOT NULL UUID but without foreign key constraint
-- This allows us to store assessments for dynamically generated writing questions
-- that may not be in the questions or questions_v2 tables

COMMENT ON COLUMN writing_assessments.question_id IS 'UUID of the question - may reference questions, questions_v2, or be a dynamically generated question ID';
