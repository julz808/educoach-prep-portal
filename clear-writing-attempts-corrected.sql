-- CORRECTED: Clear all user attempts for writing questions
-- Based on actual table structure in the database

-- PREVIEW: Check what writing-related user data exists
SELECT 'PREVIEW - Writing Assessments to Delete' as action,
    wa.id as assessment_id,
    q.test_type,
    q.section_name,
    q.test_mode,
    wa.user_id,
    wa.created_at
FROM writing_assessments wa
JOIN questions q ON wa.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%'
ORDER BY q.test_type, q.section_name, q.test_mode;

-- PREVIEW: Summary of what will be deleted
SELECT 'PREVIEW - Summary' as action,
    COUNT(*) as total_writing_assessments,
    COUNT(DISTINCT wa.user_id) as affected_users,
    COUNT(DISTINCT q.id) as writing_questions_with_assessments
FROM writing_assessments wa
JOIN questions q ON wa.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%';

-- PREVIEW: Breakdown by test type
SELECT 'PREVIEW - By Test Type' as action,
    q.test_type,
    q.section_name,
    COUNT(*) as assessments_to_delete,
    COUNT(DISTINCT wa.user_id) as affected_users
FROM writing_assessments wa
JOIN questions q ON wa.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%'
GROUP BY q.test_type, q.section_name
ORDER BY q.test_type, q.section_name;

-- Check if there are any question_responses (even though count was 0)
SELECT 'PREVIEW - Question Responses' as action,
    COUNT(*) as total_responses
FROM question_responses qr
JOIN questions q ON qr.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%';

-- Check drill_sessions for writing questions
SELECT 'PREVIEW - Drill Sessions' as action,
    COUNT(*) as total_drill_sessions
FROM drill_sessions ds
JOIN questions q ON ds.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%';

-- =====================================================
-- ACTUAL DELETION COMMANDS (uncomment to execute)
-- =====================================================

-- Step 1: Delete writing assessments for writing questions
/*
DELETE FROM writing_assessments 
WHERE question_id IN (
    SELECT id 
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
);
*/

-- Step 2: Delete any question responses (if they exist)
/*
DELETE FROM question_responses 
WHERE question_id IN (
    SELECT id 
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
);
*/

-- Step 3: Delete any drill sessions for writing questions
/*
DELETE FROM drill_sessions 
WHERE question_id IN (
    SELECT id 
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
);
*/

-- Step 4: Clean up any test attempts that might be affected
-- (Only if needed - be careful with this)
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

-- =====================================================
-- VERIFICATION QUERIES (run after deletion)
-- =====================================================

-- Verify writing assessments are deleted
/*
SELECT 'POST-DELETION - Writing Assessments' as check,
    COUNT(*) as remaining_assessments
FROM writing_assessments wa
JOIN questions q ON wa.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%';
*/

-- Verify question responses are deleted
/*
SELECT 'POST-DELETION - Question Responses' as check,
    COUNT(*) as remaining_responses
FROM question_responses qr
JOIN questions q ON qr.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%';
*/

-- Verify drill sessions are deleted
/*
SELECT 'POST-DELETION - Drill Sessions' as check,
    COUNT(*) as remaining_drill_sessions
FROM drill_sessions ds
JOIN questions q ON ds.question_id = q.id
WHERE q.section_name ILIKE '%writing%' OR q.section_name ILIKE '%written expression%';
*/