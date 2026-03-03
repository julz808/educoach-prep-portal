# V2 Progress Reset Guide

**Date:** March 4, 2026
**Purpose:** Reset all user progress to provide a fresh start with V2 questions

---

## Executive Summary

✅ **V2 Questions are Live** - All services now use `questions_v2` table
⚠️ **Old Progress Still Exists** - User progress from V1 questions needs to be cleared
🎯 **Solution** - Run the progress reset script to give everyone a fresh start

---

## What Happens After Reset?

### ✅ Everything Will Show V2 Data

After the reset completes, **100% of user-facing data will be from V2**:

1. **Dashboard Metrics** ✅
   - All counts reset to 0
   - New activity tracked against V2 questions
   - Service: `dashboardService.ts` (uses `QUESTIONS_TABLE = questions_v2`)

2. **Test Taking** ✅
   - All questions loaded from `questions_v2`
   - Service: `supabaseQuestionService.ts` (uses `QUESTIONS_TABLE = questions_v2`)

3. **Insights & Analytics** ✅
   - All analytics calculated from V2 questions
   - Service: `analyticsService.ts` (uses `QUESTIONS_TABLE = questions_v2`)

4. **Drill Recommendations** ✅
   - Recommendations based on V2 curriculum
   - Service: `drillRecommendationService.ts` (uses `QUESTIONS_TABLE = questions_v2`)

5. **Writing Assessments** ✅
   - All writing prompts from V2
   - Service: `writingAssessmentService.ts` (uses `QUESTIONS_TABLE = questions_v2`)

### Environment Configuration

```bash
VITE_USE_V2_QUESTIONS=true  # ✅ Already set
```

This environment variable controls which table all services use. It's already set to `true`, so all services are reading from `questions_v2`.

---

## How to Run the Reset

### Option 1: Using the Helper Script (Recommended)

```bash
# Run from project root
./scripts/maintenance/run-v2-progress-reset.sh
```

The script will:
1. Show you what will be deleted/preserved
2. Ask for confirmation (type `RESET`)
3. Execute the SQL reset
4. Show success message with next steps

### Option 2: Direct SQL Execution

If you prefer to run the SQL directly:

```bash
# Via Supabase CLI
npx supabase db query -f scripts/maintenance/reset-all-user-progress-v2.sql

# Or via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Click SQL Editor
# 4. Copy/paste contents of reset-all-user-progress-v2.sql
# 5. Run the query
```

---

## What Gets Deleted (Progress Only)

The script will delete:

- ❌ `writing_assessments` - All written responses
- ❌ `user_test_sessions` - All test sessions (practice/drill/diagnostic)
- ❌ `question_attempt_history` - All individual question attempts
- ❌ `user_sub_skill_performance` - All skill performance metrics
- ❌ `user_progress` - All progress tracking records
- ❌ `drill_sessions` - All drill session data (if exists)

---

## What Gets Preserved (User Data)

The script will **NOT** touch:

- ✅ `auth.users` - Authentication accounts
- ✅ `user_profiles` - Names, emails, student details
- ✅ `user_products` - Product access, subscriptions, expiry dates
- ✅ `pending_purchases` - Payment records
- ✅ `questions_v2` - The new question bank
- ✅ `passages_v2` - The new passage bank
- ✅ `questions` (old table) - Kept for reference
- ✅ `passages` (old table) - Kept for reference

---

## Safety Features

### Built-in Safety Checks

The SQL script includes:

1. **Transaction Wrapper** - All operations in a single transaction (rollback on error)
2. **User Count Verification** - Ensures users still exist after operation
3. **Before/After Counts** - Shows exactly what was deleted
4. **Detailed Logging** - Every step is logged with RAISE NOTICE
5. **Foreign Key Respect** - Deletes in correct order to respect dependencies

### Emergency Rollback

If something goes wrong during execution:
- The transaction will automatically ROLLBACK
- No changes will be committed
- Database remains in original state

---

## Post-Reset Verification

After running the reset, verify success:

### 1. Check Progress Tables are Empty

```sql
SELECT COUNT(*) FROM writing_assessments;        -- Should be 0
SELECT COUNT(*) FROM user_test_sessions;         -- Should be 0
SELECT COUNT(*) FROM question_attempt_history;   -- Should be 0
SELECT COUNT(*) FROM user_sub_skill_performance; -- Should be 0
SELECT COUNT(*) FROM user_progress;              -- Should be 0
```

### 2. Check User Data is Preserved

```sql
SELECT COUNT(*) FROM auth.users;        -- Should be unchanged
SELECT COUNT(*) FROM user_profiles;     -- Should be unchanged
SELECT COUNT(*) FROM user_products;     -- Should be unchanged
```

### 3. Check V2 Questions are Available

```sql
SELECT COUNT(*) FROM questions_v2;  -- Should show question count
SELECT COUNT(*) FROM passages_v2;   -- Should show passage count

-- Check questions by product
SELECT test_type, COUNT(*)
FROM questions_v2
GROUP BY test_type
ORDER BY test_type;
```

### 4. Test in Application

1. Log into the app
2. Check Dashboard - metrics should be 0
3. Start a diagnostic - should load V2 questions
4. Complete some questions
5. Check insights - should show new progress
6. Verify announcement banner appears

---

## User Experience After Reset

