-- SQL Script to Delete Specific Users and All Their Data from Supabase
-- Users to delete:
-- 1. juliansunou88@gmail.com (7ce3b284-e7d1-45cb-b289-32e2d6665aef)
-- 2. sep.jules88@gmail.com (6a82fc95-c584-4618-b05f-fd5911718eb9)
-- 3. admin@baysideacademics.com.au (dccfd07a-6171-4a08-8594-771f30cc878f)
-- 4. learning@educourse.com.au (f7a77ea7-c4c5-4e16-ac54-345ea28a99f0)
-- 5. juliansunou@gmail.com (2c2e5c44-d953-48bc-89d7-52b8333edbda)

-- Start transaction
BEGIN;

-- Step 1: Delete writing assessments (depends on user_test_sessions)
DELETE FROM writing_assessments
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
)
OR session_id IN (
    SELECT id FROM user_test_sessions 
    WHERE user_id IN (
        '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
        '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
        'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
        'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
        '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
    )
);

-- Step 2: Delete test section states (depends on user_test_sessions)
DELETE FROM test_section_states
WHERE test_session_id IN (
    SELECT id FROM user_test_sessions 
    WHERE user_id IN (
        '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
        '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
        'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
        'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
        '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
    )
);

-- Step 3: Delete user question responses
DELETE FROM user_question_responses
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Step 4: Delete user test sessions
DELETE FROM user_test_sessions
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Step 5: Delete drill sessions
DELETE FROM drill_sessions
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Step 6: Delete question attempt history
DELETE FROM question_attempt_history
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Step 7: Delete user sub-skill performance
DELETE FROM user_sub_skill_performance
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Step 8: Delete user progress
DELETE FROM user_progress
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Step 9: Delete user products (subscriptions)
DELETE FROM user_products
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Step 10: Delete user profiles
DELETE FROM user_profiles
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

-- Step 11: Delete rate limits
DELETE FROM rate_limits
WHERE user_id IN (
    '7ce3b284-e7d1-45cb-b289-32e2d6665aef'::uuid,
    '6a82fc95-c584-4618-b05f-fd5911718eb9'::uuid,
    'dccfd07a-6171-4a08-8594-771f30cc878f'::uuid,
    'f7a77ea7-c4c5-4e16-ac54-345ea28a99f0'::uuid,
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'::uuid
);

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