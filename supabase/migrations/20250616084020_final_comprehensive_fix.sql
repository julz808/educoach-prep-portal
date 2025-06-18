-- Final comprehensive fix for all database function issues

-- 1. Drop ALL duplicate functions with explicit signatures
DROP FUNCTION IF EXISTS update_session_progress(UUID, INTEGER, JSONB, INTEGER[], INTEGER, UUID[]);
DROP FUNCTION IF EXISTS update_session_progress(TEXT, INTEGER, JSONB, INTEGER[], INTEGER, TEXT[]);
DROP FUNCTION IF EXISTS update_section_state(UUID, TEXT, INTEGER, JSONB, INTEGER[], INTEGER);

-- 2. Create clean update_session_progress function (UUID version only)
CREATE OR REPLACE FUNCTION update_session_progress(
  p_session_id UUID,
  p_current_question_index INTEGER,
  p_answers JSONB,
  p_flagged_questions INTEGER[],
  p_time_remaining_seconds INTEGER,
  p_question_order UUID[] DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_test_sessions
  SET 
    current_question_index = p_current_question_index,
    answers_data = p_answers,
    flagged_questions = to_jsonb(p_flagged_questions),
    questions_answered = jsonb_object_length(p_answers),
    updated_at = now(),
    question_order = COALESCE(p_question_order, question_order)
  WHERE id = p_session_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session with ID % not found', p_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the missing update_section_state function
CREATE OR REPLACE FUNCTION update_section_state(
  p_session_id UUID,
  p_section_name TEXT,
  p_current_question_index INTEGER,
  p_answers JSONB,
  p_flagged_questions INTEGER[],
  p_time_remaining_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT to handle upsert
  INSERT INTO test_section_states (
    test_session_id, 
    section_name, 
    current_question_index,
    answers, 
    flagged_questions, 
    time_remaining_seconds,
    status, 
    started_at, 
    last_updated
  ) VALUES (
    p_session_id, 
    p_section_name, 
    p_current_question_index,
    p_answers, 
    p_flagged_questions, 
    p_time_remaining_seconds,
    'in_progress', 
    now(), 
    now()
  )
  ON CONFLICT (test_session_id, section_name) 
  DO UPDATE SET
    current_question_index = EXCLUDED.current_question_index,
    answers = EXCLUDED.answers,
    flagged_questions = EXCLUDED.flagged_questions,
    time_remaining_seconds = EXCLUDED.time_remaining_seconds,
    status = 'in_progress',
    last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure the unique constraint exists for test_section_states
DO $$ 
BEGIN
    -- Check if constraint already exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_section_states_session_section_unique'
        AND table_name = 'test_section_states'
    ) THEN
        ALTER TABLE test_section_states 
        ADD CONSTRAINT test_section_states_session_section_unique 
        UNIQUE (test_session_id, section_name);
    END IF;
END $$;

-- 5. Grant permissions with explicit parameter types
GRANT EXECUTE ON FUNCTION update_session_progress(UUID, INTEGER, JSONB, INTEGER[], INTEGER, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_section_state(UUID, TEXT, INTEGER, JSONB, INTEGER[], INTEGER) TO authenticated;