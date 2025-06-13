BEGIN;

-- 1. Clean up duplicates
DROP TABLE IF EXISTS question_responses CASCADE;
DROP TABLE IF EXISTS user_sub_skill_progress CASCADE;

-- 2. Rename test_attempts to match frontend
ALTER TABLE test_attempts RENAME TO user_test_sessions;

-- 3. Fix foreign key reference
ALTER TABLE user_question_responses 
DROP CONSTRAINT IF EXISTS user_question_responses_test_session_id_fkey;

ALTER TABLE user_question_responses
ADD CONSTRAINT user_question_responses_test_session_id_fkey 
FOREIGN KEY (test_session_id) REFERENCES user_test_sessions(id);

-- 4. Fix sub_skills table structure
ALTER TABLE sub_skills 
RENAME COLUMN skill_name TO name;

ALTER TABLE sub_skills
ADD COLUMN IF NOT EXISTS product_type VARCHAR,
ADD COLUMN IF NOT EXISTS visual_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS skill_category VARCHAR;

UPDATE sub_skills ss
SET product_type = ts.product_type
FROM test_sections ts
WHERE ss.section_id = ts.id AND ss.product_type IS NULL;

-- 5. Add missing columns to questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS sub_skill_id UUID REFERENCES sub_skills(id),
ADD COLUMN IF NOT EXISTS product_type VARCHAR;

-- 6. Map product types
UPDATE questions 
SET product_type = CASE 
  WHEN test_type = 'VIC Selective Entry (Year 9 Entry)' THEN 'vic_selective'
  WHEN test_type LIKE '%Year 5 NAPLAN%' THEN 'naplan_yr5'
  WHEN test_type LIKE '%Year 7 NAPLAN%' THEN 'naplan_yr7'
  WHEN test_type LIKE '%Year 9 NAPLAN%' THEN 'naplan_yr9'
  WHEN test_type LIKE '%EduTest%' THEN 'edutest'
  WHEN test_type LIKE '%ACER%' THEN 'acer'
  ELSE 'vic_selective'
END
WHERE product_type IS NULL;

-- 7. Link questions to sub_skills
UPDATE questions q
SET sub_skill_id = ss.id
FROM sub_skills ss
JOIN test_sections ts ON ss.section_id = ts.id
WHERE LOWER(TRIM(q.sub_skill)) = LOWER(TRIM(ss.name))
  AND q.section_name = ts.section_name
  AND q.product_type = ts.product_type
  AND q.sub_skill_id IS NULL;

-- 8. Add missing columns to user_test_sessions
ALTER TABLE user_test_sessions
ADD COLUMN IF NOT EXISTS test_template_id UUID REFERENCES test_templates(id),
ADD COLUMN IF NOT EXISTS section_scores JSONB,
ADD COLUMN IF NOT EXISTS sub_skill_performance JSONB,
ADD COLUMN IF NOT EXISTS final_score NUMERIC(5,2);

COMMIT;

-- Verify the fixes
SELECT 
  'questions with sub_skill_id' as check_type,
  COUNT(*) FILTER (WHERE sub_skill_id IS NOT NULL) as linked,
  COUNT(*) FILTER (WHERE sub_skill_id IS NULL) as not_linked,
  COUNT(*) as total
FROM questions
WHERE product_type = 'vic_selective'; 