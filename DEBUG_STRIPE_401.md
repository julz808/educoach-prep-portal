# Stripe 401 Error Debugging Guide

## Quick Diagnosis Steps

### 1. **Deploy Updated Edge Function**
The edge function has been updated with extensive debugging. Deploy it:

1. Go to Supabase Dashboard → Edge Functions → create-checkout-session
2. Copy the updated code from `supabase/functions/create-checkout-session/index.ts`
3. Click Deploy

### 2. **Test and Check Logs**

1. **Test the checkout flow** in your app
2. **Check Edge Function Logs**:
   - Go to Supabase Dashboard → Edge Functions → create-checkout-session → Logs
   - Look for the debug messages starting with 🔍

### 3. **Debug Output Analysis**

The updated code will log these key points:

#### **Environment Debug** (First debug log):
```javascript
🔍 Environment Debug: {
  hasStripeKey: true/false,           // Should be TRUE
  stripeKeyPrefix: "sk_live_" or "sk_test_",  // Should match your intended mode
  hasSupabaseUrl: true/false,         // Should be TRUE
  hasSupabaseAnonKey: true/false,     // Should be TRUE
  authHeader: "Bearer eyJ..."         // Should have JWT token
}
```

#### **Auth Debug** (Second debug log):
```javascript
🔍 Auth Debug: {
  hasUser: true/false,               // Should be TRUE
  userId: "uuid-string",             // Should have valid UUID
  userEmail: "user@example.com",     // Should have user email
  authError: null or "error message" // Should be NULL
}
```

#### **Stripe Session Debug** (Third debug log):
```javascript
🔍 Creating Stripe session with: {
  priceId: "price_xxx",              // Should have valid price ID
  productId: "year-5-naplan",        // Should have product ID
  userId: "uuid",                    // Should match authenticated user
  userEmail: "us..."                 // Should be truncated email
}
```

## **Common Issues and Fixes**

### **Issue 1: `hasStripeKey: false`**
**Fix**: Add STRIPE_SECRET_KEY to Supabase environment variables
1. Go to Supabase → Settings → Environment variables
2. Add: `STRIPE_SECRET_KEY = sk_live_YOUR_KEY`

### **Issue 2: `stripeKeyPrefix: "sk_test_"` but using live mode**
**Fix**: Update to live key:
1. Go to Stripe Dashboard (LIVE mode) → Developers → API keys
2. Copy Secret key (starts with sk_live_)
3. Update STRIPE_SECRET_KEY in Supabase

### **Issue 3: `authHeader: undefined`**
**Fix**: User session issue
1. User needs to log out and log back in
2. Check if JWT token is expired
3. Verify frontend Supabase client configuration

### **Issue 4: `hasUser: false`**
**Fix**: Authentication failure
1. Check authError message for details
2. Verify SUPABASE_ANON_KEY is correct
3. Ensure user is properly authenticated

### **Issue 5: Stripe Authentication Error**
**Fix**: Price ID or API key issue
1. Verify price IDs exist in Stripe dashboard
2. Ensure price IDs match the mode (test vs live)
3. Check Stripe key permissions

## **Frontend Debug Logs**

The frontend will also log:

#### **Invocation Debug**:
```javascript
🔍 Invoking create-checkout-session with: {
  priceId: "price_xxx",
  productId: "year-5-naplan",
  userId: "uuid",
  userEmail: "us...",
  hasUser: true,
  userSessionValid: true
}
```

#### **Response Debug**:
```javascript
🔍 Edge function response: {
  data: {...} or null,
  error: {...} or null,
  hasData: true/false,
  hasError: true/false,
  errorDetails: {...}
}
```

## **Quick Test Commands**

### Test Environment Variables (in browser console):
```javascript
// Check if Stripe is configured
console.log('Frontend Stripe Config:', {
  hasPublishableKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  keyPrefix: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 8),
  isLiveMode: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_')
});

// Check user session
const { data } = await supabase.auth.getUser();
console.log('User Session:', {
  hasUser: !!data.user,
  userId: data.user?.id,
  userEmail: data.user?.email
});
```

## **Expected Working Flow**

1. ✅ Environment Debug: All values should be `true`
2. ✅ Auth Debug: `hasUser: true`, no `authError`
3. ✅ Stripe Session Debug: Valid price ID and user data
4. ✅ Frontend Response: `hasData: true`, `hasError: false`
5. ✅ Successful redirect to Stripe Checkout

## **Next Steps After Testing**

1. **If environment debug fails**: Fix Supabase environment variables
2. **If auth debug fails**: Fix user authentication
3. **If Stripe session fails**: Check Stripe configuration and price IDs
4. **If frontend response has error**: Check the specific error message

**Remember**: After fixing any environment variables in Supabase, you may need to redeploy the edge function.