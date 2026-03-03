-- ============================================================================
-- SQL Script to Delete Over-Generated Writing/Written Expression Questions
-- ============================================================================
-- This script removes excess writing prompts while maintaining balance across
-- writing types (Narrative, Persuasive, Creative, etc.)
--
-- IMPORTANT: Review the questions being deleted before running this!
-- ============================================================================

-- First, let's see what we have for each product
-- Run this SELECT first to review before deleting:

-- ============================================================================
-- PART 1: REVIEW CURRENT WRITING QUESTIONS
-- ============================================================================

-- Year 5 NAPLAN Writing (Expected: 1 per mode, Have: 1,2,1,3,1,2)
SELECT
  id,
  test_mode,
  question_text,
  CASE
    WHEN question_text ILIKE '%narrative%' OR question_text ILIKE '%story%' OR question_text ILIKE '%imagine%' THEN 'Narrative'
    WHEN question_text ILIKE '%persuasive%' OR question_text ILIKE '%convince%' OR question_text ILIKE '%argue%' THEN 'Persuasive'
    ELSE 'Other'
  END as writing_type
FROM questions_v2
WHERE test_type = 'Year 5 NAPLAN'
  AND section_name = 'Writing'
ORDER BY test_mode, id;

-- Year 7 NAPLAN Writing (Expected: 1 per mode, Have: 1,3,1,3,1,3)
SELECT
  id,
  test_mode,
  question_text,
  CASE
    WHEN question_text ILIKE '%narrative%' OR question_text ILIKE '%story%' OR question_text ILIKE '%imagine%' THEN 'Narrative'
    WHEN question_text ILIKE '%persuasive%' OR question_text ILIKE '%convince%' OR question_text ILIKE '%argue%' THEN 'Persuasive'
    ELSE 'Other'
  END as writing_type
FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN'
  AND section_name = 'Writing'
ORDER BY test_mode, id;

-- NSW Selective Entry Writing (Expected: 1 per mode, Have: 1,2,2,2,2,1)
SELECT
  id,
  test_mode,
  question_text,
  CASE
    WHEN question_text ILIKE '%imaginative%' OR question_text ILIKE '%creative%' OR question_text ILIKE '%story%' THEN 'Imaginative/Creative'
    WHEN question_text ILIKE '%informative%' OR question_text ILIKE '%explain%' THEN 'Informative'
    WHEN question_text ILIKE '%narrative%' THEN 'Narrative'
    WHEN question_text ILIKE '%personal%' OR question_text ILIKE '%reflect%' THEN 'Personal/Reflective'
    WHEN question_text ILIKE '%persuasive%' OR question_text ILIKE '%argue%' THEN 'Persuasive'
    ELSE 'Other'
  END as writing_type
FROM questions_v2
WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
  AND section_name = 'Writing'
ORDER BY test_mode, id;

-- VIC Selective Entry Writing (Expected: 2 per mode, Have: 2,2,3,2,4,2)
SELECT
  id,
  test_mode,
  question_text,
  CASE
    WHEN question_text ILIKE '%creative%' OR question_text ILIKE '%imaginative%' OR question_text ILIKE '%story%' THEN 'Creative'
    WHEN question_text ILIKE '%persuasive%' OR question_text ILIKE '%argue%' OR question_text ILIKE '%convince%' THEN 'Persuasive'
    ELSE 'Other'
  END as writing_type
FROM questions_v2
WHERE test_type = 'VIC Selective Entry (Year 9 Entry)'
  AND section_name = 'Writing'
ORDER BY test_mode, id;

-- ACER Scholarship Written Expression (Expected: 2 per mode, Have: 3,3,3,2,3,2)
SELECT
  id,
  test_mode,
  question_text,
  CASE
    WHEN question_text ILIKE '%creative%' OR question_text ILIKE '%imaginative%' OR question_text ILIKE '%story%' THEN 'Creative'
    WHEN question_text ILIKE '%persuasive%' OR question_text ILIKE '%argue%' OR question_text ILIKE '%convince%' THEN 'Persuasive'
    ELSE 'Other'
  END as writing_type
