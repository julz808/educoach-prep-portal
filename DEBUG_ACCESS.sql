-- Debug script to check user access
-- Run this in Supabase SQL Editor to see what's in the database

-- Check all user_products records
SELECT 
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id,
  created_at
FROM user_products 
ORDER BY created_at DESC;

-- Check specific users
SELECT 
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id
FROM user_products 
WHERE user_id IN (
  '2c2e5c44-d953-48bc-89d7-52b8333edbda',  -- Julian's original ID
  '626b1878-0bb7-4224-bbb9-c169863d9146'   -- Second user ID from webhook
);

-- Check if there are any products for Julian's main account
SELECT 
  product_type,
  is_active,
  purchased_at
FROM user_products 
WHERE user_id = '2c2e5c44-d953-48bc-89d7-52b8333edbda'
  AND is_active = true;

-- Check for ACER and EduTest specifically
SELECT 
  user_id,
  product_type,
  is_active
FROM user_products 
WHERE product_type IN (
  'ACER Scholarship (Year 7 Entry)',
  'EduTest Scholarship (Year 7 Entry)'
)
ORDER BY created_at DESC;