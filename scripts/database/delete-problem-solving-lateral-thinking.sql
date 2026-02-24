-- ============================================================================
-- DELETE PROBLEM SOLVING & LATERAL THINKING QUESTIONS
-- ============================================================================
-- Purpose: Delete all questions for the "Problem Solving & Lateral Thinking"
--          sub-skill from NSW Selective which are producing inappropriate
--          trick questions and logic puzzles
-- Created: 2026-02-20
-- ============================================================================

-- First, let's see what we have
SELECT
  test_type,
  section_name,
  sub_skill,
  test_mode,
  COUNT(*) as question_count,
  STRING_AGG(DISTINCT difficulty::text, ', ') as difficulties
FROM questions_v2
WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
  AND section_name = 'Thinking Skills'
  AND sub_skill = 'Problem Solving & Lateral Thinking'
GROUP BY test_type, section_name, sub_skill, test_mode
ORDER BY test_mode;

-- View a sample of the questions to confirm they are problematic
SELECT
  id,
  test_mode,
  difficulty,
  LEFT(question_text, 100) as question_preview,
  correct_answer,
  created_at
FROM questions_v2
WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
  AND section_name = 'Thinking Skills'
  AND sub_skill = 'Problem Solving & Lateral Thinking'
ORDER BY test_mode, created_at
LIMIT 20;

-- ============================================================================
-- DELETE ALL QUESTIONS
-- ============================================================================
-- Uncomment the following DELETE statement when ready to execute

/*
DELETE FROM questions_v2
WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
  AND section_name = 'Thinking Skills'
  AND sub_skill = 'Problem Solving & Lateral Thinking';
*/

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after deleting to confirm

/*
SELECT COUNT(*) as remaining_count
FROM questions_v2
WHERE test_type = 'NSW Selective Entry (Year 7 Entry)'
  AND section_name = 'Thinking Skills'
  AND sub_skill = 'Problem Solving & Lateral Thinking';

-- Should return 0
*/
