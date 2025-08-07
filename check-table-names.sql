-- Check what tables exist in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check for tables that might store user responses/attempts
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name ILIKE '%response%' OR 
    table_name ILIKE '%attempt%' OR 
    table_name ILIKE '%answer%' OR
    table_name ILIKE '%session%' OR
    table_name ILIKE '%result%'
  )
ORDER BY table_name;

-- Check column structure of tables that might be relevant
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (
        table_name ILIKE '%response%' OR 
        table_name ILIKE '%attempt%' OR 
        table_name ILIKE '%answer%' OR
        table_name ILIKE '%session%' OR
        table_name ILIKE '%result%'
      )
  )
ORDER BY table_name, column_name;