# Insights Section Fix - Root Cause and Solution

## 🎯 Root Cause Identified

The Insights section is broken because **question responses are not being saved to the `question_attempt_history` table** due to a **foreign key constraint mismatch**.

### The Problem:

1. **The application uses `questions_v2` table** for all questions ✅
2. **But the `question_attempt_history` table has a foreign key constraint pointing to the OLD `questions` table** ❌
3. **When completing a test**, the app tries to save question attempts with question_ids from `questions_v2`
4. **The database rejects these inserts** because those IDs don't exist in the old `questions` table
5. **Result:** No question attempts are saved → Insights shows 0/0 or 0/50

### Error Message:
```
insert or update on table "question_attempt_history" violates foreign key constraint
"question_attempt_history_question_id_fkey"
Key (question_id)=(808afa68...) is not present in table "questions".
```

### Why Test Review Works but Insights Doesn't:
- **Test Review Page:** Reads scores directly from `user_test_sessions.final_score` ✅ (this IS being saved)
- **Insights Analytics:** Calculates scores from `question_attempt_history` table ❌ (this is EMPTY because inserts fail)

---

## 🔧 The Fix

You need to update the foreign key constraint to point to `questions_v2` instead of `questions`.

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/_/sql
2. Click "New Query" to create a new SQL query

### Step 2: Run This SQL

Copy and paste the following SQL into the editor and click **"Run"**:

```sql
-- Drop the old foreign key constraint that points to 'questions' table
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- Add new foreign key constraint that points to 'questions_v2' table
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;
```

### Step 3: Verify the Fix

After running the SQL, verify it worked by running this test script:

```bash
npx tsx scripts/test-question-attempt-insert.ts
```

**Expected output:**
```
✅ INSERT SUCCESSFUL!
```

If you see this, the fix worked! ✅

---

## 🧪 Testing the Complete Fix

### Test 1: Complete a New Test

1. Go to your app and complete any test section (diagnostic or practice)
2. After completing, check the browser console for these logs:
   ```
   🎯 DEV-REPLICA: Session updated successfully
   📊 DEV-REPLICA: Attempt insertion summary:
      ✅ Successful: X
      ❌ Failed: 0
   ```

If you see `✅ Successful:` with a count > 0 and `❌ Failed: 0`, question attempts are being saved correctly!

### Test 2: Check Insights

1. Navigate to the Insights page
2. The scores should now match what you saw in the test results
3. For example:
   - Test results showed: **8/50 = 16%** ✅
   - Insights should also show: **8/50 = 16%** ✅ (not 0/50 or 0/0)

---

## 📊 For Existing Test Data

**Important:** The foreign key fix only affects **new test completions**.

### Why Past Tests Still Show 0/0:

Existing completed tests don't have question attempts recorded in `question_attempt_history` because those inserts failed when you originally completed them.

### Options:

1. **Option A - Recommended:** Just complete new tests. The scores will show correctly for all future tests.

2. **Option B - Backfill (Advanced):** If you want to fix historical data, you would need to:
   - Recreate question attempts from the session data stored in `user_test_sessions.answers_data`
   - This requires a more complex data migration script
   - Only worth it if you have important historical test data you need to preserve

---

## 📝 Technical Details

### What Was Happening:

1. User completes a test → `TestTaking.tsx` calls `DeveloperToolsReplicaService.completeSessionLikeDeveloperTools()`
2. This service correctly updates `user_test_sessions` table ✅
3. Then it tries to insert into `question_attempt_history` for each answered question
4. Each insert fails with foreign key violation ❌
5. Errors are logged to console but don't stop test completion (by design)
6. Insights page queries `question_attempt_history` → finds no records → shows 0/0

### After the Fix:

1. User completes a test → Same flow
2. Service updates `user_test_sessions` ✅
3. Now inserts into `question_attempt_history` succeed ✅ (foreign key points to correct table)
4. Insights page queries `question_attempt_history` → finds records → shows correct scores ✅

---

## ✅ Checklist

- [ ] Run the SQL migration in Supabase SQL Editor
- [ ] Run `npx tsx scripts/test-question-attempt-insert.ts` to verify (should see ✅ INSERT SUCCESSFUL!)
- [ ] Complete a new test section
- [ ] Check Insights - scores should now be correct!

---

## 🆘 If You Still Have Issues

After applying the fix, if Insights still shows 0/0:

1. Check the browser console when completing a test
2. Look for errors in the `DEV-REPLICA` logs
3. Run the diagnostic script: `npx tsx scripts/debug-insights-data.ts`
4. Share the output so we can investigate further

---

**Date:** 2026-02-28
**Status:** Ready to apply
**Impact:** Fixes all Insights data for future test completions
