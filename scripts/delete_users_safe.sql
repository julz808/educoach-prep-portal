-- SQL Script to Delete Specific Users and All Their Data from Supabase
-- SAFE VERSION - Checks for table existence before deletion
-- Users to delete:
-- 1. juliansunou88@gmail.com (7ce3b284-e7d1-45cb-b289-32e2d6665aef)
-- 2. sep.jules88@gmail.com (6a82fc95-c584-4618-b05f-fd5911718eb9)
-- 3. admin@baysideacademics.com.au (dccfd07a-6171-4a08-8594-771f30cc878f)
-- 4. learning@educourse.com.au (f7a77ea7-c4c5-4e16-ac54-345ea28a99f0)
-- 5. juliansunou@gmail.com (2c2e5c44-d953-48bc-89d7-52b8333edbda)

-- Start transaction
BEGIN;

-- Helper function to safely delete from tables that may or may not exist
DO $$
DECLARE
    user_ids uuid[] := ARRAY[
        '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
        '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
        'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
        'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
        '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
    ];
BEGIN
    -- Step 1: Delete writing assessments (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'writing_assessments') THEN
        EXECUTE format('DELETE FROM writing_assessments WHERE user_id = ANY(%L)', user_ids);
        -- Also delete by session_id
        EXECUTE format('DELETE FROM writing_assessments WHERE session_id IN (SELECT id FROM user_test_sessions WHERE user_id = ANY(%L))', user_ids);
        RAISE NOTICE 'Deleted from writing_assessments';
    END IF;

    -- Step 2: Delete test section states (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test_section_states') THEN
        EXECUTE format('DELETE FROM test_section_states WHERE test_session_id IN (SELECT id FROM user_test_sessions WHERE user_id = ANY(%L))', user_ids);
        RAISE NOTICE 'Deleted from test_section_states';
    END IF;

    -- Step 3: Delete user question responses (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_question_responses') THEN
        EXECUTE format('DELETE FROM user_question_responses WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from user_question_responses';
    END IF;

    -- Step 4: Delete user test sessions (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_test_sessions') THEN
        EXECUTE format('DELETE FROM user_test_sessions WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from user_test_sessions';
    END IF;

    -- Step 5: Delete drill sessions (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'drill_sessions') THEN
        EXECUTE format('DELETE FROM drill_sessions WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from drill_sessions';
    END IF;

    -- Step 6: Delete question attempt history (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'question_attempt_history') THEN
        EXECUTE format('DELETE FROM question_attempt_history WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from question_attempt_history';
    END IF;

    -- Step 7: Delete user sub-skill performance (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sub_skill_performance') THEN
        EXECUTE format('DELETE FROM user_sub_skill_performance WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from user_sub_skill_performance';
    END IF;

    -- Step 8: Delete user progress (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_progress') THEN
        EXECUTE format('DELETE FROM user_progress WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from user_progress';
    END IF;

    -- Step 9: Delete user products (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_products') THEN
        EXECUTE format('DELETE FROM user_products WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from user_products';
    END IF;

    -- Step 10: Delete user profiles (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        EXECUTE format('DELETE FROM user_profiles WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from user_profiles';
    END IF;

    -- Step 11: Delete rate limits (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
        EXECUTE format('DELETE FROM rate_limits WHERE user_id = ANY(%L)', user_ids);
        RAISE NOTICE 'Deleted from rate_limits';
    END IF;

    RAISE NOTICE 'All user data deleted from application tables';
END $$;

-- Step 12: Finally, delete the auth users
-- This will also cascade delete any remaining related data
DELETE FROM auth.users
WHERE id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Commit the transaction
COMMIT;

-- Verify deletion (optional - run separately to confirm)
-- SELECT id, email FROM auth.users 
-- WHERE id IN (
--     '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
--     '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
--     'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
--     'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
--     '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
-- );