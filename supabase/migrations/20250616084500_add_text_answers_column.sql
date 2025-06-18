-- Add text_answers_data column to user_test_sessions table
-- This provides a dedicated column for storing written responses separately from multiple choice answers

ALTER TABLE public.user_test_sessions 
ADD COLUMN text_answers_data jsonb DEFAULT '{}'::jsonb;

-- Add comment to clarify usage
COMMENT ON COLUMN public.user_test_sessions.text_answers_data IS 'Stores written responses for extended_response and short_answer questions. Format: {"question_index": "answer_text"}';

-- The existing answers_data column will continue to store multiple choice answers
COMMENT ON COLUMN public.user_test_sessions.answers_data IS 'Stores multiple choice answers and question metadata. Format: {"question_index": "selected_option"}';