# Complete Stripe Webhook Setup Guide

## Step 1: Delete Old Webhook (if exists)

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Find your existing webhook** (should show the old URL)
3. **Click on the webhook** → **More** → **Delete endpoint**
4. **Confirm deletion**

## Step 2: Create New Webhook

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click "Add endpoint"**
3. **Fill in the details:**

### Endpoint URL
```
https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook
```

### Description (optional)
```
EduCourse Product Access Webhook
```

### Events to send
- **Click "Select events"**
- **Find and select:** `checkout.session.completed`
- **Find and select:** `payment_intent.payment_failed` (optional, for error handling)
- **Click "Add events"**

### API Version
- **Leave as default** (should be latest)

### Endpoint settings
- **Leave all other settings as default**

4. **Click "Add endpoint"**

## Step 3: Copy Webhook Secret

1. **After creating the webhook**, you'll see the webhook details page
2. **Click "Reveal" next to "Signing secret"**
3. **Copy the secret** (starts with `whsec_`)
4. **Save it securely** - you'll need it in Step 4

## Step 4: Update Supabase Environment Variables

1. **Go to Supabase Dashboard** → **Edge Functions** → **stripe-webhook**
2. **Click "Settings" tab**
3. **Update or add these environment variables:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | The secret you copied in Step 3 |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Your Stripe live secret key |
| `SUPABASE_URL` | `https://mcxxiunseawojmojikvb.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Your Supabase service role key |

4. **Save the environment variables**

## Step 5: Test the Webhook

### Option A: Use Stripe's Test Feature
1. **In the webhook details page**, click **"Send test webhook"**
2. **Select event type:** `checkout.session.completed`
3. **Click "Send test webhook"**
4. **Check Supabase Function Logs** for:
   - ✅ `🌐 Webhook received:`
   - ✅ `🔍 Environment check:`
   - ✅ `✅ Webhook signature verified:`

### Option B: Make a Real Test Purchase
1. **Make a small test purchase** ($1 or use a 100% discount code)
2. **Check Supabase Function Logs** for success messages
3. **Verify access is granted automatically**

## Step 6: Apply Database Migration (CRITICAL)

**Run this SQL in Supabase SQL Editor:**

```sql
-- Fix RLS policies to allow service role access
DROP POLICY IF EXISTS "Authenticated users can insert products" ON user_products;

CREATE POLICY "Allow user and service role insert" ON user_products 
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role' OR
        current_user = 'service_role'
    );

-- Grant explicit permissions to service role
GRANT ALL PRIVILEGES ON user_products TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Verify the fix worked
SELECT 'RLS policies updated successfully' as status;
```

## Step 7: Verify Everything Works

### Expected Webhook Flow:
1. **Customer completes purchase** → Stripe sends webhook
2. **Webhook receives event** → Logs show `🌐 Webhook received:`
3. **Signature verified** → Logs show `✅ Webhook signature verified:`
4. **Database access test** → Logs show `✅ Service role database access confirmed`
5. **Product access granted** → Logs show `✅ Product access granted successfully:`
6. **Customer has immediate access** → No paywall, can use product

### Expected Supabase Function Logs:
```
🌐 Webhook received: POST /stripe-webhook
🔍 Environment check: {hasStripeKey: true, hasSupabaseUrl: true, ...}
✅ Webhook signature verified: checkout.session.completed evt_...
🔍 Testing service role database access...
✅ Service role database access confirmed
🎉 Processing completed checkout session: cs_live_...
📋 Session metadata: {userId: "...", userEmail: "...", ...}
📦 Processing 1 line items
🔍 Processing product: {stripeProductId: "prod_...", dbProductType: "Year 7 NAPLAN", ...}
✅ Product access granted successfully: {userId: "...", productType: "Year 7 NAPLAN", ...}
✅ Webhook processed successfully
```

## Troubleshooting

### If you see "401 Unauthorized":
- **Check webhook secret** matches in Stripe and Supabase
- **Verify webhook URL** is exactly correct
- **Check Stripe is sending to the right endpoint**

### If you see "No results found" in logs:
- **Webhook isn't being called** - check Stripe webhook URL
- **Check webhook is enabled** in Stripe

### If you see database errors:
- **Apply the RLS migration** from Step 6
- **Check service role key** is correct in environment variables

### If access isn't granted:
- **Check user ID** matches between purchase and user account
- **Verify product mapping** in webhook code
- **Check database records** with: `SELECT * FROM user_products WHERE user_id = 'your-user-id'`

## Success Criteria

✅ **Webhook responds with 200 OK** in Stripe dashboard  
✅ **Supabase logs show emoji success messages**  
✅ **Database gets new user_products record**  
✅ **Customer has immediate access** (no paywall)  
✅ **No manual intervention needed**  

## Important Notes

- **Use live keys** for production (sk_live_, whsec_)
- **Test thoroughly** before going live
- **Monitor webhook logs** for the first few real purchases
- **Keep webhook secret secure** - never commit to code
- **Backup existing webhook settings** before making changes

---

**Once this setup is complete, purchases will automatically grant access without any manual intervention!** 🎉