-- ============================================================================
-- Backup and Delete Visual Questions
-- ============================================================================
--
-- IMPORTANT: This script will:
-- 1. Create a backup table of all visual questions
-- 2. Delete all visual questions from questions_v2
--
-- Run this AFTER updating curriculum data and V2 engine
-- Run this BEFORE regenerating questions
--
-- Safety: Backup can be restored if needed
-- ============================================================================

-- STEP 1: Create backup table
-- ============================================================================

DROP TABLE IF EXISTS questions_v2_visual_backup;

CREATE TABLE questions_v2_visual_backup AS
SELECT * FROM questions_v2
WHERE has_visual = true;

-- STEP 2: Verify backup
-- ============================================================================

SELECT
  'Backup created' as status,
  COUNT(*) as total_backed_up
FROM questions_v2_visual_backup;

-- Show breakdown by test type
SELECT
  test_type,
  COUNT(*) as count
FROM questions_v2_visual_backup
GROUP BY test_type
ORDER BY test_type;

-- Expected counts:
-- EduTest Scholarship (Year 7 Entry): 145
-- VIC Selective Entry (Year 9 Entry): 85
-- NSW Selective Entry (Year 7 Entry): 66
-- ACER Scholarship (Year 7 Entry): 48
-- TOTAL: 344

-- STEP 3: Delete visual questions
-- ============================================================================

DELETE FROM questions_v2
WHERE has_visual = true;

-- STEP 4: Verify deletion
-- ============================================================================

SELECT
  'Deletion complete' as status,
  COUNT(*) as remaining_visual_questions
FROM questions_v2
WHERE has_visual = true;

-- Should return 0

-- STEP 5: Show remaining question counts
-- ============================================================================

SELECT
  test_type,
  COUNT(*) as remaining_questions
FROM questions_v2
GROUP BY test_type
ORDER BY test_type;

-- ============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================================================
--
-- To restore backed up questions:
--
-- INSERT INTO questions_v2
-- SELECT * FROM questions_v2_visual_backup;
--
-- Then verify:
-- SELECT COUNT(*) FROM questions_v2 WHERE has_visual = true;
-- Should return 344
--
-- ============================================================================
