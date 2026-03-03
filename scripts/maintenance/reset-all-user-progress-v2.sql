-- ============================================================================
-- RESET ALL USER PROGRESS FOR V2 MIGRATION
-- ============================================================================
-- Date: 2026-03-04
-- Purpose: Clear all user progress data to provide a fresh start with V2 questions
--
-- SAFETY: This script ONLY deletes progress data. It preserves:
--   ✅ user_profiles (account details, names, emails)
--   ✅ user_products (product access, subscriptions)
--   ✅ pending_purchases (payment records)
--   ✅ auth.users (authentication data)
--   ✅ questions_v2 and passages_v2 (the new question bank)
--
-- DELETES (Progress Data Only):
--   ❌ writing_assessments (written responses)
--   ❌ user_test_sessions (all test sessions)
--   ❌ question_attempt_history (individual question attempts)
--   ❌ user_sub_skill_performance (skill performance metrics)
--   ❌ user_progress (overall progress tracking)
-- ============================================================================

BEGIN;

-- Log the operation
DO $$
DECLARE
  writing_count INTEGER;
  session_count INTEGER;
  attempt_count INTEGER;
  skill_count INTEGER;
  progress_count INTEGER;
BEGIN
  -- Count records before deletion
  SELECT COUNT(*) INTO writing_count FROM writing_assessments;
  SELECT COUNT(*) INTO session_count FROM user_test_sessions;
  SELECT COUNT(*) INTO attempt_count FROM question_attempt_history;
  SELECT COUNT(*) INTO skill_count FROM user_sub_skill_performance;
  SELECT COUNT(*) INTO progress_count FROM user_progress;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'STARTING V2 PROGRESS RESET - % UTC', NOW();
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Records to be deleted:';
  RAISE NOTICE '  - writing_assessments: %', writing_count;
  RAISE NOTICE '  - user_test_sessions: %', session_count;
  RAISE NOTICE '  - question_attempt_history: %', attempt_count;
  RAISE NOTICE '  - user_sub_skill_performance: %', skill_count;
  RAISE NOTICE '  - user_progress: %', progress_count;
  RAISE NOTICE '  - TOTAL: %', writing_count + session_count + attempt_count + skill_count + progress_count;
  RAISE NOTICE '============================================================================';
END $$;

-- Step 1: Delete writing assessments (must be first due to foreign key dependencies)
DELETE FROM writing_assessments;

-- Step 2: Delete all test sessions (diagnostic, practice, drill)
DELETE FROM user_test_sessions;

-- Step 3: Delete all question attempt history
DELETE FROM question_attempt_history;

-- Step 4: Delete all sub-skill performance data
DELETE FROM user_sub_skill_performance;

-- Step 5: Delete all user progress records
DELETE FROM user_progress;

-- Step 6: Delete drill_sessions if it exists (newer table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'drill_sessions'
  ) THEN
    DELETE FROM drill_sessions;
    RAISE NOTICE 'Deleted all drill_sessions';
  ELSE
    RAISE NOTICE 'drill_sessions table does not exist, skipping';
  END IF;
END $$;

-- Verify deletion
DO $$
DECLARE
  writing_count INTEGER;
  session_count INTEGER;
  attempt_count INTEGER;
  skill_count INTEGER;
  progress_count INTEGER;
  user_count INTEGER;
  profile_count INTEGER;
  product_count INTEGER;
BEGIN
  -- Count remaining records (should be 0)
  SELECT COUNT(*) INTO writing_count FROM writing_assessments;
  SELECT COUNT(*) INTO session_count FROM user_test_sessions;
  SELECT COUNT(*) INTO attempt_count FROM question_attempt_history;
  SELECT COUNT(*) INTO skill_count FROM user_sub_skill_performance;
  SELECT COUNT(*) INTO progress_count FROM user_progress;

  -- Count preserved records (should be unchanged)
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  SELECT COUNT(*) INTO product_count FROM user_products;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RESET COMPLETED - % UTC', NOW();
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Remaining progress records (should be 0):';
  RAISE NOTICE '  - writing_assessments: %', writing_count;
  RAISE NOTICE '  - user_test_sessions: %', session_count;
  RAISE NOTICE '  - question_attempt_history: %', attempt_count;
  RAISE NOTICE '  - user_sub_skill_performance: %', skill_count;
  RAISE NOTICE '  - user_progress: %', progress_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Preserved user data (should be unchanged):';
  RAISE NOTICE '  - auth.users: %', user_count;
  RAISE NOTICE '  - user_profiles: %', profile_count;
  RAISE NOTICE '  - user_products: %', product_count;
  RAISE NOTICE '============================================================================';

  -- Safety check: ensure we still have users
  IF user_count = 0 THEN
    RAISE EXCEPTION 'CRITICAL ERROR: No users found! Rolling back...';
  END IF;

  -- Verify progress was actually deleted
  IF writing_count > 0 OR session_count > 0 OR attempt_count > 0 OR skill_count > 0 OR progress_count > 0 THEN
    RAISE WARNING 'WARNING: Some progress records still remain. Please investigate.';
  ELSE
    RAISE NOTICE '✅ SUCCESS: All user progress has been reset!';
    RAISE NOTICE '✅ All user accounts and profiles are preserved!';
    RAISE NOTICE '✅ Ready for V2 questions!';
  END IF;

END $$;

COMMIT;

-- ============================================================================
-- POST-RESET VERIFICATION QUERIES
-- ============================================================================
-- Run these after the script completes to verify success:
--
-- 1. Check progress tables are empty:
--    SELECT COUNT(*) FROM writing_assessments;
--    SELECT COUNT(*) FROM user_test_sessions;
--    SELECT COUNT(*) FROM question_attempt_history;
--    SELECT COUNT(*) FROM user_sub_skill_performance;
--    SELECT COUNT(*) FROM user_progress;
--
-- 2. Check user data is preserved:
--    SELECT COUNT(*) FROM auth.users;
--    SELECT COUNT(*) FROM user_profiles;
--    SELECT COUNT(*) FROM user_products;
--
-- 3. Check V2 questions are available:
--    SELECT COUNT(*) FROM questions_v2;
--    SELECT COUNT(*) FROM passages_v2;
-- ============================================================================
