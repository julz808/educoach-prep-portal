-- Add Year 7 NAPLAN access for Julian's account
-- Based on the recent purchase from session: cs_live_b1oA0o7cMD2uzwdDvlgmx2gQRSs92bO1CkQL0mvO03Cg3QPqiqnhDELS16

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
  'Year 7 NAPLAN',
  true,
  NOW(),
  'cs_live_b1oA0o7cMD2uzwdDvlgmx2gQRSs92bO1CkQL0mvO03Cg3QPqiqnhDELS16',
  0,
  'aud'
);

-- Verify the insert worked
SELECT 
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id
FROM user_products 
WHERE user_id = '2c2e5c44-d953-48bc-89d7-52b8333edbda'
ORDER BY created_at DESC;