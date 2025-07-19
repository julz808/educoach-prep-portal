# Stripe Live Mode Setup Guide

## Step 1: Create Live Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com (make sure you're in **LIVE** mode, not test mode)
2. Navigate to **Products** → **Add product**
3. Create 6 products with AUD $199 pricing:

```
Product 1: Year 5 NAPLAN - $199 AUD
Product 2: Year 7 NAPLAN - $199 AUD  
Product 3: EduTest Scholarship (Year 7 Entry) - $199 AUD
Product 4: ACER Scholarship (Year 7 Entry) - $199 AUD
Product 5: NSW Selective Entry (Year 7 Entry) - $199 AUD
Product 6: VIC Selective Entry (Year 9 Entry) - $199 AUD
```

4. **Copy the Product IDs and Price IDs** for live mode (they'll be different from test mode)

## Step 2: Get Live API Keys

1. Go to https://dashboard.stripe.com/apikeys (ensure **LIVE** mode)
2. Copy your **Publishable key** (starts with `pk_live_`)
3. Copy your **Secret key** (starts with `sk_live_`)

## Step 3: Create Database Table (Manual)

Go to your Supabase Dashboard → SQL Editor and run this query:

```sql
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
```

## Step 4: Deploy Stripe Webhook Function

1. Go to Supabase Dashboard → Edge Functions
2. Click **New Function** → Name it `stripe-webhook`
3. Copy the contents of `/supabase/functions/stripe-webhook/index.ts` into the editor
4. Click **Deploy**

## Step 5: Update Environment Variables

### For Vercel Production:
1. Go to your Vercel dashboard → Project Settings → Environment Variables
2. Add these with your **LIVE** Stripe keys:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY

# Update with LIVE product IDs
VITE_STRIPE_YEAR5_NAPLAN_PRODUCT_ID=prod_LIVE_PRODUCT_ID_1
VITE_STRIPE_YEAR7_NAPLAN_PRODUCT_ID=prod_LIVE_PRODUCT_ID_2
VITE_STRIPE_EDUTEST_PRODUCT_ID=prod_LIVE_PRODUCT_ID_3
VITE_STRIPE_ACER_PRODUCT_ID=prod_LIVE_PRODUCT_ID_4
VITE_STRIPE_NSW_SELECTIVE_PRODUCT_ID=prod_LIVE_PRODUCT_ID_5
VITE_STRIPE_VIC_SELECTIVE_PRODUCT_ID=prod_LIVE_PRODUCT_ID_6

# Update with LIVE price IDs  
VITE_STRIPE_YEAR5_NAPLAN_PRICE_ID=price_LIVE_PRICE_ID_1
VITE_STRIPE_YEAR7_NAPLAN_PRICE_ID=price_LIVE_PRICE_ID_2
VITE_STRIPE_EDUTEST_PRICE_ID=price_LIVE_PRICE_ID_3
VITE_STRIPE_ACER_PRICE_ID=price_LIVE_PRICE_ID_4
VITE_STRIPE_NSW_SELECTIVE_PRICE_ID=price_LIVE_PRICE_ID_5
VITE_STRIPE_VIC_SELECTIVE_PRICE_ID=price_LIVE_PRICE_ID_6
```

### For Supabase Edge Functions:
1. Go to Supabase Dashboard → Settings → API
2. Add these environment variables:

```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
SUPABASE_URL=https://mcxxiunseawojmojikvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Step 6: Set Up Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. Set endpoint URL to: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `customer.subscription.deleted` (for future use)
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Add this secret to your Supabase environment variables

## Step 7: Update Webhook Handler Product Mapping

Update the `STRIPE_PRODUCT_TO_DB_TYPE` mapping in the webhook function with your **LIVE** product IDs:

```typescript
const STRIPE_PRODUCT_TO_DB_TYPE: Record<string, string> = {
  'prod_LIVE_PRODUCT_ID_1': 'Year 5 NAPLAN',
  'prod_LIVE_PRODUCT_ID_2': 'Year 7 NAPLAN', 
  'prod_LIVE_PRODUCT_ID_3': 'EduTest Scholarship (Year 7 Entry)',
  'prod_LIVE_PRODUCT_ID_4': 'ACER Scholarship (Year 7 Entry)',
  'prod_LIVE_PRODUCT_ID_5': 'NSW Selective Entry (Year 7 Entry)',
  'prod_LIVE_PRODUCT_ID_6': 'VIC Selective Entry (Year 9 Entry)'
};
```

## Step 8: Update Access Control Service

Update your `accessControlService.ts` to use the new `user_products` table:

```typescript
// Check if user has purchased a product
export async function checkProductAccess(userId: string, productType: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_products')
    .select('is_active')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking product access:', error);
    return false;
  }

  return !!data;
}
```

## Step 9: Test the Complete Flow

1. Deploy all changes to Vercel
2. Test with a small amount first ($1 AUD test)
3. Verify webhook receives events
4. Confirm product access is granted
5. Test with real payment methods

## Step 10: Go Live Checklist

- [ ] All live products created in Stripe
- [ ] Live API keys configured in production
- [ ] Database table created
- [ ] Webhook function deployed
- [ ] Webhook endpoint configured in Stripe
- [ ] Product mapping updated with live IDs
- [ ] Access control updated to use user_products table
- [ ] End-to-end testing completed
- [ ] Payment flow tested with real cards

## Important Notes

- **Keep test and live keys separate**
- **Never commit live keys to git**
- **Test thoroughly before launch**
- **Monitor webhook delivery in Stripe dashboard**
- **Set up proper error monitoring**

## Troubleshooting

- Check Supabase Edge Function logs for webhook errors
- Verify webhook signature validation
- Ensure product ID mapping is correct
- Check Stripe dashboard for failed webhook deliveries