-- Grant access to ACER Scholarship for the test user
INSERT INTO user_products (
  user_id,
  product_type,
  is_active,
  purchased_at
) 
SELECT 
  u.id,
  'ACER Scholarship (Year 7 Entry)',
  true,
  NOW()
FROM auth.users u 
WHERE u.email = 'admin@baysideacademics.com.au'
ON CONFLICT (user_id, product_type) 
DO UPDATE SET 
  is_active = true,
  purchased_at = NOW();