### What Users Will See

1. **Dashboard**
   - All metrics at 0 (Questions Completed, Study Time, etc.)
   - Diagnostic: 0/X sections
   - Drills: 0/X sub-skills
   - Practice Tests: 0/5 tests
   - Announcement banner explaining the reset

2. **Insights Page**
   - No historical data
   - Clean slate for new V2 progress

3. **Test Taking**
   - All questions from V2 question bank
   - Improved quality questions
   - Better curriculum alignment

### User Communication

The announcement banner will show:
> "We've been working on new question sets and they're finally live! Your progress has been reset (04 March 2026) to ensure the best experience with our enhanced content."

---

## Technical Details

### Why Reset is Necessary

**Problem:** Old progress data references V1 question IDs that don't exist in V2

```
Old user_test_sessions → references questions from 'questions' table (V1)
New questions_v2 table → has completely different question IDs
```

**Impact Without Reset:**
- Dashboard shows metrics from old V1 questions
- Insights reference questions that aren't in V2
- Confusing mismatch between old progress and new questions
- Foreign key constraint prevents creating responses (already fixed)

**Solution:**
- Clear all progress data
- Let users start fresh with V2
- All new progress tracked correctly with V2 question IDs

### Database Tables Overview

**Progress Tables (Will be Empty After Reset):**
```
writing_assessments
  └─ session_id → user_test_sessions.id

user_test_sessions
  └─ user_id → auth.users.id
  └─ Contains: question_ids array (old V1 IDs)

question_attempt_history
  └─ question_id → questions_v2.id (FK updated 2026-02-28)
  └─ session_id → user_test_sessions.id

user_sub_skill_performance
  └─ user_id → auth.users.id
  └─ product_type, sub_skill, metrics

user_progress
  └─ user_id → auth.users.id
  └─ product_type, section_name, metrics
```

**User Tables (Preserved):**
```
auth.users (managed by Supabase Auth)
  └─ id, email, encrypted_password, etc.

user_profiles
  └─ user_id → auth.users.id
  └─ student_first_name, parent_email, etc.

user_products
  └─ user_id → auth.users.id
  └─ product_type, access_granted, expires_at
```

---

## Timeline

### Pre-Reset (Current State)
- ✅ V2 questions deployed to `questions_v2`
- ✅ All services reading from V2
- ⚠️ Old progress still in database
- ⚠️ Users see confusing mixed data

### During Reset (5-10 seconds)
- 🔄 Delete all progress tables
- 🔄 Verify user data preserved
- 🔄 Commit transaction

### Post-Reset (Fresh Start)
- ✅ All progress tables empty
- ✅ All users have clean slate
- ✅ All new progress tracked in V2
- ✅ Announcement banner explains reset
- ✅ 100% V2 data everywhere

---

## Rollback Plan

If you need to rollback after reset:

**You cannot undo the reset** - the data is permanently deleted. However:

1. **User accounts are safe** - No impact on authentication or access
2. **Product access is safe** - Subscriptions and purchases intact
3. **V2 questions are safe** - Question bank unchanged
4. **Old V1 data still exists** - The `questions` and `passages` tables are preserved (not deleted)

**If users had backup/export features:**
- We don't currently have user data exports
- Progress cannot be restored from V1 (different question IDs)
- This is a one-way migration by design

---

## Frequently Asked Questions

### Q: Will users lose their subscriptions?
**A:** No! `user_products` table is preserved. All access rights remain intact.

### Q: Will users need to re-authenticate?
**A:** No! `auth.users` is untouched. All login credentials work as before.

### Q: Can we restore their old progress?
**A:** No. Old progress references V1 question IDs that don't exist in V2. This is an intentional fresh start.

### Q: What if a user was mid-test?
**A:** Their in-progress session will be deleted. They'll need to start the test over with V2 questions.

### Q: Will this affect our analytics/reporting?
**A:** Historical data will be lost. Consider exporting analytics before reset if needed for business intelligence.

### Q: How long does the reset take?
**A:** Typically 5-10 seconds depending on database size.

### Q: Can we test this first?
**A:** Yes! You can run this on a staging/development database first to verify behavior.

### Q: What if the script fails halfway?
**A:** The script uses a transaction (BEGIN...COMMIT). If any step fails, everything rolls back. Database stays in original state.

---

## Ready to Execute?

Run this command when ready:

```bash
./scripts/maintenance/run-v2-progress-reset.sh
```

Type `RESET` when prompted to confirm.

---

## Post-Reset Checklist

- [ ] Run the reset script
- [ ] Verify progress tables are empty (SQL queries above)
- [ ] Verify user data preserved (SQL queries above)
- [ ] Test login as a user
- [ ] Check dashboard shows 0 metrics
- [ ] Start a diagnostic test
- [ ] Complete a few questions
- [ ] Check insights shows new progress
- [ ] Verify announcement banner displays
- [ ] Monitor user feedback/support tickets

---

## Support

If you encounter issues:

1. Check the script output for error messages
2. Run the verification queries
3. Check Supabase logs
4. Review the migration report: `V2_MIGRATION_COMPLETE_REPORT_2026-02-28.md`

---

**Last Updated:** 2026-03-04
**Status:** Ready to execute
**Risk Level:** Low (user data preserved, progress intentionally cleared)
