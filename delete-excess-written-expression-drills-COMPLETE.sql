-- DELETE EXCESS WRITTEN EXPRESSION DRILL QUESTIONS FOR EDUTEST - COMPLETE VERSION
-- 
-- This script reduces Written Expression drill questions from 2 per difficulty level 
-- per sub-skill down to 1 per difficulty level per sub-skill for EduTest Scholarship
--
-- Target: EduTest Scholarship (Year 7 Entry), drill mode, Written Expression section
-- Handles ALL foreign key constraints: question_attempt_history AND writing_assessments

-- First, let's see what we're working with (for verification)
-- Uncomment this section to review before deletion:

SELECT 
    sub_skill,
    difficulty,
    COUNT(*) as question_count,
    STRING_AGG(id::text, ', ' ORDER BY created_at DESC) as question_ids
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
  AND test_mode = 'drill'
  AND section_name = 'Written Expression'
GROUP BY sub_skill, difficulty
ORDER BY sub_skill, difficulty;


-- STEP 1: Delete related writing_assessments records
-- This prevents foreign key constraint violations from writing_assessments table
WITH questions_to_delete AS (
    SELECT 
        id,
        sub_skill,
        difficulty,
        ROW_NUMBER() OVER (
            PARTITION BY sub_skill, difficulty 
            ORDER BY created_at DESC
        ) as rn
    FROM questions 
    WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
      AND test_mode = 'drill'
      AND section_name = 'Written Expression'
)
DELETE FROM writing_assessments 
WHERE question_id IN (
    SELECT id 
    FROM questions_to_delete 
    WHERE rn > 1  -- Delete assessments for questions we're about to remove
);

-- STEP 2: Delete related question_attempt_history records
-- This prevents foreign key constraint violations from question_attempt_history table
WITH questions_to_delete AS (
    SELECT 
        id,
        sub_skill,
        difficulty,
        ROW_NUMBER() OVER (
            PARTITION BY sub_skill, difficulty 
            ORDER BY created_at DESC
        ) as rn
    FROM questions 
    WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
      AND test_mode = 'drill'
      AND section_name = 'Written Expression'
)
DELETE FROM question_attempt_history 
WHERE question_id IN (
    SELECT id 
    FROM questions_to_delete 
    WHERE rn > 1  -- Delete attempts for questions we're about to remove
);

-- STEP 3: Now delete the excess questions - keep the most recently created question per sub_skill/difficulty
WITH questions_to_delete AS (
    SELECT 
        id,
        sub_skill,
        difficulty,
        ROW_NUMBER() OVER (
            PARTITION BY sub_skill, difficulty 
            ORDER BY created_at DESC
        ) as rn
    FROM questions 
    WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
      AND test_mode = 'drill'
      AND section_name = 'Written Expression'
)
DELETE FROM questions 
WHERE id IN (
    SELECT id 
    FROM questions_to_delete 
    WHERE rn > 1  -- Keep only the first (most recent) question per group
);

-- Verification query - run this after deletion to confirm results
-- Should show exactly 1 question per sub_skill/difficulty combination
SELECT 
    sub_skill,
    difficulty,
    COUNT(*) as remaining_questions,
    STRING_AGG(id::text, ', ') as question_ids
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
  AND test_mode = 'drill'
  AND section_name = 'Written Expression'
GROUP BY sub_skill, difficulty
ORDER BY sub_skill, difficulty;

-- Summary of what was deleted
SELECT 
    CONCAT('Deleted excess Written Expression drill questions for EduTest. ',
           'Each sub-skill/difficulty combination now has exactly 1 question.') as summary;