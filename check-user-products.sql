-- Check if the user was created and product access was granted
-- for juliansunou@gmail.com and VIC Selective Entry

-- 1. Check if user exists in auth.users
SELECT 'AUTH USERS' as table_name, id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE email = 'juliansunou@gmail.com';

-- 2. Check if profile exists
SELECT 'PROFILES' as table_name, id, email, created_at
FROM profiles 
WHERE email = 'juliansunou@gmail.com';

-- 3. Check if user has product access
SELECT 'USER_PRODUCTS' as table_name, up.*, p.email
FROM user_products up
JOIN profiles p ON p.id = up.user_id
WHERE p.email = 'juliansunou@gmail.com';

-- 4. Check all recent user_products entries (last hour)
SELECT 'RECENT_USER_PRODUCTS' as table_name, up.*, p.email, up.created_at
FROM user_products up
JOIN profiles p ON p.id = up.user_id
WHERE up.created_at > NOW() - INTERVAL '1 hour'
ORDER BY up.created_at DESC;

-- 5. Check pending purchases
SELECT 'PENDING_PURCHASES' as table_name, *
FROM pending_purchases
WHERE email = 'juliansunou@gmail.com'
ORDER BY created_at DESC;