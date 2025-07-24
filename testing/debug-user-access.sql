-- Debug script to check user access for specific user having 406 errors
-- User ID from console logs: 2c2e5c44-d953-48bc-89d7-52b8333edbda

-- Check if user exists in auth.users
SELECT 
  id, 
  email, 
  created_at,
  confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE id = '2c2e5c44-d953-48bc-89d7-52b8333edbda';

-- Check if user has any records in user_products (this query should work if RLS is correct)
SELECT 
  id,
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id
FROM user_products 
WHERE user_id = '2c2e5c44-d953-48bc-89d7-52b8333edbda';

-- Specifically check for ACER Scholarship product
SELECT 
  id,
  user_id,
  product_type,
  is_active,
  purchased_at
FROM user_products 
WHERE user_id = '2c2e5c44-d953-48bc-89d7-52b8333edbda'
  AND product_type = 'ACER Scholarship (Year 7 Entry)'
  AND is_active = true;

-- Check current RLS policies on user_products
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

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_products';

-- Test the access function
SELECT check_user_product_access(
  '2c2e5c44-d953-48bc-89d7-52b8333edbda'::UUID, 
  'ACER Scholarship (Year 7 Entry)'
) as has_access;