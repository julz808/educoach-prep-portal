-- RLS Audit Script for EduCourse Production Readiness
-- Run this in Supabase SQL Editor to check Row Level Security status

-- 1. Check RLS status for all public tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Check RLS policies for all tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Detailed audit for each critical table
-- Check user_profiles
SELECT 'user_profiles' as table_name, 
       COUNT(*) as policy_count,
       array_agg(policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- Check user_progress  
SELECT 'user_progress' as table_name,
       COUNT(*) as policy_count, 
       array_agg(policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_progress';

-- Check user_test_sessions
SELECT 'user_test_sessions' as table_name,
       COUNT(*) as policy_count,
       array_agg(policyname) as policies  
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_test_sessions';

-- Check test_section_states
SELECT 'test_section_states' as table_name,
       COUNT(*) as policy_count,
       array_agg(policyname) as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'test_section_states';

-- Check drill_sessions
SELECT 'drill_sessions' as table_name,
       COUNT(*) as policy_count,
       array_agg(policyname) as policies
FROM pg_policies  
WHERE schemaname = 'public' AND tablename = 'drill_sessions';

-- Check question_attempt_history
SELECT 'question_attempt_history' as table_name,
       COUNT(*) as policy_count,
       array_agg(policyname) as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'question_attempt_history';

-- Check user_sub_skill_performance
SELECT 'user_sub_skill_performance' as table_name,
       COUNT(*) as policy_count,
       array_agg(policyname) as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_sub_skill_performance';

-- Check questions table (should be read-only)
SELECT 'questions' as table_name,
       COUNT(*) as policy_count,
       array_agg(policyname) as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'questions';

-- Check writing_assessments
SELECT 'writing_assessments' as table_name,
       COUNT(*) as policy_count,
       array_agg(policyname) as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'writing_assessments';

-- 4. Check for tables WITHOUT RLS enabled (security risk)
SELECT 
    tablename,
    'RLS NOT ENABLED - SECURITY RISK!' as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = false
    AND tablename NOT IN (
        'questions',        -- Read-only reference data
        'sub_skills',       -- Read-only reference data  
        'subjects',         -- Read-only reference data
        'skill_areas'       -- Read-only reference data
    )
ORDER BY tablename;

-- 5. Summary report
SELECT 
    'TOTAL TABLES' as metric,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'TABLES WITH RLS ENABLED' as metric,
    COUNT(*) as count  
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT
    'TABLES WITHOUT RLS' as metric,
    COUNT(*) as count
FROM pg_tables  
WHERE schemaname = 'public' AND rowsecurity = false

UNION ALL

SELECT
    'TOTAL POLICIES' as metric,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public';