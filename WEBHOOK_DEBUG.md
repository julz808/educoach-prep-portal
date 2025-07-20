# Webhook Debugging - 401 Authorization Issue

## Problem
The Stripe webhook is returning 401 "Missing authorization header" which means the Supabase edge function is expecting an authorization header that Stripe webhooks don't provide.

## Root Cause
The webhook endpoint URL might be wrong, or the Supabase edge function hasn't been updated with the authorization fix.

## Current Payment Data
- **User ID**: 2c2e5c44-d953-48bc-89d7-52b8333edbda
- **Product**: acer-year-7 (ACER Scholarship Year 7 Entry)
- **Session**: cs_live_b1gdV0meVOakoI2ruw4QHmF5Focg2z5xhChPtwvJyBsEohosPK4JQ0XU6B
- **Amount**: $0 (with discount)

## Immediate Fix SQL
```sql
INSERT INTO user_products (
  user_id,
  product_type,
  is_active,
  purchased_at,
  stripe_session_id,
  amount_paid,
  currency
) VALUES (
  '2c2e5c44-d953-48bc-89d7-52b8333edbda',
  'ACER Scholarship (Year 7 Entry)',
  true,
  NOW(),
  'cs_live_b1gdV0meVOakoI2ruw4QHmF5Focg2z5xhChPtwvJyBsEohosPK4JQ0XU6B',
  0,
  'aud'
);
```

## Steps to Fix Webhook

1. **Check Stripe Webhook URL**
   - Go to Stripe Dashboard → Webhooks
   - Verify the endpoint URL is correct
   - Should be: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook`

2. **Deploy Updated Edge Function**
   - Copy the updated webhook code to Supabase
   - Make sure it uses service role key properly
   - Deploy the function

3. **Test Webhook**
   - Use Stripe's "Send test webhook" feature
   - Check Supabase edge function logs

## Long-term Solution
The webhook needs to be fixed to handle Stripe's webhook format without requiring additional authorization headers.