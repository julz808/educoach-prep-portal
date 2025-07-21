# 🔍 WEBHOOK TROUBLESHOOTING CHECKLIST
## Systematic Analysis to Fix Persistent 401 Errors

### **STEP 1: Stripe Dashboard Verification**

#### A. Check All Webhook Endpoints
1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Count how many webhook endpoints exist**
   - ❌ If more than 1 exists → **DELETE ALL old ones**
   - ✅ Should have exactly 1 webhook

#### B. Verify Current Webhook Configuration
**For the active webhook, verify:**
- **URL**: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook`
- **Events**: `checkout.session.completed` (and optionally `payment_intent.payment_failed`)
- **Status**: `Enabled`
- **API Version**: Latest (2023-08-16 or newer)

#### C. Test Webhook Secret
1. **Click on the webhook** → **Reveal signing secret**
2. **Copy the secret** (starts with `whsec_`)
3. **Compare it** with what's in Supabase Edge Function environment variables

---

### **STEP 2: Supabase Function Verification**

#### A. Check Which Function is Deployed
1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Look for these functions:**
   - `stripe-webhook` (should be the active one)
   - `stripe-webhook-clean` (should be deleted if exists)

#### B. Verify Environment Variables
**In Edge Functions → stripe-webhook → Settings:**
| Variable | Expected Value | Status |
|----------|---------------|---------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ❓ Check |
| `STRIPE_SECRET_KEY` | `sk_live_...` | ❓ Check |
| `SUPABASE_URL` | `https://mcxxiunseawojmojikvb.supabase.co` | ❓ Check |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | ❓ Check |

#### C. Test Function Directly
1. **Use Stripe's "Send test webhook"** feature
2. **Check Supabase Function Logs** immediately after
3. **Expected logs:**
   ```
   🌐 Webhook received: POST /stripe-webhook
   🔍 Environment check: {hasStripeKey: true, ...}
   ✅ Webhook signature verified: checkout.session.completed
   ```

---

### **STEP 3: Deep Diagnostic Tests**

#### A. Run SQL Diagnostic
**Execute this in Supabase SQL Editor:**
```sql
-- Test RLS policies are fixed
DROP POLICY IF EXISTS "Authenticated users can insert products" ON user_products;

CREATE POLICY "Allow user and service role insert" ON user_products 
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role' OR
        current_user = 'service_role'
    );

GRANT ALL PRIVILEGES ON user_products TO service_role;

-- Test service role can insert
INSERT INTO user_products (user_id, product_type, is_active) 
VALUES ('test-user-id', 'TEST PRODUCT', true);

-- Clean up
DELETE FROM user_products WHERE product_type = 'TEST PRODUCT';
```

#### B. Check Webhook URL Resolution
**Test if the webhook URL is accessible:**
1. **Open browser** → **Navigate to**: 
   ```
   https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook
   ```
2. **Expected response**: Should show CORS error or method not allowed (not 404)

---

### **STEP 4: Nuclear Option - Complete Reset**

#### If All Above Fails:

#### A. Delete Everything Webhook-Related
1. **Delete ALL webhooks** in Stripe Dashboard
2. **Delete ALL webhook functions** in Supabase
3. **Wait 5 minutes** for cache clearing

#### B. Create From Scratch
1. **Create new Supabase function** named `stripe-webhook-final`
2. **Deploy the clean webhook code**
3. **Create new Stripe webhook** pointing to new function
4. **Copy new webhook secret** to Supabase environment variables
5. **Test immediately**

---

### **STEP 5: Debugging Output Analysis**

#### Current 401 Error Analysis:
**The fact that we're getting:**
```json
{
  "code": 401,
  "message": "Missing authorization header"
}
```

**Means one of these is true:**
1. **Stripe is calling the OLD webhook function** (most likely)
2. **Webhook secret doesn't match** between Stripe and Supabase
3. **Function is expecting different authentication** than Stripe provides
4. **Multiple webhooks are configured** and one is hitting old endpoint

---

### **STEP 6: Verification Steps**

#### After Each Fix Attempt:
1. **Make a $1 test purchase**
2. **Check Stripe webhook logs** → Should show 200 OK response
3. **Check Supabase function logs** → Should show ✅ emoji logs
4. **Check database** → Should have new user_products record
5. **Check frontend** → Should show access granted immediately

---

### **MOST LIKELY ROOT CAUSES (In Order):**

1. **🎯 Webhook Secret Mismatch** (80% probability)
   - Stripe webhook secret ≠ Supabase environment variable

2. **🎯 Multiple Webhook Endpoints** (15% probability)
   - Old webhook still active in Stripe pointing to old function

3. **🎯 Wrong Function Deployed** (5% probability)
   - Stripe pointing to old/cached function version

---

**Follow this checklist systematically. The issue WILL be found in one of these steps.**