FROM questions_v2
WHERE test_type = 'ACER Scholarship (Year 7 Entry)'
  AND section_name = 'Written Expression'
ORDER BY test_mode, id;

-- ============================================================================
-- PART 2: DELETE OVER-GENERATED QUESTIONS
-- ============================================================================
-- CAUTION: Review the SELECT results above before running these DELETEs!
-- ============================================================================

-- Strategy: Keep the oldest (lowest ID) questions to maintain consistency
-- Delete newer duplicates to preserve original question sets

-- ----------------------------------------------------------------------------
-- Year 5 NAPLAN - Writing
-- ----------------------------------------------------------------------------
-- Delete 1 from practice_2 (keep oldest)
-- Delete 2 from practice_4 (keep oldest)
-- Delete 1 from diagnostic (keep oldest)

DELETE FROM questions_v2
WHERE id IN (
  -- practice_2: Keep 1, delete 1 (keep the oldest ID)
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'Year 5 NAPLAN'
      AND section_name = 'Writing'
      AND test_mode = 'practice_2'
  ) sub WHERE rn > 1

  UNION

  -- practice_4: Keep 1, delete 2 (keep the oldest ID)
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'Year 5 NAPLAN'
      AND section_name = 'Writing'
      AND test_mode = 'practice_4'
  ) sub WHERE rn > 1

  UNION

  -- diagnostic: Keep 1, delete 1 (keep the oldest ID)
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'Year 5 NAPLAN'
      AND section_name = 'Writing'
      AND test_mode = 'diagnostic'
  ) sub WHERE rn > 1
);

-- ----------------------------------------------------------------------------
-- Year 7 NAPLAN - Writing
-- ----------------------------------------------------------------------------
-- Delete 2 from practice_2 (keep oldest)
-- Delete 2 from practice_4 (keep oldest)
-- Delete 2 from diagnostic (keep oldest)

DELETE FROM questions_v2
WHERE id IN (
  -- practice_2: Keep 1, delete 2
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'Year 7 NAPLAN'
      AND section_name = 'Writing'
      AND test_mode = 'practice_2'
  ) sub WHERE rn > 1

  UNION

  -- practice_4: Keep 1, delete 2
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'Year 7 NAPLAN'
      AND section_name = 'Writing'
      AND test_mode = 'practice_4'
  ) sub WHERE rn > 1

  UNION

  -- diagnostic: Keep 1, delete 2
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'Year 7 NAPLAN'
      AND section_name = 'Writing'
      AND test_mode = 'diagnostic'
  ) sub WHERE rn > 1
);

-- ----------------------------------------------------------------------------
-- NSW Selective Entry - Writing
-- ----------------------------------------------------------------------------
-- Delete 1 from practice_2 (keep oldest)
-- Delete 1 from practice_3 (keep oldest)
-- Delete 1 from practice_4 (keep oldest)
-- Delete 1 from practice_5 (keep oldest)

DELETE FROM questions_v2
WHERE id IN (
  -- practice_2: Keep 1, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
      AND section_name = 'Writing'
      AND test_mode = 'practice_2'
  ) sub WHERE rn > 1

  UNION

  -- practice_3: Keep 1, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
      AND section_name = 'Writing'
      AND test_mode = 'practice_3'
  ) sub WHERE rn > 1

  UNION

  -- practice_4: Keep 1, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
      AND section_name = 'Writing'
      AND test_mode = 'practice_4'
  ) sub WHERE rn > 1

  UNION

  -- practice_5: Keep 1, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
      AND section_name = 'Writing'
      AND test_mode = 'practice_5'
  ) sub WHERE rn > 1
);

-- ----------------------------------------------------------------------------
-- VIC Selective Entry - Writing
-- ----------------------------------------------------------------------------
-- Delete 1 from practice_3 (keep oldest, maintain 1 Creative + 1 Persuasive)
-- Delete 2 from practice_5 (keep oldest, maintain 1 Creative + 1 Persuasive)

