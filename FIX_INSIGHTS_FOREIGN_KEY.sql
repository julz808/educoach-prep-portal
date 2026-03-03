-- ============================================================================
-- FIX: Insights Section Foreign Key Constraint
-- ============================================================================
--
-- This migration fixes the foreign key constraint on question_attempt_history
-- to point to questions_v2 instead of the old questions table.
--
-- ISSUE: Question responses fail to save because FK points to wrong table
-- IMPACT: Insights shows 0/0 or 0/50 instead of correct scores
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

-- Step 1: Drop the old foreign key constraint that points to 'questions' table
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- Step 2: Add new foreign key constraint that points to 'questions_v2' table
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;

-- ============================================================================
-- Migration Complete!
-- ============================================================================
--
-- NEXT STEPS:
-- 1. Complete a new test section in your app
-- 2. Go to Insights page
-- 3. Verify scores now show correctly (e.g., 8/50 instead of 0/50)
--
-- VERIFICATION:
-- Run this in your terminal to test the fix:
--   npx tsx scripts/test-question-attempt-insert.ts
--
-- You should see: ✅ INSERT SUCCESSFUL!
-- ============================================================================
