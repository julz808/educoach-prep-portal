-- ============================================================================
-- DELETE QUESTIONS WITH OLD/INCORRECT SUB-SKILL NAMES
-- Year 7 NAPLAN - Language Conventions
-- ============================================================================
--
-- STRATEGY: Delete questions with OLD sub-skill names, keep questions with
--           CORRECT sub-skill names (as defined in curriculumData_v2 config)
--
-- CORRECT SUB-SKILLS (from curriculumData_v2/sectionConfigurations.ts):
--   1. Advanced Spelling & Orthography
--   2. Sophisticated Grammar
--   3. Advanced Punctuation
--   4. Advanced Vocabulary & Usage
--   5. Advanced Editing Skills
--   6. Complex Syntax Analysis
--
-- OLD/INCORRECT SUB-SKILLS (to be deleted):
--   1. Punctuation & Sentence Boundaries (66 questions)
--   2. Vocabulary Precision & Usage (66 questions)
--   3. Advanced Grammar & Sentence Structure (50 questions)
--   4. Spelling & Word Formation (66 questions)
--
-- TOTAL TO DELETE: 248 questions
-- REMAINING AFTER DELETION: 350 questions
--   - Practice & Diagnostic modes: 170/270 (100 still needed)
--   - Drill mode: 180 questions
--
-- After running this script, you'll need to generate the remaining 100
-- questions using the fixed generation script.
--
-- ============================================================================

-- BACKUP FIRST (Optional but recommended)
-- Copy this query result before deletion:
--
-- SELECT *
-- FROM questions_v2
-- WHERE test_type = 'Year 7 NAPLAN'
--   AND section_name = 'Language Conventions'
--   AND sub_skill IN (
--     'Punctuation & Sentence Boundaries',
--     'Vocabulary Precision & Usage',
--     'Advanced Grammar & Sentence Structure',
--     'Spelling & Word Formation'
--   )
-- ORDER BY test_mode, sub_skill, created_at;

-- ============================================================================
-- DELETION QUERY
-- ============================================================================

DELETE FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN'
  AND section_name = 'Language Conventions'
  AND sub_skill IN (
    'Punctuation & Sentence Boundaries',
    'Vocabulary Precision & Usage',
    'Advanced Grammar & Sentence Structure',
    'Spelling & Word Formation'
  );

-- Expected result: 248 rows deleted

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- 1. Check remaining questions by sub-skill
SELECT
  sub_skill,
  COUNT(*) as question_count
FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN'
  AND section_name = 'Language Conventions'
GROUP BY sub_skill
ORDER BY sub_skill;

-- Expected result: Only the 6 CORRECT sub-skill names should appear

-- 2. Check remaining questions by test mode
SELECT
  test_mode,
  COUNT(*) as question_count,
  CASE
    WHEN test_mode = 'drill' THEN 'N/A'
    ELSE '45'
  END as target
FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN'
  AND section_name = 'Language Conventions'
GROUP BY test_mode
ORDER BY
  CASE test_mode
    WHEN 'practice_1' THEN 1
    WHEN 'practice_2' THEN 2
    WHEN 'practice_3' THEN 3
    WHEN 'practice_4' THEN 4
    WHEN 'practice_5' THEN 5
    WHEN 'diagnostic' THEN 6
    WHEN 'drill' THEN 7
    ELSE 8
  END;

-- Expected result:
--   practice_1: 43 questions (need 2 more)
--   practice_2: 41 questions (need 4 more)
--   practice_3: 38 questions (need 7 more)
--   practice_4: 41 questions (need 4 more)
--   practice_5: 7 questions (need 38 more)
--   diagnostic: 0 questions (need 45 more)
--   drill: 180 questions (correct, drills are separate)

-- 3. Summary check
SELECT
  COUNT(*) as total_questions,
  COUNT(DISTINCT sub_skill) as unique_subskills,
  COUNT(CASE WHEN test_mode != 'drill' THEN 1 END) as practice_diagnostic_count,
  COUNT(CASE WHEN test_mode = 'drill' THEN 1 END) as drill_count
FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN'
  AND section_name = 'Language Conventions';

-- Expected result:
--   total_questions: 350
--   unique_subskills: 6 (all correct names)
--   practice_diagnostic_count: 170
--   drill_count: 180

-- ============================================================================
-- NEXT STEPS AFTER DELETION
-- ============================================================================
--
-- After running this deletion script and verifying the results:
--
-- 1. Generate missing questions for each mode:
--
--    npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
--      --test="Year 7 NAPLAN" \
--      --section="Language Conventions" \
--      --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
--
-- 2. The fixed script will now:
--    - Only count questions with CORRECT sub-skill names
--    - Warn you if it finds unexpected sub-skill names
--    - Generate exactly the right number of questions
--    - NOT over-generate
--
-- ============================================================================
