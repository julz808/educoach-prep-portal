# Setup Progress Clearing Feature

The progress clearing feature requires database functions to be created in Supabase.

## Quick Setup (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Migration

1. Click **New query**
2. Copy the contents of `/supabase/migrations/clear_progress_functions.sql`
3. Paste into the SQL editor
4. Click **Run** or press `Cmd/Ctrl + Enter`

You should see: ✅ **Success. No rows returned**

### Step 3: Test It

1. Go back to your app at http://127.0.0.1:3001/
2. Navigate to **Profile** settings
3. Scroll to the **Reset Progress** section
4. Try clicking any clear button
5. Confirm the action
6. You should see a success toast message
7. Check your dashboard - progress should be cleared!

---

## What Gets Created

The migration creates 3 database functions:

1. **`clear_test_mode_progress(user_id, product_type, test_mode)`**
   - Clears practice, drill, OR diagnostic progress for one product
   - Example: Clear only drills for Year 5 NAPLAN

2. **`clear_product_progress(user_id, product_type)`**
   - Clears ALL progress for one product
   - Example: Clear everything for Year 7 NAPLAN

3. **`clear_all_user_progress(user_id)`**
   - Clears ALL progress across ALL products
   - Nuclear option - complete reset

All functions run with `SECURITY DEFINER` which means they bypass RLS policies (Row Level Security) but are only accessible to authenticated users.

---

## Troubleshooting

### Error: "function clear_test_mode_progress does not exist"

**Solution:** You haven't run the migration yet. Follow Step 1-2 above.

### Error: "permission denied"

**Solution:** Make sure you're logged in as an authenticated user. The functions require authentication.

### Progress still showing after clearing

**Solution:**
1. Refresh the page (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. Check browser console for errors (F12)
3. Verify the SQL migration ran successfully in Supabase

---

## Alternative: Run via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db reset
# or
supabase migration up
```

---

## Security Notes

✅ Functions are `SECURITY DEFINER` - they have permission to delete
✅ Functions check `p_user_id` matches the authenticated user
✅ Only authenticated users can execute
✅ All deletes are scoped to the specific user

No user can delete another user's progress.
