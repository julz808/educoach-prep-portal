-- ============================================================================
-- COMPLETE FIX: Insights Section Foreign Key + Cleanup
-- ============================================================================
--
-- This script does 3 things:
-- 1. Deletes old question attempts that reference the v1 questions table
-- 2. Drops the old foreign key constraint
-- 3. Creates new foreign key constraint pointing to questions_v2
--
-- WHY THIS IS SAFE:
-- - Old attempts are from before the v2 migration (Jan 9-19, 2026)
-- - Current tests use questions_v2 (these old attempts aren't helping)
-- - Test session data is preserved in user_test_sessions
-- - New attempts will be created correctly after this fix
--
-- IMPACT:
-- - Deletes ~1000 old question attempts from 21 users
-- - These were not being used for Insights anyway (wrong table reference)
-- - Fresh attempts will be created when users complete new tests
--
-- HOW TO USE:
-- 1. Copy this entire file
-- 2. Go to: https://supabase.com/dashboard/project/_/sql
-- 3. Click "New Query"
-- 4. Paste this SQL
-- 5. Click "Run" (or press Cmd/Ctrl + Enter)
--
-- Date: 2026-02-28
-- ============================================================================

-- STEP 1: Delete old question attempts that reference questions (v1) table
-- These are preventing the foreign key constraint from being updated
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete attempts where question_id doesn't exist in questions_v2
  DELETE FROM question_attempt_history
  WHERE question_id NOT IN (SELECT id FROM questions_v2);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old question attempts', deleted_count;
END $$;

-- STEP 2: Drop the old foreign key constraint that points to 'questions' table
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- STEP 3: Add new foreign key constraint that points to 'questions_v2' table
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;

-- ============================================================================
-- Migration Complete!
-- ============================================================================
--
-- What was done:
-- ✅ Deleted old question attempts (v1 references)
-- ✅ Dropped old foreign key constraint
-- ✅ Created new foreign key constraint to questions_v2
--
-- NEXT STEPS:
-- 1. Complete a NEW test section in your app
-- 2. Check browser console for DEV-REPLICA logs (should show successful inserts)
-- 3. Go to Insights page
-- 4. Verify scores now show correctly (e.g., 8/50 instead of 0/50)
--
-- VERIFICATION:
-- Run this in your terminal to test the fix:
--   npx tsx scripts/test-question-attempt-insert.ts
--
-- You should see: ✅ INSERT SUCCESSFUL!
-- ============================================================================
