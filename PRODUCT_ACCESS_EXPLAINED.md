# Product Access System Explained

## How Product Access Works

### 1. User Registration & Email
- Users register with their email address
- This email becomes their unique identifier for product access
- They must verify their email before they can log in

### 2. Product Purchase Flow
When a user purchases a product:
1. They go through Stripe Checkout with their email
2. Upon successful payment, Stripe sends a webhook to our system
3. The webhook handler grants access to that specific product for that email
4. Access is stored in the `user_products` table

### 3. Access Control Check
When a user logs in:
1. The system checks their email against the `user_products` table
2. If they have purchased a product, they get access to it
3. If not, they see the paywall

### 4. Important Notes

#### Same Email Requirement
**YES** - Users MUST use the same email address for:
- Learning portal registration
- Product purchases on Stripe

If they use different emails, the system won't link their purchase to their account.

#### Multiple Product Access
- Users can purchase multiple products
- Each product purchase is linked to their email
- They'll have access to all products they've purchased

#### Landing Pages & Product Access
When you create product landing pages:
1. Users purchase through Stripe Checkout (with their email)
2. Stripe webhook grants access to that email
3. When they log into the learning portal with the same email, they automatically have access
4. No manual intervention needed!

## Example Scenarios

### Scenario 1: Correct Flow ✅
1. User registers on portal with `john@example.com`
2. User purchases "Year 5 NAPLAN" using `john@example.com`
3. User logs into portal → Has access to Year 5 NAPLAN

### Scenario 2: Different Emails ❌
1. User registers on portal with `john@example.com`
2. User purchases "Year 5 NAPLAN" using `parent@example.com`
3. User logs into portal → NO ACCESS (different emails)

### Scenario 3: Purchase Before Registration ✅
1. User purchases "Year 5 NAPLAN" on landing page using `john@example.com`
2. Later, user registers on portal with `john@example.com`
3. User logs in → Has access to Year 5 NAPLAN

## Database Structure
```sql
-- user_products table
user_email    | product_type              | purchase_date | stripe_customer_id
--------------+---------------------------+---------------+-------------------
john@example  | Year 5 NAPLAN            | 2024-01-20    | cus_xxxxx
john@example  | Year 7 NAPLAN            | 2024-01-21    | cus_xxxxx
```

## Key Takeaways
1. Email is the KEY - same email must be used for portal and purchases
2. Access is automatic once payment is processed
3. Multiple products can be purchased and accessed
4. Works whether they register first or purchase first
5. No manual access granting needed - it's all automated!