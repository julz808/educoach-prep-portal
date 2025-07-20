-- Grant access for the recent purchase
-- User ID: 626b1878-0bb7-4224-bbb9-c169863d9146
-- Product: EduTest Scholarship (Year 7 Entry)
-- Session: cs_live_b1FrgI77QPLHZLfuPyblqTmTQstF3GnQCYeCFQT5kMMCURmR89oso9YsMD

INSERT INTO user_products (
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id,
  amount_paid,
  currency
) VALUES (
  '626b1878-0bb7-4224-bbb9-c169863d9146',
  'EduTest Scholarship (Year 7 Entry)',
  true,
  NOW(),
  'cs_live_b1FrgI77QPLHZLfuPyblqTmTQstF3GnQCYeCFQT5kMMCURmR89oso9YsMD',
  0, -- Amount was 0 due to discount
  'aud'
);

-- Also grant access for the original user (Julian) for testing
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
  'EduTest Scholarship (Year 7 Entry)',
  true,
  NOW(),
  'manual_grant_julian',
  19900,
  'aud'
);