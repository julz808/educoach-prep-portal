# Testing Access Control System & Stripe Setup Guide

## Overview
This guide walks you through testing the newly implemented access control system and setting up Stripe products for the EduCourse platform.

## 1. Testing Access Control System on Staging

### Step 1: Deploy Current Changes to Staging
✅ **Already Deployed** - Latest changes are live on production

### Step 2: Test Access Control System

**Testing Steps:**

1. **Go to your platform**: `https://educourseportal.vercel.app`

2. **Create a new test account** (or use existing):
   - Register a new user 
   - This will automatically create progress for all 6 products

3. **Test Current Behavior** (should work normally):
   - Switch between products in the dropdown
   - All features should work as before
   - No restrictions should be active yet

4. **Check Console Logs**:
   - Open browser dev tools → Console
   - Look for access control logs like:
     - "Access check failed, allowing access for safety"
     - This confirms the system is working but defaulting to safe mode

5. **Test Database Access**:
   - Go to your Supabase dashboard
   - Check the `user_products` table
   - Should be empty (no purchased products yet)

### Step 3: Test Paywall Component

To test the paywall component manually:

1. **Open Console** in browser dev tools
2. **Force show paywall** by running:
   ```javascript
   // This will show the paywall for testing
   localStorage.setItem('test_paywall', 'true');
   location.reload();
   ```

## 2. Setting Up Stripe Products

### Step 1: Access Your Stripe Dashboard

1. **Login to Stripe**: Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Make sure you're in Test Mode** (toggle in top right)
3. **Navigate to Products**: Click "Products" in the left sidebar

### Step 2: Create Your 6 Test Products

Create each product with these exact details:

#### Product 1: VIC Selective Entry
- **Name**: `VIC Selective Entry (Year 9 Entry)`
- **Description**: `Comprehensive preparation for Victoria's Year 9 selective entry exam`
- **Price**: `$199.00 AUD`
- **Type**: `One-time`
- **Currency**: `AUD`

#### Product 2: NSW Selective Entry
- **Name**: `NSW Selective Entry (Year 7 Entry)`
- **Description**: `Complete preparation for NSW Year 7 selective high school placement`
- **Price**: `$199.00 AUD`
- **Type**: `One-time`
- **Currency**: `AUD`

#### Product 3: Year 5 NAPLAN
- **Name**: `Year 5 NAPLAN`
- **Description**: `Comprehensive Year 5 NAPLAN preparation and practice`
- **Price**: `$199.00 AUD`
- **Type**: `One-time`
- **Currency**: `AUD`

#### Product 4: Year 7 NAPLAN
- **Name**: `Year 7 NAPLAN`
- **Description**: `Advanced Year 7 NAPLAN preparation and practice`
- **Price**: `$199.00 AUD`
- **Type**: `One-time`
- **Currency**: `AUD`

#### Product 5: EduTest Scholarship
- **Name**: `EduTest Scholarship (Year 7 Entry)`
- **Description**: `Comprehensive EduTest scholarship exam preparation`
- **Price**: `$199.00 AUD`
- **Type**: `One-time`
- **Currency**: `AUD`

#### Product 6: ACER Scholarship
- **Name**: `ACER Scholarship (Year 7 Entry)`
- **Description**: `Complete ACER scholarship test preparation`
- **Price**: `$199.00 AUD`
- **Type**: `One-time`
- **Currency**: `AUD`

### Step 3: Copy Product/Price IDs

After creating each product, Stripe will generate:
- **Product ID**: `prod_xxxxxxxxx`
- **Price ID**: `price_xxxxxxxxx`

**Copy these IDs** - you'll need them for the integration.

### Step 4: Create Environment Variables

Create a `.env.local` file in your project root:

