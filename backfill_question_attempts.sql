-- BACKFILL QUESTION ATTEMPT HISTORY FOR EXISTING COMPLETED TESTS
-- This script recreates the missing question_attempt_history records
-- using the same logic as the developer tools auto-fill method

-- For user: fce34bfa-98d5-44ed-848d-b550c3e785bc
-- Target test sessions that have answers_data but no question_attempt_history records

DO $$
DECLARE
    session_record RECORD;
    question_record RECORD;
    session_answers_data JSONB;
    question_order_array UUID[];
    question_uuid UUID;
    user_answer_value TEXT;
    is_answer_correct BOOLEAN;
    question_index INTEGER;
BEGIN
    -- Loop through completed diagnostic sessions that have answers_data
    FOR session_record IN 
        SELECT 
            uts.id,
            uts.user_id,
            uts.section_name,
            uts.test_mode,
            uts.answers_data,
            uts.question_order,
            uts.completed_at
        FROM user_test_sessions uts
        WHERE uts.user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
        AND uts.test_mode = 'diagnostic'
        AND uts.status = 'completed'
        AND uts.answers_data IS NOT NULL
        AND uts.question_order IS NOT NULL
        -- Only process sessions that don't already have question attempts
        AND uts.id NOT IN (
            SELECT DISTINCT qah.session_id 
            FROM question_attempt_history qah
            WHERE qah.user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
            AND qah.session_id IS NOT NULL
        )
    LOOP
        RAISE NOTICE 'Processing session: % for section: %', session_record.id, session_record.section_name;
        
        -- Get the answers data and question order
        session_answers_data := session_record.answers_data;
        
        -- Handle question_order properly based on its type (could be UUID[] or JSONB)
        IF session_record.question_order IS NOT NULL THEN
            -- Try to convert question_order to UUID array
            -- If it's already UUID[], use it directly; if it's JSONB, convert it
            BEGIN
                -- First try: assume it's a JSONB array and convert to UUID array
                question_order_array := ARRAY(SELECT (jsonb_array_elements_text(session_record.question_order::jsonb))::UUID);
            EXCEPTION WHEN OTHERS THEN
                -- Second try: assume it's already a UUID array
                question_order_array := session_record.question_order;
            END;
        ELSE
            question_order_array := ARRAY[]::UUID[];
        END IF;
        
        -- Loop through each question in the order
        question_index := 1;
        FOREACH question_uuid IN ARRAY question_order_array
        LOOP
            -- Check if user provided an answer for this question
            IF session_answers_data ? question_uuid::text AND session_answers_data->>question_uuid::text IS NOT NULL AND session_answers_data->>question_uuid::text != '' THEN
                -- Get the question details to check correctness
                SELECT q.id, q.correct_answer INTO question_record
                FROM questions q
                WHERE q.id = question_uuid;
                
                IF FOUND THEN
                    -- Get the user's answer
                    user_answer_value := session_answers_data->>question_uuid::text;
                    
                    -- Check if the user's answer is correct
                    is_answer_correct := (user_answer_value = question_record.correct_answer);
                    
                    -- Insert the question attempt record
                    INSERT INTO question_attempt_history (
                        user_id,
                        question_id,
                        session_id,
                        session_type,
                        user_answer,
                        is_correct,
                        is_flagged,
                        is_skipped,
                        time_spent_seconds,
                        attempted_at
                    ) VALUES (
                        session_record.user_id,
                        question_record.id,
                        session_record.id,
                        session_record.test_mode,
                        user_answer_value,
                        is_answer_correct,
                        false, -- Assume not flagged for backfilled data
                        false, -- Not skipped since there's an answer
                        120,   -- Default 2 minutes per question for backfilled data
                        session_record.completed_at
                    );
                    
                    RAISE NOTICE 'Created attempt for question % with answer % (correct: %)', 
                        question_record.id, user_answer_value, is_answer_correct;
                ELSE
                    RAISE NOTICE 'Question not found for ID: %', question_uuid;
                END IF;
            END IF;
            
            question_index := question_index + 1;
        END LOOP;
        
        RAISE NOTICE 'Completed processing session: %', session_record.id;
    END LOOP;
    
    RAISE NOTICE 'Backfill completed successfully';
END $$;

-- Verify the backfill worked by checking the newly created records
SELECT 
    'VERIFICATION' as table_name,
    session_id,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_attempts,
    COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_attempts
FROM question_attempt_history
WHERE user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
GROUP BY session_id
ORDER BY session_id;