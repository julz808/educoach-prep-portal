-- SQL Script to keep only 1 writing question per difficulty level for drill mode
-- This ensures each writing sub-skill drill has exactly 3 questions (1 per difficulty)

-- First, let's analyze what we have
WITH writing_drill_questions AS (
  SELECT 
    q.id,
    q.sub_skill,
    q.sub_skill_id,
    q.difficulty,
    q.product_type,
    q.section_name,
    q.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY q.product_type, q.sub_skill_id, q.difficulty 
      ORDER BY q.created_at ASC
    ) as rn
  FROM questions q
  WHERE q.test_mode = 'drill'
    AND (
      LOWER(q.section_name) LIKE '%writing%' 
      OR LOWER(q.section_name) LIKE '%written expression%'
      OR q.format = 'Written Response'
    )
)
-- Show what will be kept vs deleted
SELECT 
  CASE 
    WHEN rn = 1 THEN 'KEEP' 
    ELSE 'DELETE' 
  END as action,
  id,
  product_type,
  sub_skill,
  difficulty,
  section_name,
  created_at
FROM writing_drill_questions
ORDER BY product_type, sub_skill, difficulty, rn;

-- Count summary before deletion
SELECT 
  product_type,
  sub_skill,
  difficulty,
  COUNT(*) as question_count
FROM questions
WHERE test_mode = 'drill'
  AND (
    LOWER(section_name) LIKE '%writing%' 
    OR LOWER(section_name) LIKE '%written expression%'
    OR format = 'Written Response'
  )
GROUP BY product_type, sub_skill, difficulty
HAVING COUNT(*) > 1
ORDER BY product_type, sub_skill, difficulty;

-- =====================================================
-- ACTUAL DELETION QUERY - UNCOMMENT TO EXECUTE
-- =====================================================

/*
-- Delete excess writing questions for drills, keeping only the oldest one per difficulty
DELETE FROM questions
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      q.id,
      ROW_NUMBER() OVER (
        PARTITION BY q.product_type, q.sub_skill_id, q.difficulty 
        ORDER BY q.created_at ASC
      ) as rn
    FROM questions q
    WHERE q.test_mode = 'drill'
      AND (
        LOWER(q.section_name) LIKE '%writing%' 
        OR LOWER(q.section_name) LIKE '%written expression%'
        OR q.format = 'Written Response'
      )
  ) ranked_questions
  WHERE rn > 1
);
*/

-- =====================================================
-- VERIFICATION QUERY - RUN AFTER DELETION
-- =====================================================

/*
-- Verify each writing sub-skill has exactly 3 questions (1 per difficulty)
SELECT 
  product_type,
  sub_skill,
  COUNT(DISTINCT difficulty) as difficulty_levels,
  COUNT(*) as total_questions,
  STRING_AGG(DISTINCT difficulty::text, ', ' ORDER BY difficulty::text) as difficulties
FROM questions
WHERE test_mode = 'drill'
  AND (
    LOWER(section_name) LIKE '%writing%' 
    OR LOWER(section_name) LIKE '%written expression%'
    OR format = 'Written Response'
  )
GROUP BY product_type, sub_skill
ORDER BY product_type, sub_skill;
*/