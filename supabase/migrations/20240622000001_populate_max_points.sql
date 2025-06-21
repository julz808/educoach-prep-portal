-- Migration: Populate max_points for all writing questions based on their rubrics
-- This ensures each writing question has the correct maximum points value

-- Update writing questions with their rubric-based max points
UPDATE questions 
SET max_points = 
  CASE 
    -- NSW Selective Entry (50 points per writing task)
    WHEN product_type = 'NSW Selective Entry (Year 7 Entry)' 
         AND sub_skill IN ('Narrative Writing', 'Persuasive Writing', 'Expository Writing', 'Imaginative Writing') 
    THEN 50
    
    -- VIC Selective Entry (30 points per writing task)
    WHEN product_type = 'VIC Selective Entry (Year 9 Entry)' 
         AND sub_skill IN ('Creative Writing', 'Persuasive Writing')
    THEN 30
    
    -- Year 5 & 7 NAPLAN (48 points per writing task)
    WHEN product_type IN ('Year 5 NAPLAN', 'Year 7 NAPLAN')
         AND sub_skill IN ('Narrative Writing', 'Persuasive Writing')
    THEN 48
    
    -- EduTest Scholarship (15 points per writing task)
    WHEN product_type = 'EduTest Scholarship (Year 7 Entry)'
         AND sub_skill IN ('Narrative Writing', 'Persuasive Writing', 'Expository Writing', 'Creative Writing', 'Descriptive Writing')
    THEN 15
    
    -- ACER Scholarship (20 points per writing task)
    WHEN product_type = 'ACER Scholarship (Year 7 Entry)'
         AND sub_skill IN ('Narrative Writing', 'Persuasive Writing', 'Expository Writing', 'Creative Writing')
    THEN 20
    
    ELSE max_points -- Keep existing value (default 1)
  END
WHERE sub_skill LIKE '%Writing%' 
   OR section_name LIKE '%Writing%'
   OR section_name LIKE '%Written%';

-- Verify the update worked correctly
DO $$
DECLARE
  updated_count INTEGER;
  vic_count INTEGER;
  nsw_count INTEGER;
  naplan_count INTEGER;
  edutest_count INTEGER;
  acer_count INTEGER;
BEGIN
  -- Count total updated questions
  SELECT COUNT(*) INTO updated_count 
  FROM questions 
  WHERE max_points > 1;
  
  -- Count by product type
  SELECT COUNT(*) INTO vic_count
  FROM questions 
  WHERE product_type = 'VIC Selective Entry (Year 9 Entry)' 
    AND max_points = 30;
    
  SELECT COUNT(*) INTO nsw_count
  FROM questions 
  WHERE product_type = 'NSW Selective Entry (Year 7 Entry)' 
    AND max_points = 50;
    
  SELECT COUNT(*) INTO naplan_count
  FROM questions 
  WHERE product_type IN ('Year 5 NAPLAN', 'Year 7 NAPLAN')
    AND max_points = 48;
    
  SELECT COUNT(*) INTO edutest_count
  FROM questions 
  WHERE product_type = 'EduTest Scholarship (Year 7 Entry)'
    AND max_points = 15;
    
  SELECT COUNT(*) INTO acer_count
  FROM questions 
  WHERE product_type = 'ACER Scholarship (Year 7 Entry)'
    AND max_points = 20;
  
  RAISE NOTICE 'Updated % total writing questions with max_points > 1', updated_count;
  RAISE NOTICE 'VIC Selective: % questions (30 points each)', vic_count;
  RAISE NOTICE 'NSW Selective: % questions (50 points each)', nsw_count;
  RAISE NOTICE 'NAPLAN: % questions (48 points each)', naplan_count;
  RAISE NOTICE 'EduTest: % questions (15 points each)', edutest_count;
  RAISE NOTICE 'ACER: % questions (20 points each)', acer_count;
  
  -- Warn if no writing questions were found
  IF updated_count = 0 THEN
    RAISE WARNING 'No writing questions were updated. Check if writing questions exist in the database.';
  END IF;
END $$;

-- Create a verification query to double-check
SELECT 
  product_type,
  sub_skill,
  COUNT(*) as question_count,
  MAX(max_points) as max_points_value
FROM questions
WHERE max_points > 1
GROUP BY product_type, sub_skill
ORDER BY product_type, sub_skill;