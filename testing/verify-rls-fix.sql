-- Verification script to check RLS policies after applying the fix
-- Run this in Supabase SQL Editor after applying the 20250717000000_add_rls_policies.sql migration

-- 1. Check RLS status for all critical tables
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✓ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'user_profiles', 'user_progress', 'user_test_sessions', 
        'test_section_states', 'drill_sessions', 'question_attempt_history',
        'user_sub_skill_performance', 'questions', 'writing_assessments'
    )
ORDER BY tablename;

-- 2. Check specific policies for user_profiles (the main issue)
SELECT 
    'user_profiles' as table_name,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' THEN '✓ Critical for registration'
        ELSE '○ Standard policy'
    END as importance
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles'
ORDER BY cmd;

-- 3. Check policies for user_progress (also critical for registration)
SELECT 
    'user_progress' as table_name,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' THEN '✓ Critical for registration'
        ELSE '○ Standard policy'
    END as importance
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_progress'
ORDER BY cmd;

-- 4. Summary of all policies
SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
    CASE 
        WHEN COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) > 0 THEN '✓ Can insert'
        ELSE '❌ Cannot insert'
    END as registration_ready
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN (
        'user_profiles', 'user_progress', 'user_test_sessions', 
        'test_section_states', 'drill_sessions', 'question_attempt_history',
        'user_sub_skill_performance', 'questions', 'writing_assessments'
    )
GROUP BY tablename
ORDER BY tablename;

-- 5. Check for any tables that might be missing policies
SELECT 
    t.tablename,
    CASE 
        WHEN p.tablename IS NULL THEN '❌ No policies found'
        ELSE '✓ Has policies'
    END as policy_status
FROM pg_tables t
LEFT JOIN (
    SELECT DISTINCT tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
ORDER BY t.tablename;

-- 6. Final verification - simulate registration check
SELECT 
    'REGISTRATION READINESS CHECK' as check_type,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE tablename = 'user_profiles' AND cmd = 'INSERT'
        ) > 0 
        AND (
            SELECT COUNT(*) FROM pg_policies 
            WHERE tablename = 'user_progress' AND cmd = 'INSERT'
        ) > 0 THEN '✅ REGISTRATION SHOULD WORK'
        ELSE '❌ REGISTRATION WILL FAIL'
    END as status,
    'user_profiles INSERT policy: ' || (
        SELECT COUNT(*) FROM pg_policies 
        WHERE tablename = 'user_profiles' AND cmd = 'INSERT'
    ) || ', user_progress INSERT policy: ' || (
        SELECT COUNT(*) FROM pg_policies 
        WHERE tablename = 'user_progress' AND cmd = 'INSERT'
    ) as details;