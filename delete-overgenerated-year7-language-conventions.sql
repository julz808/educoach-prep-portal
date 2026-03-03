-- ============================================================================
-- DELETE OVER-GENERATED YEAR 7 NAPLAN LANGUAGE CONVENTIONS QUESTIONS
-- ============================================================================
--
-- PROBLEM: The script over-generated questions across multiple test modes:
--   - practice_1: 85/45 questions (40 over)
--   - practice_2: 75/45 questions (30 over)
--   - practice_3: 79/45 questions (34 over)
--   - practice_4: 81/45 questions (36 over)
--   - practice_5: 45/45 questions (✓ correct)
--   - diagnostic: 37/45 questions (8 under)
--
-- SOLUTION: Delete the MOST RECENTLY generated questions (by created_at DESC)
--           to bring each mode back to exactly 45 questions.
--
-- BACKUP: Before running this script, backup the data:
--   SELECT * FROM questions_v2
--   WHERE test_type = 'Year 7 NAPLAN'
--     AND section_name = 'Language Conventions'
--   ORDER BY test_mode, created_at DESC;
--
-- ============================================================================

-- practice_1: Delete 40 most recent questions (85 → 45)
DELETE FROM questions_v2
WHERE id IN (
  SELECT id
  FROM questions_v2
  WHERE test_type = 'Year 7 NAPLAN'
    AND section_name = 'Language Conventions'
    AND test_mode = 'practice_1'
  ORDER BY created_at DESC
  LIMIT 40
);

-- practice_2: Delete 30 most recent questions (75 → 45)
DELETE FROM questions_v2
WHERE id IN (
  SELECT id
  FROM questions_v2
  WHERE test_type = 'Year 7 NAPLAN'
    AND section_name = 'Language Conventions'
    AND test_mode = 'practice_2'
  ORDER BY created_at DESC
  LIMIT 30
);

-- practice_3: Delete 34 most recent questions (79 → 45)
DELETE FROM questions_v2
WHERE id IN (
  SELECT id
  FROM questions_v2
  WHERE test_type = 'Year 7 NAPLAN'
    AND section_name = 'Language Conventions'
    AND test_mode = 'practice_3'
  ORDER BY created_at DESC
  LIMIT 34
);

-- practice_4: Delete 36 most recent questions (81 → 45)
DELETE FROM questions_v2
WHERE id IN (
  SELECT id
  FROM questions_v2
  WHERE test_type = 'Year 7 NAPLAN'
    AND section_name = 'Language Conventions'
    AND test_mode = 'practice_4'
  ORDER BY created_at DESC
  LIMIT 36
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after deletion to verify counts:

SELECT
  test_mode,
  COUNT(*) as question_count,
  45 as target,
  COUNT(*) - 45 as difference
FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN'
  AND section_name = 'Language Conventions'
GROUP BY test_mode
ORDER BY test_mode;

-- Expected result:
--   practice_1: 45 questions (0 difference)
--   practice_2: 45 questions (0 difference)
--   practice_3: 45 questions (0 difference)
--   practice_4: 45 questions (0 difference)
--   practice_5: 45 questions (0 difference)
--   diagnostic: 37 questions (-8 difference)
--
-- Total: 262 questions (need 8 more for diagnostic to reach 270)
