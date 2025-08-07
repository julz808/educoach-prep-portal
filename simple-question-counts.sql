-- Simple count: How many questions per test product for diagnostic + practice tests
SELECT 
    test_type,
    SUM(CASE WHEN test_mode = 'diagnostic' THEN 1 ELSE 0 END) as diagnostic_count,
    SUM(CASE WHEN test_mode = 'practice_1' THEN 1 ELSE 0 END) as practice_1_count,
    SUM(CASE WHEN test_mode = 'practice_2' THEN 1 ELSE 0 END) as practice_2_count,
    SUM(CASE WHEN test_mode = 'practice_3' THEN 1 ELSE 0 END) as practice_3_count,
    SUM(CASE WHEN test_mode = 'practice_4' THEN 1 ELSE 0 END) as practice_4_count,
    SUM(CASE WHEN test_mode = 'practice_5' THEN 1 ELSE 0 END) as practice_5_count,
    COUNT(*) as total_diagnostic_and_practice
FROM questions
WHERE test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5')
GROUP BY test_type
ORDER BY test_type;