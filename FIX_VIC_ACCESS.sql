-- Add VIC Selective access for Julian's account
-- Based on the recent purchase from session: cs_live_b1qQ69OhEsV1oMe7SYEFJ5Y1hSemdWutMSzJzq2Ysik1GBaEDQgBmlPKzO

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
  'VIC Selective Entry (Year 9 Entry)',
  true,
  NOW(),
  'cs_live_b1qQ69OhEsV1oMe7SYEFJ5Y1hSemdWutMSzJzq2Ysik1GBaEDQgBmlPKzO',
  19900,
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