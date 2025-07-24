-- Verify current RLS policies on user_products table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_products'
ORDER BY cmd, policyname;

-- Check if RLS is enabled on user_products
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_products';

-- Check table permissions
SELECT 
  grantee,
  privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'user_products'
ORDER BY grantee, privilege_type;