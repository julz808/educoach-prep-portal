# Stripe Configuration Diagnostic

## Quick Check in Browser Console

Run this in your browser console on the production site to see what's configured:

```javascript
// Check all Stripe-related environment variables
console.log('Stripe Configuration:', {
  publishableKey: {
    exists: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    prefix: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 8),
    mode: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ? 'LIVE' : 'TEST'
  },
  priceIds: {
    edutest: import.meta.env.VITE_STRIPE_EDUTEST_PRICE_ID,
    year5Naplan: import.meta.env.VITE_STRIPE_YEAR5_NAPLAN_PRICE_ID,
    year7Naplan: import.meta.env.VITE_STRIPE_YEAR7_NAPLAN_PRICE_ID,
    acer: import.meta.env.VITE_STRIPE_ACER_PRICE_ID,
    nswSelective: import.meta.env.VITE_STRIPE_NSW_SELECTIVE_PRICE_ID,
    vicSelective: import.meta.env.VITE_STRIPE_VIC_SELECTIVE_PRICE_ID
  }
});
```

## Vercel Environment Variables to Check

Make sure ALL of these are set in Vercel with LIVE values:

### Required Stripe Keys:
- `VITE_STRIPE_PUBLISHABLE_KEY` - Must start with `pk_live_`

### Required Price IDs (ALL must be LIVE price IDs):
- `VITE_STRIPE_YEAR5_NAPLAN_PRICE_ID`
- `VITE_STRIPE_YEAR7_NAPLAN_PRICE_ID`
- `VITE_STRIPE_EDUTEST_PRICE_ID`
- `VITE_STRIPE_ACER_PRICE_ID`
- `VITE_STRIPE_NSW_SELECTIVE_PRICE_ID`
- `VITE_STRIPE_VIC_SELECTIVE_PRICE_ID`

### Also Check Supabase Edge Function Secrets:
- `STRIPE_SECRET_KEY` - Must start with `sk_live_` and be from the SAME Stripe account

## Common Issues:

### Issue 1: Price ID Mismatch
The price ID in the logs (`price_1RmR7yAn8i9Vb1DnK6ok8bIq`) suggests you have a different price ID in Vercel than locally.

**Fix**: Update Vercel environment variables with the correct LIVE price IDs from your Stripe dashboard.

### Issue 2: Mixed Test/Live Keys
Using live secret key with test price IDs or vice versa.

**Fix**: Ensure ALL values are from LIVE mode:
- Secret key: `sk_live_...`
- Publishable key: `pk_live_...`
- Price IDs: Created in LIVE mode

### Issue 3: Keys from Different Stripe Accounts
The publishable key and secret key are from different Stripe accounts.

**Fix**: 
1. Go to Stripe Dashboard (LIVE mode)
2. Copy both keys from the SAME account
3. Update both Vercel and Supabase with matching keys

## How to Get Correct LIVE Values:

1. **Go to Stripe Dashboard** → Switch to **LIVE mode** (top right toggle)
2. **Get your keys**: Developers → API Keys
   - Copy Publishable key (pk_live_...)
   - Copy Secret key (sk_live_...)
3. **Get price IDs**: Products → Click each product → Copy the LIVE price ID
4. **Update Vercel**: Settings → Environment Variables → Update all values
5. **Update Supabase**: Edge Functions → Secrets → Update STRIPE_SECRET_KEY

## Verification Steps:

1. All keys start with `live_` not `test_`
2. Price IDs are from LIVE products, not test products
3. Both keys are from the same Stripe account
4. All 6 product price IDs are set in Vercel

Once everything matches, redeploy and the checkout should work!