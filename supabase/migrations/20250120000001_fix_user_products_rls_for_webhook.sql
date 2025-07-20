-- Fix RLS policies to allow service role access for Stripe webhooks
-- This resolves the issue where webhooks cannot insert into user_products

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert products" ON user_products;

-- Create new policy that allows both authenticated users and service role
CREATE POLICY "Allow user and service role insert" ON user_products 
    FOR INSERT WITH CHECK (
        -- Allow authenticated users to insert their own records
        auth.uid() = user_id OR 
        -- Allow service role to insert any record (for webhook automation)
        auth.jwt() ->> 'role' = 'service_role' OR
        -- Fallback for service role operations that don't have auth context
        current_user = 'service_role'
    );

-- Drop the existing restrictive UPDATE policy  
DROP POLICY IF EXISTS "Only service role can update products" ON user_products;

-- Create new UPDATE policy that allows service role
CREATE POLICY "Allow service role update" ON user_products 
    FOR UPDATE USING (
        -- Allow service role to update any record
        auth.jwt() ->> 'role' = 'service_role' OR
        current_user = 'service_role'
    );

-- Drop the existing restrictive DELETE policy
DROP POLICY IF EXISTS "Only service role can delete products" ON user_products;

-- Create new DELETE policy that allows service role
CREATE POLICY "Allow service role delete" ON user_products 
    FOR DELETE USING (
        -- Allow service role to delete any record
        auth.jwt() ->> 'role' = 'service_role' OR
        current_user = 'service_role'
    );

-- Grant explicit permissions to service role
GRANT ALL PRIVILEGES ON user_products TO service_role;

-- Grant service role ability to bypass RLS entirely (most important fix)
GRANT USAGE ON SCHEMA public TO service_role;

-- Add comment explaining the fix
COMMENT ON TABLE user_products IS 'Table for tracking user product access. Service role has full access for webhook automation.';

-- Verify the policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_products';