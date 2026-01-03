-- DELETE ALL READING COMPREHENSION QUESTIONS FOR EDUTEST ONLY
-- This will allow regeneration with the new prose style cycling system
-- and correct passage sharing ratios (1:1 for drills, many:1 for practice/diagnostic)

-- First, let's see what we're about to delete (run this first to verify)
SELECT 
    test_mode,
    COUNT(*) as question_count,
    COUNT(DISTINCT passage_id) as passage_count,
    CASE 
        WHEN COUNT(DISTINCT passage_id) > 0 
        THEN ROUND(COUNT(*)::decimal / COUNT(DISTINCT passage_id), 2)
        ELSE 0 
    END as questions_per_passage_ratio
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' 
    AND section_name = 'Reading Comprehension'
GROUP BY test_mode
ORDER BY test_mode;

-- Also check the passages that will be orphaned
SELECT 
    COUNT(*) as total_passages,
    COUNT(DISTINCT passage_type) as passage_types
FROM passages 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' 
    AND section_name = 'Reading Comprehension';

-- Now delete the questions (uncomment when ready to execute)
-- WARNING: This will permanently delete all EduTest Reading Comprehension questions!

/
DELETE FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' 
    AND section_name = 'Reading Comprehension';
*/

-- Also delete the associated passages to clean up orphaned data
-- (uncomment when ready to execute)

/
DELETE FROM passages 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' 
    AND section_name = 'Reading Comprehension';
*/

-- Verification query (run after deletion to confirm)
-- Should return 0 rows for both questions and passages

/*
SELECT 'questions' as table_name, COUNT(*) as remaining_count
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' 
    AND section_name = 'Reading Comprehension'

UNION ALL

SELECT 'passages' as table_name, COUNT(*) as remaining_count
FROM passages 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' 
    AND section_name = 'Reading Comprehension';
*/

-- After deletion, you can regenerate with:
-- npx tsx scripts/generate-all-remaining-edutest.ts

-- The new generation will ensure:
-- 1. Drill questions have 1:1 passage-to-question ratio (individual mini-passages)
-- 2. Practice/diagnostic tests have multiple questions per passage (5 passages, ~10 questions each)
-- 3. All passages use the new prose style cycling system for authentic variety
-- 4. No more repetitive "Imagine..." or "[Character full name]..." openings