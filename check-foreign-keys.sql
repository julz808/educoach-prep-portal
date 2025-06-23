-- Check ALL tables that reference user_test_sessions
SELECT DISTINCT
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'user_test_sessions'
ORDER BY tc.table_name;

-- Also check if there are any rows in these tables
SELECT 'writing_assessments' as table_name, COUNT(*) as row_count FROM writing_assessments
UNION ALL
SELECT 'test_section_states', COUNT(*) FROM test_section_states
UNION ALL
SELECT 'user_test_sessions', COUNT(*) FROM user_test_sessions;