-- Migration: Fix writing assessments column types and max_points values
-- Date: 2025-07-25
-- Purpose: Fix JSONB column type mismatch and update writing question max_points

-- Fix 1: Update upsert_writing_assessment function to handle JSONB columns correctly
CREATE OR REPLACE FUNCTION upsert_writing_assessment(
  p_user_id UUID,
  p_session_id UUID,
  p_question_id UUID,
  p_product_type TEXT,
  p_writing_genre TEXT,
  p_rubric_used JSONB,
  p_user_response TEXT,
  p_word_count INTEGER,
  p_total_score INTEGER,
  p_max_possible_score INTEGER,
  p_percentage_score INTEGER,
  p_criterion_scores JSONB,
  p_overall_feedback TEXT,
  p_strengths JSONB,  -- Changed from TEXT[] to JSONB
  p_improvements JSONB,  -- Changed from TEXT[] to JSONB
  p_claude_model_version TEXT,
  p_processing_time_ms INTEGER,
  p_prompt_tokens INTEGER DEFAULT NULL,
  p_response_tokens INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- First delete any existing assessment
  DELETE FROM writing_assessments
  WHERE user_id = p_user_id 
    AND session_id = p_session_id 
    AND question_id = p_question_id;
  
  -- Then insert the new assessment
  INSERT INTO writing_assessments (
    user_id, session_id, question_id, product_type, writing_genre,
    rubric_used, user_response, word_count, total_score, max_possible_score,
    percentage_score, criterion_scores, overall_feedback, strengths,
    improvements, claude_model_version, processing_time_ms,
    prompt_tokens, response_tokens
  ) VALUES (
    p_user_id, p_session_id, p_question_id, p_product_type, p_writing_genre,
    p_rubric_used, p_user_response, p_word_count, p_total_score, p_max_possible_score,
    p_percentage_score, p_criterion_scores, p_overall_feedback, p_strengths,
    p_improvements, p_claude_model_version, p_processing_time_ms,
    p_prompt_tokens, p_response_tokens
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Update max_points for all writing questions
UPDATE questions 
SET max_points = 
  CASE 
    -- VIC Selective Entry (30 points per writing task)
    WHEN product_type = 'VIC Selective Entry (Year 9 Entry)' THEN 30
    
    -- NSW Selective Entry (50 points per writing task)
    WHEN product_type = 'NSW Selective Entry (Year 7 Entry)' THEN 50
    
    -- Year 5 & 7 NAPLAN (48 points per writing task)
    WHEN product_type IN ('Year 5 NAPLAN', 'Year 7 NAPLAN') THEN 48
    
    -- EduTest Scholarship (15 points per writing task)
    WHEN product_type = 'EduTest Scholarship (Year 7 Entry)' THEN 15
    
    -- ACER Scholarship (20 points per writing task)
    WHEN product_type = 'ACER Scholarship (Year 7 Entry)' THEN 20
    
    ELSE 30 -- Default to 30 for any other writing questions
  END
WHERE (
  -- Match all possible ways writing questions are identified
  sub_skill ILIKE '%writing%' 
  OR sub_skill ILIKE '%written%'
  OR section_name ILIKE '%writing%' 
  OR section_name ILIKE '%written%'
  OR response_type = 'extended_response'
  OR format = 'Written Response'
);

-- Log the changes for verification
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
  WHERE (
    sub_skill ILIKE '%writing%' 
    OR sub_skill ILIKE '%written%'
    OR section_name ILIKE '%writing%' 
    OR section_name ILIKE '%written%'
    OR response_type = 'extended_response'
    OR format = 'Written Response'
  );
  
  -- Count by product type
  SELECT COUNT(*) INTO vic_count
  FROM questions 
  WHERE product_type = 'VIC Selective Entry (Year 9 Entry)' 
    AND max_points = 30
    AND (
      sub_skill ILIKE '%writing%' 
      OR sub_skill ILIKE '%written%'
      OR section_name ILIKE '%writing%' 
      OR section_name ILIKE '%written%'
      OR response_type = 'extended_response'
      OR format = 'Written Response'
    );
    
  SELECT COUNT(*) INTO nsw_count
  FROM questions 
  WHERE product_type = 'NSW Selective Entry (Year 7 Entry)' 
    AND max_points = 50
    AND (
      sub_skill ILIKE '%writing%' 
      OR sub_skill ILIKE '%written%'
      OR section_name ILIKE '%writing%' 
      OR section_name ILIKE '%written%'
      OR response_type = 'extended_response'
      OR format = 'Written Response'
    );
    
  SELECT COUNT(*) INTO naplan_count
  FROM questions 
  WHERE product_type IN ('Year 5 NAPLAN', 'Year 7 NAPLAN')
    AND max_points = 48
    AND (
      sub_skill ILIKE '%writing%' 
      OR sub_skill ILIKE '%written%'
      OR section_name ILIKE '%writing%' 
      OR section_name ILIKE '%written%'
      OR response_type = 'extended_response'
      OR format = 'Written Response'
    );
    
  SELECT COUNT(*) INTO edutest_count
  FROM questions 
  WHERE product_type = 'EduTest Scholarship (Year 7 Entry)'
    AND max_points = 15
    AND (
      sub_skill ILIKE '%writing%' 
      OR sub_skill ILIKE '%written%'
      OR section_name ILIKE '%writing%' 
      OR section_name ILIKE '%written%'
      OR response_type = 'extended_response'
      OR format = 'Written Response'
    );
    
  SELECT COUNT(*) INTO acer_count
  FROM questions 
  WHERE product_type = 'ACER Scholarship (Year 7 Entry)'
    AND max_points = 20
    AND (
      sub_skill ILIKE '%writing%' 
      OR sub_skill ILIKE '%written%'
      OR section_name ILIKE '%writing%' 
      OR section_name ILIKE '%written%'
      OR response_type = 'extended_response'
      OR format = 'Written Response'
    );
  
  RAISE NOTICE 'Migration Results:';
  RAISE NOTICE 'Total writing questions found: %', updated_count;
  RAISE NOTICE 'VIC Selective (30 points): % questions', vic_count;
  RAISE NOTICE 'NSW Selective (50 points): % questions', nsw_count;
  RAISE NOTICE 'NAPLAN (48 points): % questions', naplan_count;
  RAISE NOTICE 'EduTest (15 points): % questions', edutest_count;
  RAISE NOTICE 'ACER (20 points): % questions', acer_count;
END $$;