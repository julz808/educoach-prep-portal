-- FINAL DATABASE FIXES: Run these in Supabase SQL Editor

-- =====================================================
-- STEP 1: Add missing updated_at column to drill_sessions
-- =====================================================

ALTER TABLE public.drill_sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set updated_at for existing records
UPDATE drill_sessions SET updated_at = NOW() WHERE updated_at IS NULL;

-- =====================================================
-- STEP 2: Fix complete_drill_session function (remove updated_at references)
-- =====================================================

CREATE OR REPLACE FUNCTION complete_drill_session(
  p_session_id UUID,
  p_questions_answered INTEGER,
  p_questions_correct INTEGER,
  p_answers_data JSONB,
  p_text_answers_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  UPDATE drill_sessions 
  SET 
    status = 'completed',
    questions_answered = p_questions_answered,
    questions_correct = p_questions_correct,
    answers_data = p_answers_data,
    text_answers_data = p_text_answers_data,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- If no rows affected, session doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drill session not found: %', p_session_id;
  END IF;
  
  RAISE LOG 'Completed drill session: % answered, % correct', 
    p_questions_answered, p_questions_correct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: Fix update_drill_session_progress function
-- =====================================================

CREATE OR REPLACE FUNCTION update_drill_session_progress(
  p_session_id UUID,
  p_questions_answered INTEGER,
  p_questions_correct INTEGER,
  p_answers_data JSONB,
  p_text_answers_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  UPDATE drill_sessions 
  SET 
    questions_answered = p_questions_answered,
    questions_correct = p_questions_correct,
    answers_data = p_answers_data,
    text_answers_data = p_text_answers_data,
    updated_at = NOW()
  WHERE id = p_session_id;
  
  -- If no rows affected, session doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drill session not found: %', p_session_id;
  END IF;
  
  RAISE LOG 'Updated drill session progress: % answered, % correct', 
    p_questions_answered, p_questions_correct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: Create upsert_writing_assessment function
-- =====================================================

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
  p_strengths TEXT[],
  p_improvements TEXT[],
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