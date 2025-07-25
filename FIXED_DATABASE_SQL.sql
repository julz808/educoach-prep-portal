-- FIXED SQL: Corrected syntax error in function definition

-- Step 1: Drop ALL versions of the conflicting function
DROP FUNCTION IF EXISTS upsert_writing_assessment(UUID, UUID, UUID, TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS upsert_writing_assessment(UUID, UUID, UUID, TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, TEXT, TEXT[], TEXT[], TEXT, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS upsert_writing_assessment_v2;

-- Step 2: Create the single correct function with fixed syntax
CREATE FUNCTION upsert_writing_assessment(
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
  p_strengths TEXT,
  p_improvements TEXT,
  p_claude_model_version TEXT,
  p_processing_time_ms INTEGER,
  p_prompt_tokens INTEGER DEFAULT NULL,
  p_response_tokens INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM writing_assessments
  WHERE user_id = p_user_id 
    AND session_id = p_session_id 
    AND question_id = p_question_id;
  
  INSERT INTO writing_assessments (
    user_id, session_id, question_id, product_type, writing_genre,
    rubric_used, user_response, word_count, total_score, max_possible_score,
    percentage_score, criterion_scores, overall_feedback, strengths,
    improvements, claude_model_version, processing_time_ms,
    prompt_tokens, response_tokens
  ) VALUES (
    p_user_id, p_session_id, p_question_id, p_product_type, p_writing_genre,
    p_rubric_used, p_user_response, p_word_count, p_total_score, p_max_possible_score,
    p_percentage_score, p_criterion_scores, p_overall_feedback, 
    p_strengths::jsonb,
    p_improvements::jsonb,
    p_claude_model_version, p_processing_time_ms,
    p_prompt_tokens, p_response_tokens
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;