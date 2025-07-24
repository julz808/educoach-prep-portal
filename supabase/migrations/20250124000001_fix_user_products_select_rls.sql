-- Fix missing SELECT RLS policy for user_products table
-- This resolves the 406 errors when users try to check their product access

-- Add SELECT policy for user_products so users can read their own access records
CREATE POLICY "Users can view their own products" ON user_products 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Grant SELECT permission to authenticated users
GRANT SELECT ON user_products TO authenticated;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_products' AND cmd = 'SELECT';

-- Add helpful comment
COMMENT ON POLICY "Users can view their own products" ON user_products IS 
'Allows authenticated users to read their own product access records. Critical for access control system.';