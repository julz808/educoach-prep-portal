# CRITICAL: Database Migration Required
**Date:** 2026-02-28
**Priority:** URGENT - Blocking all test completions

## The Problem

The `question_attempt_history` table has a foreign key constraint that points to the **OLD `questions` table** instead of `questions_v2`.

**This is why:**
- ✅ Tests load from `questions_v2`
- ✅ Session stores question IDs from `questions_v2`
- ❌ **But responses can't be created** because foreign key points to `questions` table
- ❌ PostgreSQL error: `"insert or update on table "question_attempt_history" violates foreign key constraint"`

**Result:** No test responses are being saved, insights show 0/0 for everything!

---

## The Fix

You need to run this SQL in your Supabase dashboard:

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor" (left sidebar)
4. Click "New Query"

### Step 2: Run This SQL

```sql
-- Drop the old foreign key constraint (points to questions table)
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- Add new foreign key constraint (points to questions_v2 table)
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;
```

### Step 3: Click "RUN"

You should see:
```
Success. No rows returned
```

---

## After Running the Migration

### 1. Test the Fix

Complete these scripts in order:

```bash
# 1. Create responses for your existing Numeracy session
npx tsx scripts/fix-numeracy-responses-simple.ts

# 2. Verify responses were created
npx tsx scripts/check-latest-responses.ts

# 3. Check insights in browser
# Should now show: Numeracy 8/50 (16%)
```

### 2. Hard Refresh Browser

- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + F5`

### 3. Complete a NEW Test

1. Start any practice test section
2. Answer questions
3. Submit
4. **Check browser console** for:
   ```
   📊 Loading questions from V2 tables
   🏁 COMPLETE: Using productType: Year 5 NAPLAN
   ✅ DEV-REPLICA: Successfully inserted attempt for question X
   ```
5. **Check insights** - should show correct data!

---

## What This Migration Does

**BEFORE:**
```
question_attempt_history
  └─ question_id (foreign key) ──> questions.id ❌

Test loads: questions_v2 IDs
Trying to save: questions_v2 IDs
Foreign key check: Do these IDs exist in questions table? NO ❌
Result: INSERT REJECTED
```

**AFTER:**
```
question_attempt_history
  └─ question_id (foreign key) ──> questions_v2.id ✅

Test loads: questions_v2 IDs
Trying to save: questions_v2 IDs
Foreign key check: Do these IDs exist in questions_v2 table? YES ✅
Result: INSERT SUCCESSFUL
```

---

## Verification

After running the migration, this command should succeed:

```bash
npx tsx scripts/fix-numeracy-responses-simple.ts
```

**Expected output:**
```
✅ Q0: A ✓
✅ Q1: B ✗
✅ Q2: C ✓
...
📊 Final: 10 created, 0 failed
```

**If you still see foreign key errors**, the migration didn't work.

---

## Why We Didn't Catch This Earlier

1. **Old test sessions:** Used `questions` table, everything worked
2. **Migration to V2:** Changed test loading to `questions_v2`
3. **Forgot to update:** Foreign key constraint in `question_attempt_history`
4. **Silent failure:** Responses failed to insert but didn't show error to user
5. **Symptoms:** Insights showed 0/0 because no responses in database

---

## Alternative: Use Supabase CLI (if installed)

If you have `supabase` CLI installed:

```bash
cd /Users/julz88/Documents/educoach-prep-portal-2
npx supabase db push
```

This will apply the migration file at:
`supabase/migrations/20260228_update_foreign_key_to_questions_v2.sql`

---

## Status

- ❌ **Not Applied Yet** - You must run this SQL manually
- ⏱️ **Estimated Time:** 30 seconds
- 🎯 **Impact:** Fixes ALL test response saving issues

---

## After This Is Fixed

Everything will work:
- ✅ Tests load from questions_v2
- ✅ Responses save successfully
- ✅ Insights display correct data
- ✅ Sub-skills populated
- ✅ Section totals correct
- ✅ Post-test and insights match

**This is the FINAL piece of the puzzle!**
