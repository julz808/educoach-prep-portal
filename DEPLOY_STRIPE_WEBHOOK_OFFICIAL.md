# 🚀 OFFICIAL SUPABASE + STRIPE WEBHOOK DEPLOYMENT

## Based on Official Supabase Documentation

### 1. ✅ Deploy the Function (CRITICAL: --no-verify-jwt flag)
```bash
supabase functions deploy stripe-webhook-nuclear --no-verify-jwt
```

### 2. 🔐 Set Environment Variables (EXACT NAMES)
```bash
supabase secrets set STRIPE_SECRET_KEY="sk_live_YOUR_ACTUAL_STRIPE_SECRET_KEY"
supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET="whsec_YOUR_WEBHOOK_SECRET_FROM_STRIPE_DASHBOARD"
supabase secrets set SUPABASE_URL="https://mcxxiunseawojmojikvb.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZUI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI"
```

### 3. 🔍 Configure Stripe Dashboard Webhook
**URL:** `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`
**Events:** `checkout.session.completed`
**Status:** `Enabled`

### 4. 🧪 Test Locally (Optional)
```bash
# Start local functions
supabase functions serve --no-verify-jwt --env-file ./supabase/.env.local

# Forward Stripe webhooks (in another terminal)
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook-nuclear

# Trigger test event (in another terminal)  
stripe trigger checkout.session.completed
```

### 5. ✅ Verification
After deployment:
1. Check Supabase Dashboard > Edge Functions > stripe-webhook-nuclear > Invocations
2. Make a test purchase
3. Webhook should appear in invocations log
4. New record should appear in `user_products` table
5. User should have immediate access

### Key Differences from Previous Implementation:
- ✅ Uses `Deno.serve()` instead of imported `serve()`
- ✅ Uses `constructEventAsync()` for signature verification  
- ✅ Proper environment variable names (`STRIPE_WEBHOOK_SIGNING_SECRET`)
- ✅ Deployed with `--no-verify-jwt` flag
- ✅ Uses latest Stripe API version (2024-11-20)
- ✅ Follows official Supabase patterns

This implementation follows the **exact official Supabase + Stripe integration pattern** from their documentation.