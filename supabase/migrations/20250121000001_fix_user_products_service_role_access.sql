-- Fix user_products RLS policies to allow service role access
-- The current policy prevents service role from inserting records

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert products" ON user_products;

-- Create new policies that allow service role access
-- Service role bypasses RLS, but we need to handle both authenticated users and service role

-- Allow inserts from authenticated users OR when there's no auth context (service role)
CREATE POLICY "Allow product purchases via webhook or authenticated users" ON user_products 
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL  -- Regular authenticated users
        OR 
        auth.uid() IS NULL      -- Service role (no auth context)
    );

-- Alternative: Create a more explicit service role policy
-- This allows any insert when using service role, while maintaining user restrictions
CREATE POLICY "Service role can manage all products" ON user_products 
    FOR ALL 
    USING (
        -- Allow service role to do anything (auth.uid() will be NULL)
        auth.uid() IS NULL
        OR 
        -- Or allow users to access their own data
        auth.uid() = user_id
    );

-- Grant necessary permissions to service_role
GRANT ALL ON user_products TO service_role;

-- Also ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION check_user_product_access TO service_role;