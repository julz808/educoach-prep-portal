-- COMPREHENSIVE WEBHOOK DIAGNOSTIC TOOL
-- Run this to identify all possible issues with the webhook system

-- 1. Check current user product access for the failing user
SELECT 
    'CURRENT USER ACCESS' as diagnostic_type,
    user_id,
    product_type,
    is_active,
    purchased_at,
    stripe_session_id,
    amount_paid,
    created_at
FROM user_products 
WHERE user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
ORDER BY created_at DESC;

-- 2. Check RLS policies on user_products table
SELECT 
    'RLS POLICIES' as diagnostic_type,
    schemaname,
    tablename, 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_products'
ORDER BY policyname;

-- 3. Check table permissions for service role
SELECT 
    'TABLE PERMISSIONS' as diagnostic_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'user_products' 
AND grantee IN ('service_role', 'authenticated', 'anon');

-- 4. Test service role can insert (this should work after RLS fix)
-- Note: This will only work if run with service role privileges
INSERT INTO user_products (
    user_id,
    product_type,
    is_active,
    purchased_at,
    stripe_session_id,
    amount_paid,
    currency
) VALUES (
    'fce34bfa-98d5-44ed-848d-b550c3e785bc',
    'DIAGNOSTIC TEST PRODUCT',
    true,
    NOW(),
    'test_diagnostic_session',
    0,
    'aud'
) ON CONFLICT (user_id, product_type) DO NOTHING;

-- 5. Verify the test insert worked
SELECT 
    'TEST INSERT RESULT' as diagnostic_type,
    user_id,
    product_type,
    created_at
FROM user_products 
WHERE product_type = 'DIAGNOSTIC TEST PRODUCT'
AND user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc';

-- 6. Clean up test data
DELETE FROM user_products 
WHERE product_type = 'DIAGNOSTIC TEST PRODUCT';

-- 7. Grant access for the actual failing purchases
INSERT INTO user_products (
    user_id,
    product_type,
    is_active,
    purchased_at,
    stripe_session_id,
    amount_paid,
    currency
) VALUES 
    -- Year 7 NAPLAN purchase
    ('fce34bfa-98d5-44ed-848d-b550c3e785bc', 'Year 7 NAPLAN', true, NOW(), 'cs_live_b1RsixY7G9R1LJZyf3H1vAuVlqBucA0IdYJLL2crvCy4hCbAW2vHaim3a6', 0, 'aud'),
    -- Year 5 NAPLAN purchase  
    ('fce34bfa-98d5-44ed-848d-b550c3e785bc', 'Year 5 NAPLAN', true, NOW(), 'cs_live_b1e5bH6c6Nwgp0xMg1LddgMbH2TjrfzOkv6gxKdToCsgj2iuFzLkS297wH', 0, 'aud')
ON CONFLICT (user_id, product_type) DO UPDATE SET
    purchased_at = NOW(),
    stripe_session_id = EXCLUDED.stripe_session_id,
    is_active = true;

-- 8. Verify final access state
SELECT 
    'FINAL ACCESS STATE' as diagnostic_type,
    user_id,
    product_type,
    is_active,
    purchased_at,
    stripe_session_id
FROM user_products 
WHERE user_id = 'fce34bfa-98d5-44ed-848d-b550c3e785bc'
ORDER BY created_at DESC;