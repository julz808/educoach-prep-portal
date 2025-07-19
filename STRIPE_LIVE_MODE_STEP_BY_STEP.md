# Stripe Live Mode Setup - Step by Step Guide

## IMPORTANT: Complete these steps in exact order

### Step 1: Update Database Table

1. Go to https://supabase.com/dashboard
2. Select your project: `educoach-prep-portal-2`
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Run these queries ONE BY ONE (copy and paste each one separately):

**Query 1: Add missing columns**
```sql
-- Add stripe_session_id column (ignore error if exists)
ALTER TABLE user_products ADD COLUMN stripe_session_id TEXT;
```

**Query 2: Add stripe_customer_id column**
```sql
-- Add stripe_customer_id column (ignore error if exists)
ALTER TABLE user_products ADD COLUMN stripe_customer_id TEXT;
```

**Query 3: Add amount_paid column**
```sql
-- Add amount_paid column (ignore error if exists)
ALTER TABLE user_products ADD COLUMN amount_paid INTEGER;
```

**Query 4: Add currency column**
```sql
-- Add currency column (ignore error if exists)
ALTER TABLE user_products ADD COLUMN currency TEXT DEFAULT 'aud';
```

**Query 5: Add expires_at column**
```sql
-- Add expires_at column (ignore error if exists)
ALTER TABLE user_products ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
```

**Query 6: Create indexes**
```sql
-- Create indexes (ignore errors if they exist)
CREATE INDEX IF NOT EXISTS user_products_user_id_idx ON user_products(user_id);
CREATE INDEX IF NOT EXISTS user_products_product_type_idx ON user_products(product_type);
CREATE INDEX IF NOT EXISTS user_products_is_active_idx ON user_products(is_active);
CREATE INDEX IF NOT EXISTS user_products_stripe_session_idx ON user_products(stripe_session_id);
```

**Query 7: Add the access function**
```sql
-- Add the function (this will replace if exists)
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
```

**Query 8: Grant permissions**
```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_products TO authenticated;
GRANT INSERT ON user_products TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_product_access TO authenticated;
```

**IMPORTANT:** You may see errors like "column already exists" - that's NORMAL and SAFE to ignore. Just continue with the next query.

### Step 2: Verify the table is ready

Run this query to check the table structure:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_products' 
ORDER BY ordinal_position;
```

You should see these columns:
- id (uuid)
- user_id (uuid) 
- product_type (text)
- is_active (boolean)
- purchased_at (timestamp with time zone)
- expires_at (timestamp with time zone)
- stripe_session_id (text)
- stripe_customer_id (text)
- amount_paid (integer)
- currency (text)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

If you see all these columns, you're ready to proceed!

### Step 3: Create Stripe Webhook Function

1. Still in Supabase Dashboard, click **Edge Functions** in left sidebar
2. Click **Create a new function**
3. Name: `stripe-webhook`
4. Replace ALL the code with this EXACT code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Stripe product ID to database product type mapping
const STRIPE_PRODUCT_TO_DB_TYPE: Record<string, string> = {
  'prod_ShnPdOiDYbl6r0': 'Year 5 NAPLAN',
  'prod_ShnRiUgfv0qnuc': 'Year 7 NAPLAN', 
  'prod_ShnVu21eaNIeqa': 'EduTest Scholarship (Year 7 Entry)',
  'prod_ShnYQIQbQp0qzx': 'ACER Scholarship (Year 7 Entry)',
  'prod_ShnNTdv0tv1ikx': 'NSW Selective Entry (Year 7 Entry)',
  'prod_ShnKBAkGwieDH0': 'VIC Selective Entry (Year 9 Entry)'
};

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      return new Response('Missing stripe-signature header', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-08-16',
    })

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('❌ Missing STRIPE_WEBHOOK_SECRET')
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // Get raw body for signature verification
    const body = await req.text()
    
    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified:', event.type)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('🎉 Payment successful for session:', session.id)
        
        // Extract metadata from the session
        const userId = session.metadata?.userId
        const productId = session.metadata?.productId
        const userEmail = session.customer_email || session.customer_details?.email

        if (!userId) {
          console.error('❌ Missing userId in session metadata')
          return new Response('Missing userId in metadata', { 
            status: 400,
            headers: corsHeaders 
          })
        }

        // Get the line items to determine what was purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        })

        console.log('📦 Line items:', lineItems.data.length)

        // Process each purchased item
        for (const item of lineItems.data) {
          if (item.price?.product && typeof item.price.product === 'object') {
            const stripeProductId = item.price.product.id
            const dbProductType = STRIPE_PRODUCT_TO_DB_TYPE[stripeProductId]
            
            console.log('🔍 Processing product:', {
              stripeProductId,
              dbProductType,
              userId,
              userEmail
            })

            if (!dbProductType) {
              console.error('❌ Unknown Stripe product ID:', stripeProductId)
              continue
            }

            // Grant access to the product
            const { data, error } = await supabase
              .from('user_products')
              .upsert({
                user_id: userId,
                product_type: dbProductType,
                is_active: true,
                purchased_at: new Date().toISOString(),
                stripe_session_id: session.id,
                stripe_customer_id: session.customer,
                amount_paid: session.amount_total,
                currency: session.currency
              }, {
                onConflict: 'user_id,product_type'
              })

            if (error) {
              console.error('❌ Failed to grant product access:', error)
              return new Response(`Failed to grant access: ${error.message}`, { 
                status: 500,
                headers: corsHeaders 
              })
            }

            console.log('✅ Product access granted:', {
              userId,
              productType: dbProductType,
              sessionId: session.id
            })
          }
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed for PaymentIntent:', paymentIntent.id)
        // You could log this to your database or send notifications
        break
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellations if you add subscriptions later
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔄 Subscription cancelled:', subscription.id)
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Internal server error processing webhook'
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500,
      }
    )
  }
})
```

