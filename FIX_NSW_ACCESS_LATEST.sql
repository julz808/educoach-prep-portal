-- Add NSW Selective access for Julian's account
-- Based on the recent purchase from session: cs_live_b1YkvKLSgg9nyIcK0JpDnt2gqoIm6HOSKyFbIfnnDhmBnEKVar5w75dCt8

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
  'NSW Selective Entry (Year 7 Entry)',
  true,
  NOW(),
  'cs_live_b1YkvKLSgg9nyIcK0JpDnt2gqoIm6HOSKyFbIfnnDhmBnEKVar5w75dCt8',
  0,
  'aud'
);

-- Verify all your access grants
SELECT 
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id
FROM user_products 
WHERE user_id = '2c2e5c44-d953-48bc-89d7-52b8333edbda'
ORDER BY created_at DESC;