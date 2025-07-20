# Database Migration Guide

## Option 1: Using Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in and select your project
3. Click on **"SQL Editor"** in the left sidebar

### Step 2: Run the Migration
1. Click **"New Query"** 
2. Copy and paste the following SQL:

```sql
-- Update the register_new_user function to include parent_email
CREATE OR REPLACE FUNCTION register_new_user(
  p_user_id UUID,
  p_email TEXT,
  p_student_first_name TEXT,
  p_student_last_name TEXT,
  p_parent_first_name TEXT,
  p_parent_last_name TEXT,
  p_parent_email TEXT,
  p_school_name TEXT,
  p_year_level INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert user profile
  INSERT INTO user_profiles (
    user_id,
    student_first_name,
    student_last_name,
    parent_first_name,
    parent_last_name,
    parent_email,
    school_name,
    year_level,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_student_first_name,
    p_student_last_name,
    p_parent_first_name,
    p_parent_last_name,
    p_parent_email,
    p_school_name,
    p_year_level,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    student_first_name = EXCLUDED.student_first_name,
    student_last_name = EXCLUDED.student_last_name,
    parent_first_name = EXCLUDED.parent_first_name,
    parent_last_name = EXCLUDED.parent_last_name,
    parent_email = EXCLUDED.parent_email,
    school_name = EXCLUDED.school_name,
    year_level = EXCLUDED.year_level,
    updated_at = NOW();

  -- Initialize user progress for all products
  INSERT INTO user_progress (
    user_id,
    product_type,
    created_at,
    updated_at
  )
  SELECT 
    p_user_id,
    unnest(ARRAY[
      'VIC Selective Entry (Year 9 Entry)',
      'NSW Selective Entry (Year 7 Entry)',
      'Year 5 NAPLAN',
      'Year 7 NAPLAN',
      'EduTest Scholarship (Year 7 Entry)',
      'ACER Scholarship (Year 7 Entry)'
    ]),
    NOW(),
    NOW()
  ON CONFLICT (user_id, product_type) DO NOTHING;

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'message', 'User registered successfully'
  );
  
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Return error
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. Click **"Run"** button
4. You should see "Success. No rows returned" message

### Step 3: Verify the Migration
1. In the same SQL Editor, run this query to verify:
```sql
SELECT routine_name, specific_name 
FROM information_schema.routines 
WHERE routine_name = 'register_new_user';
```
2. You should see the function listed

## Option 2: Using Supabase CLI (If you have it installed)

### Prerequisites
- Supabase CLI installed
- Linked to your project

### Steps
```bash
# Navigate to your project directory
cd /path/to/educoach-prep-portal-2

# Push migrations to Supabase
supabase db push

# Or apply specific migration
supabase db reset
```

## Option 3: Manual Copy-Paste (Fallback)

If the above options don't work:

1. Open the migration file:
   ```
   /supabase/migrations/20250121000000_update_register_user_function.sql
   ```
2. Copy the entire content
3. Go to Supabase Dashboard → SQL Editor
4. Paste and run

## What This Migration Does

### Before Migration:
- `register_new_user` function didn't have `parent_email` parameter
- Parent email wasn't being stored during registration

### After Migration:
- ✅ Function now accepts `p_parent_email` parameter
- ✅ Parent email is stored in `user_profiles.parent_email` column
- ✅ Registration form can now save parent email for marketing

## Troubleshooting

### Error: "Function already exists"
This is normal - the `CREATE OR REPLACE` will update the existing function.

### Error: "Column parent_email doesn't exist"
Run this first:
```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS parent_email text;
```

### Error: "Permission denied"
Make sure you're running this as the database owner in Supabase Dashboard.

## Verification Steps

After migration, test registration:
1. Go to your registration page
2. Fill out the form including parent email
3. Submit registration
4. Check Supabase Dashboard → Table Editor → user_profiles
5. Verify the new user has the parent_email filled in

## Rollback (If Needed)

If something goes wrong, you can rollback by running:
```sql
CREATE OR REPLACE FUNCTION register_new_user(
  p_user_id UUID,
  p_email TEXT,
  p_student_first_name TEXT,
  p_student_last_name TEXT,
  p_parent_first_name TEXT,
  p_parent_last_name TEXT,
  p_school_name TEXT,
  p_year_level INTEGER
) RETURNS JSONB AS $$
-- (previous function code without parent_email)
```

But this should not be necessary as the migration is additive.