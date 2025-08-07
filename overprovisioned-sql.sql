-- EXHAUSTIVE LIST OF OVER-PROVISIONED QUESTIONS
-- These sections have too many questions based on curriculum requirements

-- Writing sections with over-provisioning (should typically have 1-2 questions max for diagnostic/practice, or 6-24 for drills)
SELECT 
    test_type,
    test_mode, 
    section_name,
    COUNT(*) as question_count,
    CASE 
        WHEN test_mode = 'drill' THEN 'Expected: 6-24 for drills'
        WHEN test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5') THEN 'Expected: 1-2 for diagnostic/practice'
        ELSE 'Unknown mode'
    END as expected_range
FROM questions 
WHERE (section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%')
  AND (
    (test_mode IN ('diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5') AND COUNT(*) > 2)
    OR (test_mode = 'drill' AND COUNT(*) > 6)  -- Some drill writing sections may need more
  )
GROUP BY test_type, test_mode, section_name
HAVING COUNT(*) > 2 OR (test_mode = 'drill' AND COUNT(*) > 6)
ORDER BY test_type, test_mode, section_name;

-- All writing sections counts for reference
SELECT 
    test_type,
    section_name,
    test_mode,
    COUNT(*) as question_count
FROM questions 
WHERE section_name ILIKE '%writing%' OR section_name ILIKE '%written expression%'
GROUP BY test_type, section_name, test_mode
ORDER BY test_type, section_name, test_mode;

-- Specific over-provisioned combinations based on analysis:

-- 1. Year 5 NAPLAN Writing (should be 1 question per mode)
SELECT 'Year 5 NAPLAN Writing - OVER-PROVISIONED' as issue, test_mode, COUNT(*) as actual, 1 as expected
FROM questions 
WHERE test_type = 'Year 5 NAPLAN' AND section_name = 'Writing'
GROUP BY test_mode
HAVING COUNT(*) > 1;

-- 2. Year 7 NAPLAN Writing (should be 1 question per mode)  
SELECT 'Year 7 NAPLAN Writing - OVER-PROVISIONED' as issue, test_mode, COUNT(*) as actual, 1 as expected
FROM questions 
WHERE test_type = 'Year 7 NAPLAN' AND section_name = 'Writing'
GROUP BY test_mode
HAVING COUNT(*) > 1;

-- 3. NSW Selective Writing (should be 1 question per diagnostic/practice, 24 for drill)
SELECT 'NSW Selective Writing - OVER-PROVISIONED' as issue, test_mode, COUNT(*) as actual,
    CASE 
        WHEN test_mode = 'drill' THEN 24
        ELSE 1 
    END as expected
FROM questions 
WHERE test_type = 'NSW Selective Entry (Year 7 Entry)' AND section_name = 'Writing'
GROUP BY test_mode
HAVING (test_mode != 'drill' AND COUNT(*) > 1) OR (test_mode = 'drill' AND COUNT(*) > 24);

-- 4. VIC Selective Writing (should be 2 questions per diagnostic/practice, 12 for drill)
SELECT 'VIC Selective Writing - OVER-PROVISIONED' as issue, test_mode, COUNT(*) as actual,
    CASE 
        WHEN test_mode = 'drill' THEN 12
        ELSE 2 
    END as expected
FROM questions 
WHERE test_type = 'VIC Selective Entry (Year 9 Entry)' AND section_name = 'Writing'
GROUP BY test_mode
HAVING (test_mode != 'drill' AND COUNT(*) > 2) OR (test_mode = 'drill' AND COUNT(*) > 12);

-- 5. ACER Written Expression (should be 1 question per diagnostic/practice, 24 for drill)
SELECT 'ACER Written Expression - OVER-PROVISIONED' as issue, test_mode, COUNT(*) as actual,
    CASE 
        WHEN test_mode = 'drill' THEN 24
        ELSE 1 
    END as expected
FROM questions 
WHERE test_type = 'ACER Scholarship (Year 7 Entry)' AND section_name = 'Written Expression'
GROUP BY test_mode
HAVING (test_mode != 'drill' AND COUNT(*) > 1) OR (test_mode = 'drill' AND COUNT(*) > 24);

-- 6. EduTest Written Expression (should be 2 questions per diagnostic/practice, 30 for drill)
SELECT 'EduTest Written Expression - OVER-PROVISIONED' as issue, test_mode, COUNT(*) as actual,
    CASE 
        WHEN test_mode = 'drill' THEN 30
        ELSE 2 
    END as expected
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' AND section_name = 'Written Expression'
GROUP BY test_mode
HAVING (test_mode != 'drill' AND COUNT(*) > 2) OR (test_mode = 'drill' AND COUNT(*) > 30);