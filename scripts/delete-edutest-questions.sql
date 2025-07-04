-- ============================================================================
-- DELETE ALL EDUTEST SCHOLARSHIP QUESTIONS
-- ============================================================================
-- This script safely removes all questions for EduTest Scholarship (Year 7 Entry)
-- with comprehensive logging and safety checks

-- SAFETY NOTICE:
-- This will permanently delete ALL questions for EduTest Scholarship (Year 7 Entry)
-- including Practice Tests 1-5, Diagnostic, and all Drill questions
-- This action CANNOT be undone!

-- Step 1: Check what will be deleted (REVIEW THIS BEFORE PROCEEDING)
SELECT 
    'QUESTIONS TO BE DELETED - REVIEW CAREFULLY' as notice,
    test_mode,
    section_name,
    sub_skill,
    difficulty,
    COUNT(*) as question_count,
    MIN(created_at) as oldest_question,
    MAX(created_at) as newest_question
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
GROUP BY test_mode, section_name, sub_skill, difficulty
ORDER BY test_mode, section_name, sub_skill, difficulty;

-- Step 2: Overall summary
SELECT 
    'DELETION SUMMARY' as notice,
    COUNT(*) as total_questions_to_delete,
    COUNT(DISTINCT test_mode) as test_modes_affected,
    COUNT(DISTINCT section_name) as sections_affected,
    COUNT(DISTINCT sub_skill) as sub_skills_affected,
    MIN(created_at) as oldest_question_date,
    MAX(created_at) as newest_question_date
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)';

-- Step 3: Check for any passages that reference these questions
SELECT 
    'PASSAGES THAT MAY BE AFFECTED' as notice,
    COUNT(DISTINCT p.id) as passages_count,
    COUNT(q.id) as questions_with_passages
FROM questions q
LEFT JOIN passages p ON q.passage_id = p.id
WHERE q.test_type = 'EduTest Scholarship (Year 7 Entry)'
  AND q.passage_id IS NOT NULL;

-- Step 4: Check for user progress that references these questions
-- (This helps understand potential impact on user data)
SELECT 
    'USER PROGRESS POTENTIALLY AFFECTED' as notice,
    COUNT(DISTINCT user_id) as users_with_progress,
    COUNT(*) as total_attempt_records
FROM question_attempt_history 
WHERE question_id IN (
    SELECT id FROM questions 
    WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
);

-- ============================================================================
-- ACTUAL DELETION COMMANDS
-- ============================================================================
-- UNCOMMENT THE SECTIONS BELOW TO PERFORM THE DELETION
-- DO NOT UNCOMMENT UNLESS YOU ARE CERTAIN YOU WANT TO DELETE ALL EDUTEST QUESTIONS

/*
-- Step 5A: Delete question attempt history first (foreign key constraint)
DELETE FROM question_attempt_history 
WHERE question_id IN (
    SELECT id FROM questions 
    WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
);

-- Get deletion count for logging
SELECT 
    'QUESTION ATTEMPTS DELETED' as notice,
    ROW_COUNT() as records_deleted;

-- Step 5B: Delete the questions themselves
DELETE FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)';

-- Get deletion count for logging
SELECT 
    'QUESTIONS DELETED' as notice,
    ROW_COUNT() as questions_deleted;

-- Step 5C: Optionally delete orphaned passages
-- (Only delete passages that are no longer referenced by any questions)
DELETE FROM passages 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
  AND id NOT IN (
    SELECT DISTINCT passage_id 
    FROM questions 
    WHERE passage_id IS NOT NULL
  );

-- Get deletion count for logging
SELECT 
    'ORPHANED PASSAGES DELETED' as notice,
    ROW_COUNT() as passages_deleted;
*/

-- ============================================================================
-- POST-DELETION VERIFICATION
-- ============================================================================
-- Run these queries after deletion to verify it worked correctly

-- Verify no EduTest questions remain
SELECT 
    'POST-DELETION VERIFICATION' as notice,
    COUNT(*) as remaining_edutest_questions
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)';

-- Check other test types are unaffected
SELECT 
    'OTHER TEST TYPES VERIFICATION' as notice,
    test_type,
    COUNT(*) as question_count
FROM questions 
WHERE test_type != 'EduTest Scholarship (Year 7 Entry)'
GROUP BY test_type
ORDER BY test_type;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
/*

BEFORE RUNNING THIS SCRIPT:

1. REVIEW THE PREVIEW QUERIES
   - Run the first 4 SELECT statements to see what will be deleted
   - Verify this matches your expectations

2. BACKUP CONSIDERATIONS
   - Consider backing up the questions table first
   - User progress data will lose references to these questions

3. IMPACT ASSESSMENT
   - Review how many users have attempted these questions
   - Consider the impact on user progress tracking

TO PERFORM THE DELETION:

1. Uncomment the deletion section (remove /* and */)
2. Run the script in Supabase SQL Editor
3. Review the post-deletion verification queries

ALTERNATIVE METHODS:

Option 1: Use the command-line tool (RECOMMENDED):
npm run cleanup-questions -- --test-type "EduTest Scholarship (Year 7 Entry)"

Option 2: Use the command-line tool with dry-run first:
npm run cleanup-questions -- --test-type "EduTest Scholarship (Year 7 Entry)" --dry-run

Option 3: Delete section by section:
npm run cleanup-questions -- --test-type "EduTest Scholarship (Year 7 Entry)" --section "Verbal Reasoning"

The command-line tools provide better safety checks, logging, and error handling.

*/