5. Click **Deploy**
6. Wait for deployment to complete
7. **Copy the function URL** - you'll need this later (should be something like: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook`)

### Step 4: Get Your Supabase Service Role Key

1. In Supabase Dashboard, click **Settings** → **API**
2. Find **service_role** key (NOT anon key)
3. Click **Reveal** and copy the key
4. **Save this key** - you'll need it in Step 7

### Step 5: Create Live Products in Stripe

1. Go to https://dashboard.stripe.com
2. **IMPORTANT**: Switch to **LIVE** mode (toggle in top left)
3. Click **Products** → **Add product**
4. Create these 6 products exactly:

**Product 1:**
- Name: `Year 5 NAPLAN`
- Price: `199` AUD
- Billing: One-time
- Copy the **Product ID** (starts with `prod_`)
- Copy the **Price ID** (starts with `price_`)

**Product 2:**
- Name: `Year 7 NAPLAN`  
- Price: `199` AUD
- Billing: One-time
- Copy the **Product ID** and **Price ID**

**Product 3:**
- Name: `EduTest Scholarship (Year 7 Entry)`
- Price: `199` AUD
- Billing: One-time
- Copy the **Product ID** and **Price ID**

**Product 4:**
- Name: `ACER Scholarship (Year 7 Entry)`
- Price: `199` AUD
- Billing: One-time
- Copy the **Product ID** and **Price ID**

**Product 5:**
- Name: `NSW Selective Entry (Year 7 Entry)`
- Price: `199` AUD
- Billing: One-time
- Copy the **Product ID** and **Price ID**

**Product 6:**
- Name: `VIC Selective Entry (Year 9 Entry)`
- Price: `199` AUD
- Billing: One-time
- Copy the **Product ID** and **Price ID**

### Step 6: Get Live Stripe API Keys

1. Still in Stripe Dashboard (LIVE mode), go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_live_`)
3. Copy your **Secret key** (starts with `sk_live_`)

### Step 7: Add Supabase Environment Variables

1. Go back to Supabase Dashboard → **Settings** → **Environment variables**
2. Add these variables:

```
STRIPE_SECRET_KEY = sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY
SUPABASE_URL = https://mcxxiunseawojmojikvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY = YOUR_SERVICE_ROLE_KEY_FROM_STEP_4
```

**DO NOT add STRIPE_WEBHOOK_SECRET yet - we'll get that in Step 9**

### Step 8: Update Webhook Product Mapping

1. Go back to **Edge Functions** → **stripe-webhook**
2. Find this section at the top:

```typescript
const STRIPE_PRODUCT_TO_DB_TYPE: Record<string, string> = {
  'prod_ShnPdOiDYbl6r0': 'Year 5 NAPLAN',
  'prod_ShnRiUgfv0qnuc': 'Year 7 NAPLAN', 
  'prod_ShnVu21eaNIeqa': 'EduTest Scholarship (Year 7 Entry)',
  'prod_ShnYQIQbQp0qzx': 'ACER Scholarship (Year 7 Entry)',
  'prod_ShnNTdv0tv1ikx': 'NSW Selective Entry (Year 7 Entry)',
  'prod_ShnKBAkGwieDH0': 'VIC Selective Entry (Year 9 Entry)'
};
```

3. Replace with your LIVE product IDs from Step 5:

```typescript
const STRIPE_PRODUCT_TO_DB_TYPE: Record<string, string> = {
  'YOUR_LIVE_YEAR5_PRODUCT_ID': 'Year 5 NAPLAN',
  'YOUR_LIVE_YEAR7_PRODUCT_ID': 'Year 7 NAPLAN', 
  'YOUR_LIVE_EDUTEST_PRODUCT_ID': 'EduTest Scholarship (Year 7 Entry)',
  'YOUR_LIVE_ACER_PRODUCT_ID': 'ACER Scholarship (Year 7 Entry)',
  'YOUR_LIVE_NSW_PRODUCT_ID': 'NSW Selective Entry (Year 7 Entry)',
  'YOUR_LIVE_VIC_PRODUCT_ID': 'VIC Selective Entry (Year 9 Entry)'
};
```

4. Click **Deploy** again

### Step 9: Set Up Stripe Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook`
4. **Events to send**: Click **Select events** and choose:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Click on your newly created webhook
7. **Copy the Signing secret** (starts with `whsec_`)
8. Go back to Supabase → **Settings** → **Environment variables**
9. Add: `STRIPE_WEBHOOK_SECRET = whsec_YOUR_WEBHOOK_SECRET`

