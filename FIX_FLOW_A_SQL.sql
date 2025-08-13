-- Fix the ambiguous column reference in get_user_pending_purchases function
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mcxxiunseawojmojikvb/sql/new

DROP FUNCTION IF EXISTS get_user_pending_purchases(TEXT);

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
        SELECT auth.users.email INTO lookup_email FROM auth.users WHERE auth.users.id = auth.uid();
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_pending_purchases TO authenticated;