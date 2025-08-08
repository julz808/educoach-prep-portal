# Phase 1 Simplified Approach

## 🚨 **Current Issues & Solutions**

### **Issue 1: Email Verification 404 Error**
**Problem**: After email verification, you're redirected to `educourseportal.vercel.app/dashboard` which shows 404
**Solution**: The DashboardRedirect component already exists and should handle this

### **Issue 2: Product Access Not Working**
**Problem**: After purchase, the product is still behind paywall
**Possible Causes**:
1. Webhook isn't processing correctly
2. User ID mismatch between guest checkout and actual user
3. Product type mapping issue

### **Issue 3: Complex Subdomain Routing**
**Problem**: The subdomain routing is making development/testing complicated
**Solution**: For now, keep everything on one domain until ready for production split

## 🎯 **Immediate Fixes Needed**

### **1. Check Webhook Logs**
Go to your Stripe Dashboard → Developers → Webhooks → Click on your webhook → View attempts
- Look for any failed webhook attempts
- Check the response from your webhook

### **2. Verify Product Mapping**
Check that your Stripe product IDs match what's in the webhook:

```typescript
// In stripe-webhook/index.ts
const STRIPE_PRODUCT_TO_DB_TYPE: Record<string, string> = {
  // Make sure these product IDs match your actual Stripe products
  'prod_Shqo1r4nLXrZ1O': 'Year 5 NAPLAN',
  'prod_ShqppA31VnjzIP': 'Year 7 NAPLAN', 
  // ... etc
};
```

### **3. Check Database for Product Access**
Run this SQL query in Supabase:
```sql
-- Check if user_products records are being created
SELECT 
  up.*,
  p.email
FROM user_products up
JOIN profiles p ON p.id = up.user_id
WHERE p.email = 'YOUR_TEST_EMAIL'
ORDER BY up.created_at DESC;
```

## 🔧 **Simplified Deployment Strategy**

### **Option A: Single Domain (Recommended for Now)**

Keep everything on `educourseportal.vercel.app`:
- `/` - Homepage
- `/auth` - Authentication  
- `/dashboard` - Learning platform
- `/course/*` - Course pages

**Benefits**:
- Simpler to debug
- No cross-domain issues
- Easier user experience

### **Option B: Manual Subdomain Later**

Once everything works on single domain:
1. Deploy learning platform to `learning-educourse.vercel.app`
2. Set up proper redirects
3. Configure cross-domain authentication

## 📝 **Debugging Checklist**

### **Test Purchase Flow**
1. [ ] Go to incognito/private browser window
2. [ ] Purchase a product as guest
3. [ ] Check Stripe Dashboard - payment successful?
4. [ ] Check Stripe Webhook logs - webhook processed?
5. [ ] Check Supabase logs - user created?
6. [ ] Check user_products table - access granted?

### **Check These Tables in Supabase**
```sql
-- 1. Check if user was created
SELECT * FROM auth.users WHERE email = 'test@example.com';

-- 2. Check if profile was created
SELECT * FROM profiles WHERE email = 'test@example.com';

-- 3. Check if product access was granted
SELECT * FROM user_products WHERE user_id IN (
  SELECT id FROM profiles WHERE email = 'test@example.com'
);

-- 4. Check for any pending purchases
SELECT * FROM pending_purchases WHERE email = 'test@example.com';
```

## 🚀 **Quick Fix for Product Access**

If webhook isn't working, manually grant access for testing:

```sql
-- Manual product access grant (replace with actual values)
INSERT INTO user_products (
  user_id,
  product_type,
  is_active,
  purchased_at
) VALUES (
  'USER_UUID_HERE',
  'Year 5 NAPLAN', -- or whatever product
  true,
  NOW()
);
```

## 🎯 **Recommended Next Steps**

1. **Fix immediate issues** on single domain deployment
2. **Get purchase flow working** end-to-end
3. **Test with real users** 
4. **Then consider subdomain split** once everything is stable

## 💡 **Development Testing**

For local testing, just use single port:
```bash
npm run dev  # Everything on localhost:3000
```

Test these flows:
1. Guest purchase → Auto account creation → Product access
2. Existing user login → Purchase → Product access  
3. Email verification → Dashboard access

Once these work locally and on Vercel, then we can implement the subdomain split properly.