DELETE FROM questions_v2
WHERE id IN (
  -- practice_3: Keep 2, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'VIC Selective Entry (Year 9 Entry)'
      AND section_name = 'Writing'
      AND test_mode = 'practice_3'
  ) sub WHERE rn > 2

  UNION

  -- practice_5: Keep 2, delete 2
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'VIC Selective Entry (Year 9 Entry)'
      AND section_name = 'Writing'
      AND test_mode = 'practice_5'
  ) sub WHERE rn > 2
);

-- ----------------------------------------------------------------------------
-- ACER Scholarship - Written Expression
-- ----------------------------------------------------------------------------
-- Delete 1 from practice_1 (keep oldest, maintain 1 Creative + 1 Persuasive)
-- Delete 1 from practice_2 (keep oldest, maintain 1 Creative + 1 Persuasive)
-- Delete 1 from practice_3 (keep oldest, maintain 1 Creative + 1 Persuasive)
-- Delete 1 from practice_5 (keep oldest, maintain 1 Creative + 1 Persuasive)

DELETE FROM questions_v2
WHERE id IN (
  -- practice_1: Keep 2, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'ACER Scholarship (Year 7 Entry)'
      AND section_name = 'Written Expression'
      AND test_mode = 'practice_1'
  ) sub WHERE rn > 2

  UNION

  -- practice_2: Keep 2, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'ACER Scholarship (Year 7 Entry)'
      AND section_name = 'Written Expression'
      AND test_mode = 'practice_2'
  ) sub WHERE rn > 2

  UNION

  -- practice_3: Keep 2, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'ACER Scholarship (Year 7 Entry)'
      AND section_name = 'Written Expression'
      AND test_mode = 'practice_3'
  ) sub WHERE rn > 2

  UNION

  -- practice_5: Keep 2, delete 1
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM questions_v2
    WHERE test_type = 'ACER Scholarship (Year 7 Entry)'
      AND section_name = 'Written Expression'
      AND test_mode = 'practice_5'
  ) sub WHERE rn > 2
);

-- ============================================================================
-- PART 3: VERIFY RESULTS AFTER DELETION
-- ============================================================================

-- Run these SELECTs after deletion to verify correct counts:

SELECT
  'Year 5 NAPLAN - Writing' as section,
  test_mode,
  COUNT(*) as count,
  1 as expected
FROM questions_v2
WHERE test_type = 'Year 5 NAPLAN' AND section_name = 'Writing'
GROUP BY test_mode
ORDER BY test_mode;

SELECT
  'Year 7 NAPLAN - Writing' as section,
  test_mode,
  COUNT(*) as count,
  1 as expected
FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN' AND section_name = 'Writing'
GROUP BY test_mode
ORDER BY test_mode;

SELECT
  'NSW Selective Entry - Writing' as section,
  test_mode,
  COUNT(*) as count,
  1 as expected
FROM questions_v2
WHERE test_type = 'NSW Selective Entry (Year 7 Entry)' AND section_name = 'Writing'
GROUP BY test_mode
ORDER BY test_mode;

SELECT
  'VIC Selective Entry - Writing' as section,
  test_mode,
  COUNT(*) as count,
  2 as expected
FROM questions_v2
WHERE test_type = 'VIC Selective Entry (Year 9 Entry)' AND section_name = 'Writing'
GROUP BY test_mode
ORDER BY test_mode;

SELECT
  'ACER Scholarship - Written Expression' as section,
  test_mode,
  COUNT(*) as count,
  2 as expected
FROM questions_v2
WHERE test_type = 'ACER Scholarship (Year 7 Entry)' AND section_name = 'Written Expression'
GROUP BY test_mode
ORDER BY test_mode;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total questions to be deleted: 17
--   - Year 5 NAPLAN Writing: 4 questions
--   - Year 7 NAPLAN Writing: 6 questions
--   - NSW Selective Entry Writing: 4 questions
--   - VIC Selective Entry Writing: 3 questions
--   - ACER Scholarship Written Expression: 4 questions
-- ============================================================================
