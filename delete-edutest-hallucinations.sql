-- EduTest Hallucinated Questions Removal Script
-- Generated on 2025-07-10T10:43:22.576Z
-- Total hallucinated questions: 6

-- HALLUCINATION BREAKDOWN:
-- practice_5: 3 questions
-- diagnostic: 2 questions
-- practice_3: 1 questions

-- Remove all hallucinated questions
DELETE FROM questions WHERE id IN (
  '61fce27e-db39-429a-8cde-281d6d42581b',
  '612beff8-e464-49cd-895b-03afd287c683',
  'd1731f3c-3e82-4595-afd9-f192c4b46c5b',
  'aa2ae3f2-52bb-44c2-86b1-7c040628ead8',
  '1b091706-9c20-4e6f-b724-b00ed6a6b952',
  'afb16f6d-b6e9-4816-b32e-c8663b34f673'
);

-- VERIFICATION QUERY:
-- Check remaining question counts after hallucination removal
SELECT test_mode, section_name, COUNT(*) as question_count
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
GROUP BY test_mode, section_name
ORDER BY test_mode, section_name;
