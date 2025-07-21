-- CHECK IF save_question_attempt FUNCTION EXISTS
-- This will tell us if the function has been deployed to the database

SELECT 
    'FUNCTION EXISTS CHECK' as check_type,
    COUNT(*) as function_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - Function exists'
        ELSE 'NO - Function is missing!'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'save_question_attempt'
AND routine_type = 'FUNCTION';

-- Also check what functions DO exist for question attempts
SELECT 
    'EXISTING QUESTION FUNCTIONS' as check_type,
    routine_name as function_name,
    routine_type as type
FROM information_schema.routines 
WHERE routine_name LIKE '%question%' 
OR routine_name LIKE '%attempt%'
ORDER BY routine_name;