### Step 10: Update Vercel Production Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:

```
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_YOUR_LIVE_PUBLISHABLE_KEY

VITE_STRIPE_YEAR5_NAPLAN_PRODUCT_ID = YOUR_LIVE_YEAR5_PRODUCT_ID
VITE_STRIPE_YEAR7_NAPLAN_PRODUCT_ID = YOUR_LIVE_YEAR7_PRODUCT_ID
VITE_STRIPE_EDUTEST_PRODUCT_ID = YOUR_LIVE_EDUTEST_PRODUCT_ID
VITE_STRIPE_ACER_PRODUCT_ID = YOUR_LIVE_ACER_PRODUCT_ID
VITE_STRIPE_NSW_SELECTIVE_PRODUCT_ID = YOUR_LIVE_NSW_PRODUCT_ID
VITE_STRIPE_VIC_SELECTIVE_PRODUCT_ID = YOUR_LIVE_VIC_PRODUCT_ID

VITE_STRIPE_YEAR5_NAPLAN_PRICE_ID = YOUR_LIVE_YEAR5_PRICE_ID
VITE_STRIPE_YEAR7_NAPLAN_PRICE_ID = YOUR_LIVE_YEAR7_PRICE_ID
VITE_STRIPE_EDUTEST_PRICE_ID = YOUR_LIVE_EDUTEST_PRICE_ID
VITE_STRIPE_ACER_PRICE_ID = YOUR_LIVE_ACER_PRICE_ID
VITE_STRIPE_NSW_SELECTIVE_PRICE_ID = YOUR_LIVE_NSW_PRICE_ID
VITE_STRIPE_VIC_SELECTIVE_PRICE_ID = YOUR_LIVE_VIC_PRICE_ID
```

5. **Important**: Set each variable to **Production** environment

### Step 11: Deploy to Vercel

1. Commit and push your latest changes to GitHub:
```bash
git add .
git commit -m "Add Stripe live mode webhook and database table"
git push
```

2. Vercel will automatically deploy your changes

### Step 12: Test the Complete Flow

1. Go to your live site (educourseportal.vercel.app)
2. Create a new test account
3. Try to access a product (should show paywall)
4. Click "Purchase Access" 
5. Complete payment with a real card (use small amount first like $1 to test)
6. Verify you get redirected back
7. Check if you now have access to the product

### Step 13: Monitor and Verify

1. **Check Stripe Dashboard**: Look at payments and customers
2. **Check Supabase Logs**: Go to **Edge Functions** → **stripe-webhook** → **Logs**
3. **Check Database**: Go to **Table Editor** → **user_products** to see if records are created
4. **Check Webhook Delivery**: In Stripe → **Developers** → **Webhooks** → click your webhook → see delivery attempts

## ✅ Success Checklist

- [ ] Database table updated successfully
- [ ] Webhook function deployed
- [ ] Live products created in Stripe (6 products)
- [ ] Live API keys obtained
- [ ] Supabase environment variables added
- [ ] Webhook product mapping updated
- [ ] Stripe webhook configured and pointing to Supabase
- [ ] Vercel environment variables updated
- [ ] Code deployed to production
- [ ] End-to-end test completed successfully
- [ ] Webhook delivery confirmed in Stripe
- [ ] User product access granted in database

## 🚨 Troubleshooting

**If payment doesn't grant access:**
1. Check Stripe webhook delivery status
2. Check Supabase Edge Function logs
3. Verify product ID mapping is correct
4. Check user_products table for new records

**If webhook fails:**
1. Verify STRIPE_WEBHOOK_SECRET is correct
2. Check SUPABASE_SERVICE_ROLE_KEY is set
3. Look at Edge Function logs for errors

**If product IDs don't match:**
1. Double-check the product mapping in webhook function
2. Ensure you're using LIVE product IDs, not test IDs

## 🎉 You're Live!

Once all steps are complete, your platform will be accepting real payments and automatically granting product access!