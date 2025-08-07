-- Clear attempts for EXCESS writing questions only (keeping the first question of each type)
-- This targets the over-provisioned writing questions specifically

-- PREVIEW: Show which writing questions will be kept vs deleted
WITH writing_questions_ranked AS (
    SELECT 
        id,
        test_type,
        section_name, 
        test_mode,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY test_type, section_name, test_mode 
            ORDER BY created_at ASC
        ) as question_rank
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
)
SELECT 
    'PREVIEW - Writing Questions Status' as action,
    test_type,
    section_name,
    test_mode,
    question_rank,
    CASE 
        WHEN test_mode = 'drill' THEN
            CASE 
                WHEN test_type = 'Year 5 NAPLAN' AND question_rank <= 12 THEN 'KEEP'
                WHEN test_type = 'Year 7 NAPLAN' AND question_rank <= 12 THEN 'KEEP'
                WHEN test_type = 'NSW Selective Entry (Year 7 Entry)' AND question_rank <= 24 THEN 'KEEP'
                WHEN test_type = 'VIC Selective Entry (Year 9 Entry)' AND question_rank <= 12 THEN 'KEEP'
                WHEN test_type = 'ACER Scholarship (Year 7 Entry)' AND question_rank <= 24 THEN 'KEEP'
                WHEN test_type = 'EduTest Scholarship (Year 7 Entry)' AND question_rank <= 30 THEN 'KEEP'
                ELSE 'DELETE (excess drill)'
            END
        ELSE 
            CASE 
                WHEN test_type LIKE '%NAPLAN%' AND question_rank <= 1 THEN 'KEEP'
                WHEN test_type = 'NSW Selective Entry (Year 7 Entry)' AND question_rank <= 1 THEN 'KEEP'
                WHEN test_type = 'VIC Selective Entry (Year 9 Entry)' AND question_rank <= 2 THEN 'KEEP'
                WHEN test_type = 'ACER Scholarship (Year 7 Entry)' AND question_rank <= 1 THEN 'KEEP'
                WHEN test_type = 'EduTest Scholarship (Year 7 Entry)' AND question_rank <= 2 THEN 'KEEP'
                ELSE 'DELETE (excess diagnostic/practice)'
            END
    END as action_plan,
    id as question_id
FROM writing_questions_ranked
ORDER BY test_type, section_name, test_mode, question_rank;

-- PREVIEW: Count of responses to be deleted
WITH excess_writing_questions AS (
    SELECT 
        id,
        test_type,
        section_name, 
        test_mode,
        ROW_NUMBER() OVER (
            PARTITION BY test_type, section_name, test_mode 
            ORDER BY created_at ASC
        ) as question_rank
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
), questions_to_delete AS (
    SELECT id
    FROM excess_writing_questions
    WHERE 
        (test_mode != 'drill' AND (
            (test_type LIKE '%NAPLAN%' AND question_rank > 1) OR
            (test_type = 'NSW Selective Entry (Year 7 Entry)' AND question_rank > 1) OR
            (test_type = 'VIC Selective Entry (Year 9 Entry)' AND question_rank > 2) OR
            (test_type = 'ACER Scholarship (Year 7 Entry)' AND question_rank > 1) OR
            (test_type = 'EduTest Scholarship (Year 7 Entry)' AND question_rank > 2)
        ))
)
SELECT 
    'PREVIEW - Responses to delete' as action,
    COUNT(*) as total_responses,
    COUNT(DISTINCT qr.question_id) as unique_questions,
    COUNT(DISTINCT ta.user_id) as affected_users
FROM question_responses qr
JOIN questions_to_delete qtd ON qr.question_id = qtd.id
LEFT JOIN test_attempts ta ON qr.attempt_id = ta.id;

-- ACTUAL DELETION (uncomment to execute)
-- Delete responses for excess writing questions only
/*
WITH excess_writing_questions AS (
    SELECT 
        id,
        test_type,
        section_name, 
        test_mode,
        ROW_NUMBER() OVER (
            PARTITION BY test_type, section_name, test_mode 
            ORDER BY created_at ASC
        ) as question_rank
    FROM questions 
    WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
), questions_to_delete AS (
    SELECT id
    FROM excess_writing_questions
    WHERE 
        (test_mode != 'drill' AND (
            (test_type LIKE '%NAPLAN%' AND question_rank > 1) OR
            (test_type = 'NSW Selective Entry (Year 7 Entry)' AND question_rank > 1) OR
            (test_type = 'VIC Selective Entry (Year 9 Entry)' AND question_rank > 2) OR
            (test_type = 'ACER Scholarship (Year 7 Entry)' AND question_rank > 1) OR
            (test_type = 'EduTest Scholarship (Year 7 Entry)' AND question_rank > 2)
        ))
)
DELETE FROM question_responses 
WHERE question_id IN (SELECT id FROM questions_to_delete);
*/