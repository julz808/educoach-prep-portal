-- Create user_products table to track product purchases and access
CREATE TABLE IF NOT EXISTS user_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL means no expiration
    stripe_session_id TEXT,
    stripe_customer_id TEXT,
    amount_paid INTEGER, -- Amount in cents
    currency TEXT DEFAULT 'aud',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only have one record per product type
    UNIQUE(user_id, product_type)
);

-- Add RLS policies
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

-- Users can only see their own product purchases
CREATE POLICY "Users can view their own products" ON user_products 
    FOR SELECT USING (auth.uid() = user_id);

-- Only authenticated users can insert (via webhook/admin)
CREATE POLICY "Authenticated users can insert products" ON user_products 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users cannot update their own products (only webhooks/admin can)
CREATE POLICY "Only service role can update products" ON user_products 
    FOR UPDATE USING (false);

-- Users cannot delete their own products
CREATE POLICY "Only service role can delete products" ON user_products 
    FOR DELETE USING (false);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS user_products_user_id_idx ON user_products(user_id);
CREATE INDEX IF NOT EXISTS user_products_product_type_idx ON user_products(product_type);
CREATE INDEX IF NOT EXISTS user_products_is_active_idx ON user_products(is_active);
CREATE INDEX IF NOT EXISTS user_products_stripe_session_idx ON user_products(stripe_session_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_products_updated_at 
    BEFORE UPDATE ON user_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add a function to check if user has access to a product
CREATE OR REPLACE FUNCTION check_user_product_access(user_uuid UUID, product_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_products 
        WHERE user_id = user_uuid 
        AND product_type = product_name 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_products TO authenticated;
GRANT INSERT ON user_products TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_product_access TO authenticated;