-- Add missing unique constraints for proper upsert operations

-- Add unique constraint for test_section_states to enable ON CONFLICT in update operations
DO $$ 
BEGIN
    -- Check if constraint already exists
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

-- Add unique constraint for question_attempt_history to prevent duplicate responses
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'question_attempt_history_unique_attempt'
        AND table_name = 'question_attempt_history'
    ) THEN
        -- First remove any duplicate records that might exist
        DELETE FROM question_attempt_history q1 
        WHERE EXISTS (
            SELECT 1 FROM question_attempt_history q2 
            WHERE q2.user_id = q1.user_id 
            AND q2.question_id = q1.question_id 
            AND q2.session_id = q1.session_id
            AND q2.id < q1.id
        );
        
        -- Then add the constraint
        ALTER TABLE question_attempt_history 
        ADD CONSTRAINT question_attempt_history_unique_attempt 
        UNIQUE (user_id, question_id, session_id);
    END IF;
END $$;