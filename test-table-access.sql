-- Test if tables exist and are accessible

-- Test 1: Check if question_responses table exists
SELECT 'question_responses table test' as test;
SELECT COUNT(*) as total_responses FROM question_responses;

-- Test 2: List all tables to confirm structure
SELECT 'All tables:' as info, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 3: Check structure of question_responses if it exists
SELECT 'question_responses columns:' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'question_responses'
ORDER BY ordinal_position;

-- Test 4: Try different approach - check what user response/attempt tables exist
SELECT 'Tables with response/attempt pattern:' as info, table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%response%' OR table_name ILIKE '%attempt%')
ORDER BY table_name;

-- Test 5: Check for any tables that might store user answers/responses
SELECT 'All table names:' as info
UNION ALL
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;