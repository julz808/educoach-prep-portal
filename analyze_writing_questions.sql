-- First, let's see the structure of the questions table
\d questions;

-- Let's find all drill questions that might be writing-related
-- Check all columns to understand the data structure
SELECT 
  id,
  product_type,
  test_mode,
  section_name,
  sub_skill,
  sub_skill_id,
  difficulty,
  question_text,
  created_at
FROM questions 
WHERE test_mode = 'drill'
  AND (
    LOWER(section_name) LIKE '%writing%' 
    OR LOWER(section_name) LIKE '%written%'
    OR LOWER(section_name) LIKE '%expression%'
    OR LOWER(sub_skill) LIKE '%writing%'
    OR LOWER(sub_skill) LIKE '%written%'
    OR LOWER(sub_skill) LIKE '%narrative%'
    OR LOWER(sub_skill) LIKE '%persuasive%'
    OR LOWER(question_text) LIKE '%write%'
    OR LOWER(question_text) LIKE '%essay%'
    OR LOWER(question_text) LIKE '%story%'
  )
ORDER BY product_type, section_name, sub_skill, difficulty;

-- Get distinct section names for drill questions
SELECT DISTINCT section_name 
FROM questions 
WHERE test_mode = 'drill'
ORDER BY section_name;

-- Get distinct sub_skills for drill questions
SELECT DISTINCT sub_skill 
FROM questions 
WHERE test_mode = 'drill'
  AND sub_skill IS NOT NULL
ORDER BY sub_skill;

-- Count questions by section_name and sub_skill for drill mode
SELECT 
  section_name,
  sub_skill,
  difficulty,
  COUNT(*) as question_count
FROM questions
WHERE test_mode = 'drill'
GROUP BY section_name, sub_skill, difficulty
HAVING COUNT(*) > 1
ORDER BY section_name, sub_skill, difficulty;