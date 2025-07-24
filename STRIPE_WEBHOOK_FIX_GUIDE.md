# 🚨 STRIPE WEBHOOK CONFIGURATION FIX

## Problem Identified
**Stripe webhook is not being called at all** - this is why user_products records are not being created after successful payments.

## Root Cause
The webhook endpoint is not properly configured in your Stripe Dashboard, or Stripe cannot reach it.

## Step-by-Step Fix

### 1. 🔍 Check Current Webhook Configuration
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Look for a webhook with URL: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`
3. Check if it exists and is enabled

### 2. ✅ Correct Webhook Configuration
The webhook should be configured as:

**URL:** `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`

**Events to send:**
- `checkout.session.completed` ✅ (CRITICAL)

**Status:** `Enabled` ✅

**HTTP Method:** `POST` ✅

### 3. 🔧 If Webhook Doesn't Exist - Create It
1. Click "Add endpoint"
2. Set URL: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`
3. Select events: `checkout.session.completed`
4. Click "Add endpoint"
5. **IMPORTANT:** Copy the webhook signing secret (starts with `whsec_`)

### 4. 🔧 If Webhook Exists But Wrong URL - Update It
1. Click on the existing webhook
2. Click "Update details"
3. Change URL to: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`
4. Ensure `checkout.session.completed` is selected
5. Save changes

### 5. 🔐 Update Environment Variables
Make sure these are set in Supabase Edge Functions:

```bash
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_... (your live secret key)
SUPABASE_URL=https://mcxxiunseawojmojikvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. 🧪 Test the Fix
1. Make a test purchase
2. Check Supabase Edge Function logs: [Dashboard > Edge Functions > stripe-webhook-nuclear > Invocations]
3. You should see log entries showing the webhook was called
4. Check the `user_products` table - a new record should be created

### 7. 🔍 Debugging If Still Not Working

**Check Webhook Delivery in Stripe:**
1. Go to Stripe Dashboard > Webhooks
2. Click on your webhook endpoint
3. Check "Events" tab for recent delivery attempts
4. If no attempts, the webhook URL is wrong
5. If attempts failed, check the error messages

**Common Issues:**
- ❌ Wrong URL (missing `/functions/v1/`)
- ❌ Events not selected (`checkout.session.completed`)
- ❌ Webhook disabled
- ❌ Wrong signing secret in environment variables
- ❌ Supabase function not deployed properly

### 8. 🚀 Expected Behavior After Fix
1. User completes payment in Stripe Checkout
2. Stripe sends `checkout.session.completed` event to webhook
3. Webhook creates record in `user_products` table
4. User immediately has access (no manual intervention needed)
5. Access control shows `hasAccess: true`

## Quick Verification Commands

**Test webhook endpoint connectivity:**
```bash
curl -X POST https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"test": true}'
```

**Expected response:** Some error (401/400) but endpoint is reachable

**Check recent Stripe events:**
Go to Stripe Dashboard > Events and look for recent `checkout.session.completed` events

## 🎯 Success Criteria
- ✅ Webhook appears in Supabase Edge Function invocations after payment
- ✅ New record created in `user_products` table
- ✅ User has immediate access without manual intervention
- ✅ No more 406 errors in frontend console
- ✅ `hasAccess` returns `true` after purchase