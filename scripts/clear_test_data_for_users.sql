-- CLEAR TEST DATA FOR SPECIFIC USERS
-- This script removes all test progress for the 3 specified users only
-- Preserves: user accounts, profiles, product access
-- Removes: all test sessions, attempts, progress data

-- Target users:
-- fce34bfa-98d5-44ed-848d-b550c3e785bc (sep.jules88@gmail.com)
-- 626b1878-0bb7-4224-bbb9-c169863d9146 (admin@baysideacademics.com.au)  
-- 2c2e5c44-d953-48bc-89d7-52b8333edbda (juliansunou@gmail.com)

DO $$
DECLARE
    target_users UUID[] := ARRAY[
        'fce34bfa-98d5-44ed-848d-b550c3e785bc'::UUID,
        '626b1878-0bb7-4224-bbb9-c169863d9146'::UUID,
        '2c2e5c44-d953-48bc-89d7-52b8333edbda'::UUID
    ];
    target_user_id UUID;
    deleted_attempts INTEGER := 0;
    deleted_sessions INTEGER := 0;
    deleted_section_states INTEGER := 0;
    deleted_drill_sessions INTEGER := 0;
    deleted_writing INTEGER := 0;
    deleted_sub_skill_perf INTEGER := 0;
    reset_progress INTEGER := 0;
    temp_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting test data cleanup for 3 specific users...';
    
    -- Loop through each target user
    FOREACH target_user_id IN ARRAY target_users
    LOOP
        RAISE NOTICE 'Cleaning data for user: %', target_user_id;
        
        -- 1. Delete question attempt history for this user
        DELETE FROM question_attempt_history WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_attempts := deleted_attempts + temp_count;
        RAISE NOTICE '  - Deleted % question attempts', temp_count;
        
        -- 2. Delete writing assessments for this user
        DELETE FROM writing_assessments 
        WHERE session_id IN (
            SELECT id FROM user_test_sessions WHERE user_id = target_user_id
        );
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_writing := deleted_writing + temp_count;
        RAISE NOTICE '  - Deleted % writing assessments', temp_count;
        
        -- 3. Delete test section states for this user
        DELETE FROM test_section_states 
        WHERE test_session_id IN (
            SELECT id FROM user_test_sessions WHERE user_id = target_user_id
        );
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_section_states := deleted_section_states + temp_count;
        RAISE NOTICE '  - Deleted % test section states', temp_count;
        
        -- 4. Delete drill sessions for this user
        DELETE FROM drill_sessions WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_drill_sessions := deleted_drill_sessions + temp_count;
        RAISE NOTICE '  - Deleted % drill sessions', temp_count;
        
        -- 5. Delete user sub-skill performance for this user
        DELETE FROM user_sub_skill_performance WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_sub_skill_perf := deleted_sub_skill_perf + temp_count;
        RAISE NOTICE '  - Deleted % sub-skill performance records', temp_count;
        
        -- 6. Delete user test sessions for this user (must be after dependencies)
        DELETE FROM user_test_sessions WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_sessions := deleted_sessions + temp_count;
        RAISE NOTICE '  - Deleted % test sessions', temp_count;
        
        -- 7. Reset user progress for this user (keep records but zero them out)
        UPDATE user_progress SET
            total_questions_completed = 0,
            total_questions_attempted = 0, 
            total_questions_correct = 0,
            overall_accuracy = 0,
            total_study_time_seconds = 0,
            diagnostic_completed = false,
            diagnostic_score = NULL,
            practice_tests_completed = ARRAY[]::INTEGER[],
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        reset_progress := reset_progress + temp_count;
        RAISE NOTICE '  - Reset % progress records', temp_count;
        
        RAISE NOTICE 'Completed cleanup for user: %', target_user_id;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'TEST DATA CLEANUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'SUMMARY FOR ALL 3 USERS:';
    RAISE NOTICE '- Question attempts deleted: %', deleted_attempts;
    RAISE NOTICE '- Writing assessments deleted: %', deleted_writing;
    RAISE NOTICE '- Test sessions deleted: %', deleted_sessions;
    RAISE NOTICE '- Section states deleted: %', deleted_section_states;
    RAISE NOTICE '- Drill sessions deleted: %', deleted_drill_sessions;
    RAISE NOTICE '- Sub-skill performance deleted: %', deleted_sub_skill_perf;
    RAISE NOTICE '- User progress reset: %', reset_progress;
    RAISE NOTICE '';
    RAISE NOTICE 'PRESERVED:';
    RAISE NOTICE '- User accounts and profiles ✓';
    RAISE NOTICE '- Product access (user_products) ✓';
    RAISE NOTICE '- All other user data ✓';
    
END $$;

-- Verification: Show what was preserved
SELECT 
    'PRESERVED' as data_type,
    'user_profiles' as table_name,
    COUNT(*) as records_count
FROM user_profiles
WHERE user_id IN (
    'fce34bfa-98d5-44ed-848d-b550c3e785bc',
    '626b1878-0bb7-4224-bbb9-c169863d9146', 
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'
)

UNION ALL

SELECT 
    'PRESERVED' as data_type,
    'user_products' as table_name,
    COUNT(*) as records_count
FROM user_products
WHERE user_id IN (
    'fce34bfa-98d5-44ed-848d-b550c3e785bc',
    '626b1878-0bb7-4224-bbb9-c169863d9146',
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'
)

UNION ALL

-- Verification: Show what was cleared
SELECT 
    'CLEARED' as data_type,
    'test_sessions_remaining' as table_name,
    COUNT(*) as records_count
FROM user_test_sessions
WHERE user_id IN (
    'fce34bfa-98d5-44ed-848d-b550c3e785bc',
    '626b1878-0bb7-4224-bbb9-c169863d9146',
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'
)

UNION ALL

SELECT 
    'CLEARED' as data_type,
    'question_attempts_remaining' as table_name,
    COUNT(*) as records_count
FROM question_attempt_history
WHERE user_id IN (
    'fce34bfa-98d5-44ed-848d-b550c3e785bc',
    '626b1878-0bb7-4224-bbb9-c169863d9146',
    '2c2e5c44-d953-48bc-89d7-52b8333edbda'
);

-- Final confirmation
SELECT 
    'CLEANUP COMPLETE' as status,
    'Ready for fresh testing' as message;