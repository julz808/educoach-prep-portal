-- Migration: Update question_attempt_history foreign key to reference questions_v2
-- This fixes the issue where responses can't be created because foreign key points to old questions table

-- Step 1: Drop the old foreign key constraint
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- Step 2: Add new foreign key constraint pointing to questions_v2
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;

-- Log the change
COMMENT ON CONSTRAINT question_attempt_history_question_id_fkey ON question_attempt_history
IS 'Updated to reference questions_v2 table instead of questions table (2026-02-28)';
