-- Question counts by test_type, section_name, and test_mode (diagnostic + practice tests only)
-- This shows exactly what questions exist in the database

SELECT 
    test_type,
    section_name,
    test_mode,
    COUNT(*) as question_count
FROM questions
WHERE test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5')
GROUP BY test_type, section_name, test_mode
ORDER BY test_type, section_name, test_mode;

-- Pivot table view: Questions per section across all test modes
-- This gives a cleaner view with one row per test/section combination

SELECT 
    test_type,
    section_name,
    SUM(CASE WHEN test_mode = 'diagnostic' THEN 1 ELSE 0 END) as diagnostic,
    SUM(CASE WHEN test_mode = 'practice_1' THEN 1 ELSE 0 END) as practice_1,
    SUM(CASE WHEN test_mode = 'practice_2' THEN 1 ELSE 0 END) as practice_2,
    SUM(CASE WHEN test_mode = 'practice_3' THEN 1 ELSE 0 END) as practice_3,
    SUM(CASE WHEN test_mode = 'practice_4' THEN 1 ELSE 0 END) as practice_4,
    SUM(CASE WHEN test_mode = 'practice_5' THEN 1 ELSE 0 END) as practice_5,
    COUNT(*) as total
FROM questions
WHERE test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5')
GROUP BY test_type, section_name
ORDER BY test_type, section_name;

-- Summary totals by test_type only
SELECT 
    test_type,
    COUNT(*) as total_questions
FROM questions
WHERE test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5')
GROUP BY test_type
ORDER BY test_type;