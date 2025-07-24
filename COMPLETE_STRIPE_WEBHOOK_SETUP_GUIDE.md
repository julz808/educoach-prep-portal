# 🚀 COMPLETE STRIPE WEBHOOK SETUP GUIDE
## Official Supabase + Stripe Integration - Step by Step

---

## 📋 PREREQUISITES

Before starting, ensure you have:
- ✅ Supabase CLI installed and authenticated
- ✅ Stripe account with live API keys
- ✅ Docker Desktop installed and running
- ✅ Access to your Stripe Dashboard
- ✅ Access to your Supabase Dashboard

---

## 🔧 STEP 1: PREPARE YOUR ENVIRONMENT

### 1.1 Install Required Tools
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Install Stripe CLI (for testing)
# MacOS:
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 1.2 Verify Docker is Running
```bash
# Check Docker status
docker --version
docker ps

# If Docker is not running, start Docker Desktop
```

### 1.3 Login to Supabase CLI
```bash
# Login to Supabase (if not already logged in)
supabase login

# Link to your project
supabase link --project-ref mcxxiunseawojmojikvb
```

---

## 📝 STEP 2: CREATE ENVIRONMENT CONFIGURATION

### 2.1 Create Environment File
```bash
# Navigate to your project
cd /Users/julz88/Documents/educoach-prep-portal-2

# Create environment file for local testing
cp supabase/.env.local.example supabase/.env.local
```

### 2.2 Edit Environment File
Edit `supabase/.env.local` with these values:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_YOUR_WEBHOOK_SECRET_FROM_STRIPE_DASHBOARD

# Supabase Configuration  
SUPABASE_URL=https://mcxxiunseawojmojikvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI
```

**🚨 IMPORTANT:** You need to get the `STRIPE_WEBHOOK_SIGNING_SECRET` from Step 3 below.

---

## 🔗 STEP 3: CONFIGURE STRIPE WEBHOOK ENDPOINT

### 3.1 Access Stripe Dashboard
1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Login with your Stripe account credentials

### 3.2 Create or Update Webhook Endpoint
**Option A: If no webhook exists, create new:**
1. Click **"Add endpoint"** button
2. Set **Endpoint URL:** `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`
3. Click **"Select events"**
4. Search for and select: **`checkout.session.completed`**
5. Click **"Add endpoint"**

**Option B: If webhook exists, update it:**
1. Click on the existing webhook endpoint
2. Click **"Update details"** or **"Edit"**
3. Update **Endpoint URL** to: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`
4. Ensure **`checkout.session.completed`** is selected in events
5. Save changes

### 3.3 Get Webhook Signing Secret
1. After creating/updating the webhook, click on it
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the secret (starts with `whsec_`)
4. Update your `supabase/.env.local` file with this secret:
   ```bash
   STRIPE_WEBHOOK_SIGNING_SECRET=whsec_your_actual_secret_here
   ```

### 3.4 Verify Webhook Configuration
Ensure your webhook shows:
- ✅ **Status:** Enabled
- ✅ **URL:** `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`
- ✅ **Events:** `checkout.session.completed`
- ✅ **Signing secret:** Revealed and copied

---

## 💻 STEP 4: DEPLOY THE WEBHOOK FUNCTION

### 4.1 Verify Function Code
The corrected function is already in: `supabase/functions/stripe-webhook-nuclear/index.ts`

Key features of the corrected implementation:
- ✅ Uses `Deno.serve()` (official pattern)
- ✅ Uses `constructEventAsync()` for signature verification
- ✅ Uses Stripe API version `2024-11-20`
- ✅ Proper error handling and logging
- ✅ Official Supabase client initialization

### 4.2 Deploy the Function
```bash
# Navigate to project directory
cd /Users/julz88/Documents/educoach-prep-portal-2

# Deploy with the critical --no-verify-jwt flag
supabase functions deploy stripe-webhook-nuclear --no-verify-jwt
```

**Expected Output:**
```
Bundling Function: stripe-webhook-nuclear
Deploying Function: stripe-webhook-nuclear
✅ Function deployed successfully
Function URL: https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear
```

### 4.3 Set Production Environment Variables
```bash
# Set all required environment variables in production
supabase secrets set STRIPE_SECRET_KEY="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"

supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET="whsec_your_actual_secret_from_step_3"

supabase secrets set SUPABASE_URL="https://mcxxiunseawojmojikvb.supabase.co"

supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE0MTA4NSwiZXhwIjoyMDYzNzE3MDg1fQ.eRPuBSss8QCkAkbiuXVSruM04LHkdxjOn3rhf9CKAJI"
```

**Expected Output for each command:**
```
✅ Finished supabase secrets set.
```

---

## 🧪 STEP 5: VERIFY DEPLOYMENT

### 5.1 Check Function in Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mcxxiunseawojmojikvb)
2. Navigate to **Edge Functions**
3. You should see **stripe-webhook-nuclear** listed
4. Click on it to see details
5. Check the **Invocations** tab (should be empty initially)

### 5.2 Test Function Accessibility
```bash
# Test that the function is reachable
curl -X POST https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"test": true}'
```

**Expected Response:** Should get an error about signature verification (this is good - means function is running)

---

## 🔧 STEP 6: LOCAL TESTING (OPTIONAL BUT RECOMMENDED)

### 6.1 Start Local Development
```bash
# Start Supabase functions locally
supabase functions serve --no-verify-jwt --env-file ./supabase/.env.local
```

**Expected Output:**
```
✅ Functions server started on http://localhost:54321
```

### 6.2 Set Up Stripe CLI Forwarding (New Terminal)
```bash
# Login to Stripe CLI
stripe login

# Forward webhooks to local function
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook-nuclear
```

