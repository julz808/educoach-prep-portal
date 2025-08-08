-- APPLY THIS SQL IN SUPABASE SQL EDITOR
-- Create pending_purchases table to track guest purchases before account creation

CREATE TABLE IF NOT EXISTS pending_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email TEXT NOT NULL,
    product_type TEXT NOT NULL,
    stripe_session_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    amount_paid INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'aud',
    payment_status TEXT DEFAULT 'paid',
    is_processed BOOLEAN DEFAULT false, -- Set to true when linked to user account
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'), -- 30 days to claim
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata from Stripe session
    stripe_metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE pending_purchases ENABLE ROW LEVEL SECURITY;

-- Only service role can manage pending purchases (webhooks)
CREATE POLICY "Service role full access" ON pending_purchases 
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users can view their own pending purchases by email
CREATE POLICY "Users can view own pending purchases by email" ON pending_purchases 
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        customer_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS pending_purchases_email_idx ON pending_purchases(customer_email);
CREATE INDEX IF NOT EXISTS pending_purchases_stripe_session_idx ON pending_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS pending_purchases_is_processed_idx ON pending_purchases(is_processed);
CREATE INDEX IF NOT EXISTS pending_purchases_expires_at_idx ON pending_purchases(expires_at);

-- Add updated_at trigger
CREATE TRIGGER update_pending_purchases_updated_at 
    BEFORE UPDATE ON pending_purchases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get pending purchases for a user by email
CREATE OR REPLACE FUNCTION get_user_pending_purchases(user_email TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    customer_email TEXT,
    product_type TEXT,
    stripe_session_id TEXT,
    amount_paid INTEGER,
    currency TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    lookup_email TEXT;
BEGIN
    -- Use provided email or get current user's email
    IF user_email IS NULL THEN
        SELECT email INTO lookup_email FROM auth.users WHERE id = auth.uid();
    ELSE
        lookup_email := user_email;
    END IF;
    
    -- Return pending purchases for this email
    RETURN QUERY
    SELECT 
        pp.id,
        pp.customer_email,
        pp.product_type,
        pp.stripe_session_id,
        pp.amount_paid,
        pp.currency,
        pp.created_at,
        pp.expires_at
    FROM pending_purchases pp
    WHERE pp.customer_email = lookup_email
    AND pp.is_processed = false
    AND pp.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process pending purchase (link to user account)
CREATE OR REPLACE FUNCTION process_pending_purchase(
    p_stripe_session_id TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_pending_purchase pending_purchases%ROWTYPE;
    v_result JSONB;
BEGIN
    -- Use provided user_id or get from auth context
    IF p_user_id IS NULL THEN
        v_user_id := auth.uid();
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    -- Get the pending purchase
    SELECT * INTO v_pending_purchase 
    FROM pending_purchases 
    WHERE stripe_session_id = p_stripe_session_id 
    AND is_processed = false
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pending purchase not found or expired',
            'stripe_session_id', p_stripe_session_id
        );
    END IF;
    
    -- Verify user email matches the purchase email
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = v_user_id 
        AND email = v_pending_purchase.customer_email
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User email does not match purchase email',
            'purchase_email', v_pending_purchase.customer_email
        );
    END IF;
    
    BEGIN
        -- Create user_products record
        INSERT INTO user_products (
            user_id,
            product_type,
            stripe_session_id,
            stripe_customer_id,
            amount_paid,
            currency,
            purchased_at,
            is_active
        ) VALUES (
            v_user_id,
            v_pending_purchase.product_type,
            v_pending_purchase.stripe_session_id,
            v_pending_purchase.stripe_customer_id,
            v_pending_purchase.amount_paid,
            v_pending_purchase.currency,
            v_pending_purchase.created_at,
            true
        ) ON CONFLICT (user_id, product_type) DO UPDATE SET
            is_active = true,
            updated_at = NOW();
        
        -- Mark pending purchase as processed
        UPDATE pending_purchases 
        SET 
            is_processed = true,
            processed_at = NOW(),
            processed_user_id = v_user_id,
            updated_at = NOW()
        WHERE id = v_pending_purchase.id;
        
        v_result := jsonb_build_object(
            'success', true,
            'message', 'Purchase successfully linked to account',
            'product_type', v_pending_purchase.product_type,
            'user_id', v_user_id
        );
        
    EXCEPTION WHEN OTHERS THEN
        v_result := jsonb_build_object(
            'success', false,
            'error', 'Failed to process purchase: ' || SQLERRM,
            'error_code', SQLSTATE
        );
    END;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON pending_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_pending_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION process_pending_purchase TO authenticated;