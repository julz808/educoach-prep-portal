-- Diagnostic query to check session status issues
-- This will help identify why section cards show "Not Started" when sessions exist

-- 1. Check all diagnostic sessions and their statuses
SELECT
  id,
  user_id,
  product_type,
  test_mode,
  section_name,
  status,
  current_question_index,
  total_questions,
  questions_answered,
  created_at,
  updated_at
FROM user_test_sessions
WHERE test_mode = 'diagnostic'
ORDER BY product_type, section_name, updated_at DESC;

-- 2. Check for product type variations (to identify naming mismatches)
SELECT DISTINCT
  product_type,
  test_mode,
  COUNT(*) as session_count
FROM user_test_sessions
GROUP BY product_type, test_mode
ORDER BY product_type, test_mode;

-- 3. Check for section name variations within each product
SELECT DISTINCT
  product_type,
  section_name,
  COUNT(*) as session_count,
  COUNT(DISTINCT status) as unique_statuses,
  array_agg(DISTINCT status) as statuses
FROM user_test_sessions
WHERE test_mode = 'diagnostic'
GROUP BY product_type, section_name
ORDER BY product_type, section_name;

-- 4. Find active sessions that should show as "In Progress"
SELECT
  product_type,
  section_name,
  status,
  current_question_index,
  total_questions,
  questions_answered,
  updated_at
FROM user_test_sessions
WHERE test_mode = 'diagnostic'
  AND status = 'active'
ORDER BY product_type, section_name, updated_at DESC;

-- 5. Check for any sessions with unexpected status values
SELECT DISTINCT status, COUNT(*) as count
FROM user_test_sessions
WHERE test_mode = 'diagnostic'
GROUP BY status;
