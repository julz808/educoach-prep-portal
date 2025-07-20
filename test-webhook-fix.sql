-- Test script to verify webhook fix works properly
-- Run this after applying the RLS migration

-- 1. Test that service role can insert into user_products
DO $$
DECLARE
    test_user_id UUID := '2c2e5c44-d953-48bc-89d7-52b8333edbda';
    test_result BOOLEAN;
BEGIN
    -- Try to insert a test record as service role would
    INSERT INTO user_products (
        user_id,
        product_type,
        is_active,
        purchased_at,
        stripe_session_id,
        amount_paid,
        currency
    ) VALUES (
        test_user_id,
        'TEST PRODUCT - WEBHOOK FIX',
        true,
        NOW(),
        'test_session_webhook_fix',
        19900,
        'aud'
    );
    
    -- Verify the insert worked
    SELECT EXISTS(
        SELECT 1 FROM user_products 
        WHERE user_id = test_user_id 
        AND product_type = 'TEST PRODUCT - WEBHOOK FIX'
        AND stripe_session_id = 'test_session_webhook_fix'
    ) INTO test_result;
    
    IF test_result THEN
        RAISE NOTICE '✅ WEBHOOK FIX SUCCESS: Service role can insert into user_products';
    ELSE
        RAISE NOTICE '❌ WEBHOOK FIX FAILED: Service role cannot insert into user_products';
    END IF;
    
    -- Clean up test record
    DELETE FROM user_products 
    WHERE user_id = test_user_id 
    AND product_type = 'TEST PRODUCT - WEBHOOK FIX';
    
END $$;

-- 2. Verify current RLS policies
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_products'
ORDER BY policyname;

-- 3. Check current user product access
SELECT 
    user_id,
    product_type,
    is_active,
    purchased_at,
    stripe_session_id,
    amount_paid
FROM user_products 
WHERE user_id = '2c2e5c44-d953-48bc-89d7-52b8333edbda'
ORDER BY created_at DESC;