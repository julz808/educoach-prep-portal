-- Manually grant access to test user for ACER Scholarship to test the system
-- User ID: 2c2e5c44-d953-48bc-89d7-52b8333edbda

-- First check if record already exists
SELECT 
  id,
  user_id,
  product_type,
  is_active,
  purchased_at
FROM user_products 
WHERE user_id = '2c2e5c44-d953-48bc-89d7-52b8333edbda'
  AND product_type = 'ACER Scholarship (Year 7 Entry)';

-- If no record exists, insert one (using UPSERT to avoid conflicts)
INSERT INTO user_products (
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id,
  amount_paid,
  currency
) VALUES (
  '2c2e5c44-d953-48bc-89d7-52b8333edbda',
  'ACER Scholarship (Year 7 Entry)',
  true,
  NOW(),
  'manual_test_grant',
  19900, -- $199 AUD in cents
  'aud'
)
ON CONFLICT (user_id, product_type) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- Verify the record was created/updated
SELECT 
  id,
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id
FROM user_products 
WHERE user_id = '2c2e5c44-d953-48bc-89d7-52b8333edbda'
  AND product_type = 'ACER Scholarship (Year 7 Entry)';

-- Test the access function
SELECT check_user_product_access(
  '2c2e5c44-d953-48bc-89d7-52b8333edbda'::UUID, 
  'ACER Scholarship (Year 7 Entry)'
) as has_access;