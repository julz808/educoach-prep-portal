# EduCourse Purchase Flow Documentation

## Overview

The EduCourse platform supports two distinct purchase flows to accommodate different user scenarios:

- **Flow A**: Guest Checkout → Account Creation → Email Verification → Access Grant
- **Flow B**: Authenticated User Purchase → Immediate Access Grant

Both flows are now fully functional and handle payment processing through Stripe with automatic access provisioning.

---

## Flow A: Guest Checkout (Unauthenticated Users)

### Process Overview
This flow allows users to purchase products without having an account first. They complete the purchase, then create an account and verify their email to gain access.

### Step-by-Step Process

1. **Product Selection & Checkout**
   - User browses products and clicks "Start Preparation" button
   - If user is not authenticated, they proceed to Stripe checkout as guest
   - User completes payment in Stripe checkout session

2. **Webhook Processing**
   - Stripe sends webhook to `/supabase/functions/stripe-webhook-v2/index.ts`
   - Webhook creates record in `pending_purchases` table with:
     - `customer_email`: Email from Stripe checkout
     - `product_type`: Product purchased
     - `stripe_session_id`: Unique session identifier
     - `amount_paid`: Payment amount
     - `is_processed`: false (pending)
     - `expires_at`: 24 hours from creation

3. **Account Creation**
   - User navigates to sign-up page
   - User creates account with same email used in checkout
   - Supabase sends email verification link

4. **Email Verification & Access Grant**
   - User clicks verification link in email
   - Browser redirects to `/auth/callback` (handled by `AuthCallback.tsx`)
   - AuthCallback component:
     - Completes email verification
     - Calls `get_user_pending_purchases()` RPC function
     - Finds pending purchase matching user's email
     - Calls `process_pending_purchase()` RPC function
     - Creates record in `user_products` table
     - Marks pending purchase as processed
     - Shows success toast notification

### Key Components

- **Frontend**: `src/pages/AuthCallback.tsx`
- **Backend**: `supabase/functions/stripe-webhook-v2/index.ts`
- **Database**: `pending_purchases` and `user_products` tables
- **RPC Functions**: `get_user_pending_purchases()`, `process_pending_purchase()`

---

## Flow B: Authenticated User Purchase

### Process Overview
This flow is for users who already have accounts and are logged in. They get immediate access after payment completion.

### Step-by-Step Process

1. **Product Selection & Checkout**
   - Authenticated user browses products and clicks "Start Preparation"
   - User proceeds to Stripe checkout with their account email

2. **Webhook Processing & Immediate Access**
   - Stripe sends webhook to `/supabase/functions/stripe-webhook-v2/index.ts`
   - Webhook immediately creates record in `user_products` table:
     - `user_id`: From authenticated session
     - `product_type`: Product purchased
     - `stripe_session_id`: Session identifier
     - `amount_paid`: Payment amount
     - `has_access`: true
   - No pending purchase record needed

3. **Instant Access**
   - User is immediately granted access to purchased content
   - Access control is enforced through `user_products` table

### Key Components

- **Frontend**: Standard product purchase buttons and checkout
- **Backend**: `supabase/functions/stripe-webhook-v2/index.ts`
- **Database**: `user_products` table
- **Access Control**: Row Level Security (RLS) policies

---

## Technical Architecture

### Database Schema

**pending_purchases table:**
```sql
- id (UUID, primary key)
- customer_email (TEXT)
- product_type (TEXT)
- stripe_session_id (TEXT, unique)
- amount_paid (INTEGER)
- currency (TEXT, default 'aud')
- is_processed (BOOLEAN, default false)
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP, default NOW() + 24 hours)
```

**user_products table:**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- product_type (TEXT)
- stripe_session_id (TEXT, unique)
- amount_paid (INTEGER)
- has_access (BOOLEAN, default true)
- created_at (TIMESTAMP)
```

### Webhook Configuration

- **Endpoint**: `https://mcxxiunseawojmojikvb.supabase.co/functions/v1/stripe-webhook-v2`
- **Events**: `checkout.session.completed`
- **Deployment**: Must use `--no-verify-jwt` flag for proper authentication
- **Secret**: Configured in Supabase environment variables

### RPC Functions

**get_user_pending_purchases(user_email TEXT DEFAULT NULL)**
- Returns pending purchases for current user or specified email
- Filters out expired and already processed purchases

**process_pending_purchase(p_stripe_session_id TEXT)**
- Moves pending purchase to user_products table
- Marks pending purchase as processed
- Returns success/failure status

---

## Access Control

### How Access is Determined

1. **User Authentication**: Supabase Auth handles user sessions
2. **Product Access Check**: Query `user_products` table for user's purchases
3. **RLS Policies**: Ensure users can only see their own products
4. **Frontend Guards**: Components check access before rendering content

### Access Control Flow

```typescript
// Check if user has access to specific product
const { data: userProducts } = await supabase
  .from('user_products')
  .select('*')
  .eq('product_type', productType)
  .eq('has_access', true);

const hasAccess = userProducts && userProducts.length > 0;
```

---

## Error Handling

### Common Issues and Solutions

1. **Webhook 401 Errors**: Redeploy with `--no-verify-jwt` flag
2. **Pending Purchase Not Found**: Check email matches exactly between checkout and account
3. **RPC Function Errors**: Ensure SQL functions are deployed correctly
4. **Access Not Granted**: Verify webhook processed successfully and `user_products` record exists

### Monitoring

- Webhook logs available in Supabase Edge Functions
- Database logs for RPC function execution
- Frontend console logs for debugging checkout process

---

## Deployment Notes

### Critical Deployment Requirements

1. **Webhook Deployment**:
   ```bash
   supabase functions deploy stripe-webhook-v2 --no-verify-jwt
   ```

2. **Environment Variables**:
   - Stripe webhook secret must match between Stripe dashboard and Supabase
   - All product and price IDs must be configured correctly

3. **Database Migrations**:
   - Ensure all RPC functions are deployed
   - Verify RLS policies are active

### Testing Both Flows

**Flow A Testing:**
1. Use incognito browser or logout
2. Purchase product as guest
3. Create account with same email
4. Verify email and check access

**Flow B Testing:**
1. Login to existing account
2. Purchase product
3. Verify immediate access grant

---

## Troubleshooting

### Flow A Issues
- Check `pending_purchases` table for record creation
- Verify email matches between Stripe and account signup
- Ensure RPC functions execute without errors

### Flow B Issues
- Check `user_products` table for immediate record creation
- Verify webhook receives and processes events correctly
- Confirm user authentication status during purchase

### General Issues
- Verify Stripe configuration and test/live mode consistency
- Check webhook endpoint accessibility and authentication
- Monitor Supabase logs for detailed error information