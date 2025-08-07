-- Get question counts by test_type, test_mode, and section
SELECT 
    test_type,
    test_mode,
    section_name,
    COUNT(*) as question_count
FROM questions
WHERE test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5')
GROUP BY test_type, test_mode, section_name
ORDER BY test_type, test_mode, section_name;

-- Summary by test_type and test_mode only
SELECT 
    test_type,
    test_mode,
    COUNT(*) as total_questions
FROM questions
WHERE test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5')
GROUP BY test_type, test_mode
ORDER BY test_type, test_mode;

-- Grand total by test_type
SELECT 
    test_type,
    COUNT(*) as total_questions_all_modes
FROM questions
WHERE test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5')
GROUP BY test_type
ORDER BY test_type;

-- Overall summary
SELECT 
    COUNT(DISTINCT test_type) as unique_test_types,
    COUNT(DISTINCT test_mode) as unique_test_modes,
    COUNT(*) as total_questions
FROM questions
WHERE test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5');