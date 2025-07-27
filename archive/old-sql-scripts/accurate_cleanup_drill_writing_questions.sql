-- ACCURATE SQL Script based on real Supabase data analysis
-- Keep only 1 writing question per difficulty level for drill mode
-- This ensures each writing sub-skill drill has exactly 3 questions (1 per difficulty)

-- ANALYSIS: Based on real data, writing questions have:
-- Section names: "Writing" OR "Written Expression"  
-- Sub-skills: "Narrative Writing", "Persuasive Writing", "Creative Writing", 
--            "Expository Writing", "Descriptive Writing", "Imaginative Writing"

-- =====================================================
-- STEP 1: ANALYZE WHAT WE HAVE
-- =====================================================

-- Show all writing questions in drill mode
SELECT 
  id,
  product_type,
  section_name,
  sub_skill,
  difficulty,
  created_at
FROM questions
WHERE test_mode = 'drill'
  AND (
    section_name = 'Writing' 
    OR section_name = 'Written Expression'
  )
ORDER BY product_type, section_name, sub_skill, difficulty, created_at;

-- Count questions by product/section/sub-skill/difficulty
WITH writing_counts AS (
  SELECT 
    product_type,
    section_name,
    sub_skill,
    difficulty,
    COUNT(*) as question_count,
    MIN(created_at) as oldest_created_at
  FROM questions
  WHERE test_mode = 'drill'
    AND (
      section_name = 'Writing' 
      OR section_name = 'Written Expression'
    )
  GROUP BY product_type, section_name, sub_skill, difficulty
)
SELECT 
  product_type,
  section_name,
  sub_skill,
  difficulty,
  question_count,
  CASE 
    WHEN question_count > 1 THEN 'NEEDS CLEANUP'
    ELSE 'OK'
  END as status
FROM writing_counts
ORDER BY product_type, section_name, sub_skill, difficulty;

-- =====================================================
-- STEP 2: PREVIEW WHAT WILL BE DELETED
-- =====================================================

WITH writing_drill_questions AS (
  SELECT 
    q.id,
    q.product_type,
    q.section_name,
    q.sub_skill,
    q.sub_skill_id,
    q.difficulty,
    q.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY q.product_type, q.section_name, q.sub_skill, q.difficulty 
      ORDER BY q.created_at ASC
    ) as rn
  FROM questions q
  WHERE q.test_mode = 'drill'
    AND (
      q.section_name = 'Writing' 
      OR q.section_name = 'Written Expression'
    )
)
SELECT 
  CASE 
    WHEN rn = 1 THEN 'KEEP' 
    ELSE 'DELETE' 
  END as action,
  id,
  product_type,
  section_name,
  sub_skill,
  difficulty,
  created_at
FROM writing_drill_questions
WHERE rn > 1  -- Only show what will be deleted
ORDER BY product_type, section_name, sub_skill, difficulty, rn;

-- =====================================================
-- STEP 3: ACTUAL DELETION QUERY 
-- =====================================================

-- UNCOMMENT THE QUERY BELOW TO EXECUTE THE DELETION
-- This will keep only the OLDEST question for each product/section/sub-skill/difficulty combination

/*
DELETE FROM questions
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      q.id,
      ROW_NUMBER() OVER (
        PARTITION BY q.product_type, q.section_name, q.sub_skill, q.difficulty 
        ORDER BY q.created_at ASC
      ) as rn
    FROM questions q
    WHERE q.test_mode = 'drill'
      AND (
        q.section_name = 'Writing' 
        OR q.section_name = 'Written Expression'
      )
  ) ranked_questions
  WHERE rn > 1
);
*/

-- =====================================================
-- STEP 4: VERIFICATION QUERY - RUN AFTER DELETION
-- =====================================================

/*
-- Verify each writing sub-skill has the expected number of questions per difficulty
SELECT 
  product_type,
  section_name,
  sub_skill,
  difficulty,
  COUNT(*) as question_count
FROM questions
WHERE test_mode = 'drill'
  AND (
    section_name = 'Writing' 
    OR section_name = 'Written Expression'
  )
GROUP BY product_type, section_name, sub_skill, difficulty
ORDER BY product_type, section_name, sub_skill, difficulty;

-- Summary by sub-skill (should ideally have 3 questions: 1 easy, 1 medium, 1 hard)
SELECT 
  product_type,
  section_name,
  sub_skill,
  COUNT(DISTINCT difficulty) as difficulty_levels,
  COUNT(*) as total_questions,
  STRING_AGG(DISTINCT difficulty::text, ', ' ORDER BY difficulty::text) as difficulties_present
FROM questions
WHERE test_mode = 'drill'
  AND (
    section_name = 'Writing' 
    OR section_name = 'Written Expression'
  )
GROUP BY product_type, section_name, sub_skill
ORDER BY product_type, section_name, sub_skill;
*/