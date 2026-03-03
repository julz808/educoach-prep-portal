-- ============================================================================
-- CRITICAL DATABASE MIGRATION: Update Foreign Key to questions_v2
-- ============================================================================
-- This fixes the issue where test responses can't be saved because the
-- foreign key constraint points to the old 'questions' table instead of
-- the new 'questions_v2' table.
--
-- After running this SQL, all test responses will save successfully!
-- ============================================================================

-- Step 1: Drop the old foreign key constraint (points to questions table)
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- Step 2: Add new foreign key constraint (points to questions_v2 table)
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;

-- ============================================================================
-- Migration complete!
--
-- Next steps:
-- 1. Run: npx tsx scripts/fix-numeracy-responses-simple.ts
-- 2. Hard refresh browser (Cmd+Shift+R)
-- 3. Complete a new test section
-- 4. Check insights - should show correct data!
-- ============================================================================