**Expected Output:**
```
✅ Ready! Your webhook signing secret is whsec_... (use this in your .env)
✅ Forwarding events to localhost:54321/functions/v1/stripe-webhook-nuclear
```

### 6.3 Trigger Test Event (New Terminal)
```bash
# Trigger a test checkout completion event
stripe trigger checkout.session.completed
```

**Expected Output:**
```
✅ Setting up fixture for: checkout.session.completed
✅ Triggering event checkout.session.completed
```

### 6.4 Check Local Logs
In your functions terminal, you should see:
```
🚀 OFFICIAL STRIPE WEBHOOK ACTIVE: POST http://localhost:54321/functions/v1/stripe-webhook-nuclear
🎯 OFFICIAL signature verified: checkout.session.completed evt_...
🎯 Database access CONFIRMED
🎉 PROCESSING CHECKOUT: cs_test_...
🎯 WEBHOOK SUCCESS
```

---

## 🚀 STEP 7: PRODUCTION TESTING

### 7.1 Make a Real Test Purchase
1. Go to your live application
2. Select a product (e.g., ACER Scholarship)
3. Click "Purchase Now"
4. Complete the Stripe checkout with a test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

### 7.2 Monitor Webhook Execution
1. Go to **Supabase Dashboard > Edge Functions > stripe-webhook-nuclear > Invocations**
2. You should see a new invocation appear within seconds
3. Click on the invocation to see logs
4. Look for success messages like:
   ```
   🚀 OFFICIAL STRIPE WEBHOOK ACTIVE
   🎯 OFFICIAL signature verified: checkout.session.completed
   🎯 Database access CONFIRMED
   🎉 PROCESSING CHECKOUT
   🚀 ACCESS GRANTED
   🎯 WEBHOOK SUCCESS
   ```

### 7.3 Verify Database Record
```sql
-- Check if user_products record was created
SELECT * FROM user_products 
WHERE user_id = 'your-user-id' 
  AND product_type = 'ACER Scholarship (Year 7 Entry)'
  AND is_active = true;
```

### 7.4 Test Access Control
1. Refresh your application
2. The user should now have access to the purchased product
3. No paywall should appear
4. Check browser console - should show `hasAccess: true`

---

## 🔍 STEP 8: TROUBLESHOOTING

### 8.1 If Webhook Not Being Called

**Check Stripe Dashboard:**
1. Go to **Stripe Dashboard > Webhooks**
2. Click on your webhook endpoint
3. Check **Events** tab for delivery attempts
4. If no attempts, verify the URL is exactly: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`

**Common Issues:**
- ❌ URL missing `/functions/v1/` prefix
- ❌ Wrong function name in URL
- ❌ Webhook disabled
- ❌ Wrong events selected

### 8.2 If Webhook Called But Fails

**Check Supabase Logs:**
1. Go to **Supabase Dashboard > Edge Functions > stripe-webhook-nuclear > Invocations**
2. Click on failed invocation
3. Look for error messages

**Common Issues:**
- ❌ Wrong `STRIPE_WEBHOOK_SIGNING_SECRET`
- ❌ Missing environment variables
- ❌ Database connection issues
- ❌ RLS policy blocking access

### 8.3 If Database Record Not Created

**Check Environment Variables:**
```bash
# Verify secrets are set
supabase secrets list
```

**Check Database Permissions:**
```sql
-- Test if webhook can access user_products table
SELECT 1 FROM user_products LIMIT 1;
```

**Check RLS Policies:**
```sql
-- Verify RLS policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_products';
```

### 8.4 If User Still Sees Paywall

**Check Access Control Logic:**
1. Open browser dev tools
2. Look for access control debug messages
3. Verify `hasAccess` is `true`
4. Check `user_products` table directly

**Force Refresh:**
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Re-login to the application

---

## ✅ STEP 9: VERIFICATION CHECKLIST

Before considering the setup complete, verify:

**Stripe Configuration:**
- [ ] Webhook endpoint exists in Stripe Dashboard
- [ ] URL is exactly: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-nuclear`
- [ ] Event `checkout.session.completed` is selected
- [ ] Webhook status is "Enabled"
- [ ] Signing secret copied and used in environment variables

**Supabase Configuration:**
- [ ] Function deployed with `--no-verify-jwt` flag
- [ ] All 4 environment variables set correctly
- [ ] Function appears in Supabase Dashboard > Edge Functions
- [ ] Test invocation shows success logs

**Database Configuration:**
- [ ] `user_products` table exists
- [ ] RLS policies allow service role access
- [ ] Test record can be inserted manually

**End-to-End Flow:**
- [ ] Test purchase creates webhook invocation
- [ ] Webhook invocation shows success logs
- [ ] Database record created in `user_products`
- [ ] User has immediate access (no paywall)
- [ ] `hasAccess` returns `true` in frontend

---

## 🎯 SUCCESS CRITERIA

✅ **Webhook Working:** Purchase → Stripe calls webhook → Success logs in Supabase
✅ **Database Working:** Webhook → Creates user_products record → User has access
✅ **Frontend Working:** User completes purchase → Immediate access (no manual intervention)
✅ **No 406 Errors:** Access control queries succeed
✅ **Automatic Flow:** Everything works without manual access grants

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Logs First:**
   - Supabase Edge Function invocations
   - Browser console errors
   - Stripe webhook delivery attempts

2. **Common Solutions:**
   - Re-deploy function with `--no-verify-jwt`
   - Verify webhook signing secret matches exactly
   - Check environment variables are set correctly
   - Ensure Stripe webhook URL is exact

3. **Test Components Individually:**
   - Test function accessibility with curl
   - Test Stripe webhook with local forwarding
   - Test database access with service role

This guide follows the **official Supabase + Stripe integration patterns** and should result in a fully working, automatic payment-to-access system.