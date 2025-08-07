-- WARNING: This will permanently delete user attempts for writing questions
-- Make sure to backup data if needed before running this script

-- First, let's see what we're about to delete (run this first to preview)
SELECT 
    'PREVIEW - Records to be deleted' as action,
    COUNT(*) as total_responses_to_delete,
    COUNT(DISTINCT qr.question_id) as unique_writing_questions,
    COUNT(DISTINCT ta.user_id) as affected_users
FROM question_responses qr
JOIN questions q ON qr.question_id = q.id
LEFT JOIN test_attempts ta ON qr.attempt_id = ta.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%';

-- Show breakdown by test type
SELECT 
    'PREVIEW by test type' as action,
    q.test_type,
    q.section_name,
    COUNT(qr.*) as responses_to_delete,
    COUNT(DISTINCT qr.question_id) as unique_questions,
    COUNT(DISTINCT ta.user_id) as affected_users
FROM question_responses qr
JOIN questions q ON qr.question_id = q.id
LEFT JOIN test_attempts ta ON qr.attempt_id = ta.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%'
GROUP BY q.test_type, q.section_name
ORDER BY q.test_type, q.section_name;

-- ACTUAL DELETION COMMANDS (uncomment to execute)
-- Step 1: Delete question responses for writing questions
/*
DELETE FROM question_responses 
WHERE question_id IN (
    SELECT id 
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
);
*/

-- Step 2: Delete writing assessments if they exist
/*
DELETE FROM writing_assessments 
WHERE question_id IN (
    SELECT id 
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
);
*/

-- Step 3: Clean up drill sessions that might reference writing questions
/*
DELETE FROM drill_sessions 
WHERE question_id IN (
    SELECT id 
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
);
*/

-- Step 4: Update or delete test attempts that might be affected
-- (This is more complex - you might want to handle this separately)
/*
UPDATE test_attempts 
SET status = 'incomplete'
WHERE id IN (
    SELECT DISTINCT ta.id
    FROM test_attempts ta
    JOIN question_responses qr ON ta.id = qr.attempt_id
    JOIN questions q ON qr.question_id = q.id
    WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%'
);
*/

-- Verification query (run after deletion to confirm)
/*
SELECT 
    'POST-DELETION CHECK' as status,
    COUNT(*) as remaining_writing_responses
FROM question_responses qr
JOIN questions q ON qr.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%';
*/