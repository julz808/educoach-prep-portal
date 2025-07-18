# Test Registration Flow After RLS Fix

## Overview
This guide helps you test the user registration flow after applying the RLS policies fix.

## Pre-Test Setup

1. **Apply the RLS migration**:
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Run the migration: `supabase/migrations/20250717000000_add_rls_policies.sql`

2. **Verify the fix**:
   - Run the verification script: `testing/verify-rls-fix.sql`
   - Ensure all critical tables show "✅ REGISTRATION SHOULD WORK"

## Test Cases

### Test Case 1: New User Registration
**Expected Result**: User should be able to register successfully

**Steps**:
1. Navigate to `/auth` (registration tab)
2. Fill out the registration form:
   - Email: `test@example.com`
   - Student First Name: `John`
   - Student Last Name: `Doe`
   - Parent First Name: `Jane`
   - Parent Last Name: `Doe`
   - School Name: `Test School`
   - Year Level: `8`
   - Password: `password123`
3. Click "Create Account"
4. Verify success message appears
5. Check that user is redirected to dashboard

**What to check**:
- No RLS policy errors in browser console
- User profile created successfully
- User progress initialized for all 6 products
- Dashboard loads properly

### Test Case 2: Registration with Different Year Levels
**Expected Result**: Registration should work for all year levels

**Steps**:
1. Test registration with year levels 5, 6, 7, 8, 9, 10
2. Verify each registration completes successfully

### Test Case 3: Database Verification
**Expected Result**: Data should be properly inserted

**Steps**:
1. After successful registration, check in Supabase Dashboard:
   - `user_profiles` table should have new record
   - `user_progress` table should have 6 records (one per product)
   - `user_id` should match the auth user ID

## Common Issues and Solutions

### Issue 1: RLS Policy Error
**Symptoms**: 
- Error message about insufficient permissions
- Console shows RLS policy violation

**Solution**:
- Verify the migration was applied correctly
- Check that policies exist using `verify-rls-fix.sql`
- Ensure auth.uid() is properly set

### Issue 2: Missing INSERT Policies
**Symptoms**:
- Cannot insert into user_profiles or user_progress
- Error: "new row violates row-level security policy"

**Solution**:
- Re-run the RLS migration
- Check GRANT statements are applied
- Verify WITH CHECK conditions are correct

### Issue 3: Cascade Issues
**Symptoms**:
- User profile created but progress not initialized
- Partial registration completion

**Solution**:
- Check foreign key constraints
- Verify transaction rollback on errors
- Ensure all products are properly configured

## Success Criteria

✅ **Registration completes without errors**
✅ **User profile is created in database**
✅ **User progress is initialized for all 6 products**
✅ **User is redirected to dashboard**
✅ **Dashboard loads with proper data**
✅ **No RLS policy errors in browser console**

## Post-Test Cleanup

1. **Remove test users** (if needed):
   ```sql
   -- Run in Supabase SQL Editor
   DELETE FROM user_progress WHERE user_id IN (
     SELECT id FROM auth.users WHERE email LIKE '%test%'
   );
   DELETE FROM user_profiles WHERE user_id IN (
     SELECT id FROM auth.users WHERE email LIKE '%test%'
   );
   ```

2. **Delete auth users** (via Supabase Dashboard):
   - Go to Authentication > Users
   - Delete test users manually

## Additional Verification

Run this query to verify registration data integrity:
```sql
SELECT 
    up.display_name,
    up.year_level,
    up.school_name,
    COUNT(prog.product_type) as products_initialized,
    array_agg(prog.product_type ORDER BY prog.product_type) as products
FROM user_profiles up
LEFT JOIN user_progress prog ON up.user_id = prog.user_id
WHERE up.user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%test%'
)
GROUP BY up.user_id, up.display_name, up.year_level, up.school_name
ORDER BY up.display_name;
```

Expected: Each test user should have 6 products initialized.