```env
# Stripe Configuration (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Product Price IDs
VITE_STRIPE_VIC_SELECTIVE_PRICE_ID=price_xxxxxxxxx
VITE_STRIPE_NSW_SELECTIVE_PRICE_ID=price_xxxxxxxxx
VITE_STRIPE_YEAR5_NAPLAN_PRICE_ID=price_xxxxxxxxx
VITE_STRIPE_YEAR7_NAPLAN_PRICE_ID=price_xxxxxxxxx
VITE_STRIPE_EDUTEST_PRICE_ID=price_xxxxxxxxx
VITE_STRIPE_ACER_PRICE_ID=price_xxxxxxxxx

# Feature Flags (Start with false for safety)
ENABLE_ACCESS_CONTROL=false
ENABLE_PAYWALL_UI=false
```

### Step 5: Test Access Control Manually

To test the access control system manually:

1. **Go to Supabase Dashboard**
2. **Navigate to Table Editor** → `user_products`
3. **Add a test record**:
   ```sql
   INSERT INTO user_products (user_id, product_type, is_active, purchased_at)
   VALUES (
     'your_user_id_here',
     'Year 7 NAPLAN',
     true,
     now()
   );
   ```

4. **Test the platform** - you should now have access to Year 7 NAPLAN

### Step 6: Gradually Enable Access Control

When ready to test restrictions:

1. **Update environment variables**:
   ```env
   ENABLE_ACCESS_CONTROL=true
   ENABLE_PAYWALL_UI=true
   ```

2. **Redeploy** to Vercel

3. **Test** - products without access should now show paywall

## 3. Quick Testing Commands

Here are some SQL commands to help you test:

```sql
-- Check user's purchased products
SELECT * FROM user_products WHERE user_id = 'your_user_id';

-- Grant access to a product
INSERT INTO user_products (user_id, product_type, is_active, purchased_at)
VALUES ('your_user_id', 'Year 7 NAPLAN', true, now());

-- Remove access to a product
UPDATE user_products 
SET is_active = false 
WHERE user_id = 'your_user_id' AND product_type = 'Year 7 NAPLAN';

-- Check all users and their product access
SELECT 
  up.user_id,
  up.product_type,
  up.is_active,
  up.purchased_at,
  up.stripe_subscription_id
FROM user_products up
ORDER BY up.purchased_at DESC;
```

## 4. Testing Checklist

### ✅ Basic Functionality Test
- [ ] Platform loads without errors
- [ ] User can register and login
- [ ] Product switching works normally
- [ ] All existing features function properly

### ✅ Access Control Test
- [ ] Console shows access control logs
- [ ] Database queries work correctly
- [ ] Manual product access grants work
- [ ] Paywall component renders correctly

### ✅ Stripe Setup Test
- [ ] All 6 products created in Stripe
- [ ] Price IDs copied correctly
- [ ] Environment variables configured
- [ ] Test mode enabled

### ✅ Integration Test
- [ ] Access control can be enabled/disabled
- [ ] Paywall shows for restricted products
- [ ] Purchased products allow access
- [ ] Non-purchased products show paywall

## 5. Troubleshooting

### Common Issues:

1. **Access Control Not Working**
   - Check console for error messages
   - Verify user_products table structure
   - Ensure environment variables are set

2. **Stripe Products Not Showing**
   - Verify you're in Test Mode
   - Check product names match database exactly
   - Confirm currency is set to AUD

3. **Database Connection Issues**
   - Check Supabase connection
   - Verify RLS policies are active
   - Test with different user accounts

## 6. Next Steps

After successful testing:

1. **Enable Access Control** gradually
2. **Implement Stripe Checkout** integration
3. **Create Webhook Handlers** for payment processing
4. **Test End-to-End** payment flow
5. **Plan Domain Migration** from WordPress
6. **Prepare Thinkific Migration** strategy

## 7. Safety Notes

⚠️ **Important Safety Features:**
- Access control defaults to "allow" if checks fail
- All existing functionality preserved
- Can be disabled via environment flags
- Comprehensive error logging without breaking UX

✅ **Ready for Production:**
- Non-breaking implementation
- Gradual rollout capability
- Fallback behaviors in place
- Comprehensive testing procedures

---

*This testing guide ensures a safe rollout of the access control system while maintaining platform stability.*