-- Fix Written Expression drill questions that are missing correct_answer
-- These should be extended response questions, so correct_answer should be NULL

UPDATE questions 
SET correct_answer = NULL
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
  AND test_mode = 'drill' 
  AND section_name = 'Written Expression'
  AND correct_answer IS NULL;

-- Verify the fix
SELECT 
  section_name, 
  sub_skill,
  COUNT(*) as question_count,
  COUNT(correct_answer) as questions_with_correct_answer
FROM questions 
WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
  AND test_mode = 'drill' 
  AND section_name = 'Written Expression'
GROUP BY section_name, sub_skill
ORDER BY sub_skill;