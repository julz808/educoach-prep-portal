# Insights Section - Root Cause Analysis

**Date:** 2026-02-28
**Issue:** Insights section showing 0/0 or incorrect scores
**Status:** ✅ ROOT CAUSE IDENTIFIED - Fix Ready to Apply

---

## 🔍 Investigation Summary

### User Report:
> "The insights section is completely broken. If I scored 8/50 for a numeracy test and the test results show that after I click into the test to review, insights will say 0/50 or 0/0."

### Investigation Process:

1. ✅ **Audited Insights page component** (`src/pages/Insights.tsx`)
   - Found: Insights loads data via `AnalyticsService`

2. ✅ **Examined data storage** (`src/services/analyticsService.ts`)
   - Found: Analytics calculates scores from `question_attempt_history` table
   - Uses complex queries to aggregate question-by-question data

3. ✅ **Created diagnostic script** to check actual database values
   - **DISCOVERY:** Session records show correct scores (8/50 = 16%) ✅
   - **DISCOVERY:** `question_attempt_history` table is EMPTY (0 records) ❌

4. ✅ **Traced question response saving logic**
   - Found: `DeveloperToolsReplicaService.completeSessionLikeDeveloperTools()` is responsible
   - Service DOES run when tests complete
   - Service DOES update `user_test_sessions` successfully
   - Service TRIES to insert into `question_attempt_history` but...

5. ✅ **Tested manual insert** into `question_attempt_history`
   - **ROOT CAUSE FOUND:** Foreign key constraint violation!

---

## 🎯 Root Cause

### The Problem:

```
Foreign key constraint "question_attempt_history_question_id_fkey"
points to table "questions" but the app uses table "questions_v2"
```

### Detailed Breakdown:

| Component | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Application code | Uses `questions_v2` | Uses `questions_v2` | ✅ Correct |
| Test sessions | Saves to `user_test_sessions` | Saves correctly | ✅ Working |
| Question attempts | Saves to `question_attempt_history` | **FAILS - FK violation** | ❌ Broken |
| FK constraint | Should point to `questions_v2` | Points to `questions` | ❌ Mismatch |

### Error Message:
```
insert or update on table "question_attempt_history" violates foreign key constraint
"question_attempt_history_question_id_fkey"
Key (question_id)=(808afa68-293b-465c-8be7-be5806802df2) is not present in table "questions".
Details: Key (question_id)=(808afa68...) is not present in table "questions".
```

### Why This Causes the Issue:

1. **Test Completion Flow:**
   ```
   User completes test
   → DeveloperToolsReplicaService.completeSessionLikeDeveloperTools()
   → Updates user_test_sessions ✅ (with final_score: 16%, correct_answers: 8)
   → FOR EACH answered question:
      → Tries to INSERT into question_attempt_history
      → Database checks foreign key constraint
      → Looks for question_id in "questions" table
      → Question doesn't exist there (it's in "questions_v2")
      → Rejects insert with FK violation ❌
   → Errors are logged but don't throw (by design)
   → Test completion succeeds but NO attempts are recorded
   ```

2. **Test Review vs Insights:**
   - **Test Review:** Reads `user_test_sessions.final_score` directly
     - Shows: 8/50 = 16% ✅ CORRECT
   - **Insights:** Queries `question_attempt_history` to calculate scores
     - Finds: 0 records
     - Shows: 0/0 or 0/50 ❌ INCORRECT

---

## 📊 Evidence

### Database Query Results:

```sql
-- Session data (CORRECT)
SELECT final_score, correct_answers, total_questions
FROM user_test_sessions
WHERE id = '1daa4be7-b2f0-4da9-820e-95938c6b714e';

Result:
final_score: 16
correct_answers: 8
total_questions: 50
```

```sql
-- Question attempts (EMPTY)
SELECT COUNT(*)
FROM question_attempt_history
WHERE session_id = '1daa4be7-b2f0-4da9-820e-95938c6b714e';

Result: 0 ❌
```

```sql
-- Foreign key constraint check
SELECT confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname = 'question_attempt_history_question_id_fkey';

Result: questions ❌ (should be questions_v2)
```

---

## 🔧 The Fix

### Migration Required:

```sql
-- Drop old constraint
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- Add new constraint pointing to questions_v2
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;
```

### Migration File:

The fix already exists in:
```
supabase/migrations/20260228_update_foreign_key_to_questions_v2.sql
```

---

## 📈 Impact Assessment

### Before Fix:
- ❌ All Insights data shows 0/0 or 0/X
- ✅ Test completion still works
- ✅ Test review shows correct scores
- ❌ No question-level analytics available
- ❌ Cannot track sub-skill performance
- ❌ Cannot identify strengths/weaknesses

### After Fix:
- ✅ All NEW test completions will save question attempts
- ✅ Insights will show correct scores
- ✅ Sub-skill analytics will work
- ✅ Strengths/weaknesses tracking will work
- ⚠️  Old completed tests will still show 0/0 (attempts not recorded)

### Historical Data:

Past test data **can** be backfilled if needed:
- Session data is intact in `user_test_sessions`
- `answers_data` field contains all user responses
- Could write migration script to recreate question attempts
- **Recommendation:** Only backfill if historical data is critical

---

## 🧪 Verification Steps

### 1. Pre-Fix Verification:
```bash
# This should FAIL with FK violation
npx tsx scripts/test-question-attempt-insert.ts
```

### 2. Apply Fix:
```sql
-- Run in Supabase SQL Editor
-- (see INSIGHTS_FIX_INSTRUCTIONS.md)
```

### 3. Post-Fix Verification:
```bash
# This should SUCCEED
npx tsx scripts/test-question-attempt-insert.ts

# Expected output:
# ✅ INSERT SUCCESSFUL!
```

### 4. End-to-End Test:
1. Complete a new test section
2. Check browser console for `DEV-REPLICA` logs showing successful inserts
3. Navigate to Insights
4. Verify scores match test results

---

## 📁 Related Files

### Diagnostic Scripts:
- `scripts/debug-insights-data.ts` - Checks database state
- `scripts/test-question-attempt-insert.ts` - Tests FK constraint

### Application Code:
- `src/pages/Insights.tsx` - Insights UI
- `src/services/analyticsService.ts` - Data loading (queries question_attempt_history)
- `src/services/developerToolsReplicaService.ts` - Session completion (inserts to question_attempt_history)
- `src/pages/TestTaking.tsx` - Test completion flow

### Database:
- `supabase/migrations/20260228_update_foreign_key_to_questions_v2.sql` - The fix
- Table: `question_attempt_history` - Needs FK update
- Table: `questions_v2` - Current questions table
- Table: `questions` - Old questions table (FK currently points here)

---

## 🎓 Lessons Learned

### What Went Wrong:

1. **v1 → v2 Migration Incomplete:**
   - Questions table was migrated from `questions` to `questions_v2`
   - Application code was updated to use `questions_v2`
   - **But** foreign key constraints were not updated
   - Silent failures occurred (errors logged but not thrown)

2. **Testing Gap:**
   - Test completion appeared to work (scores saved to session)
   - No end-to-end test that verified Insights data
   - FK violations were silent (by design, to not disrupt UX)

### Prevention for Future:

1. ✅ **Complete migration checklists:**
   - [ ] Update tables
   - [ ] Update application code
   - [ ] Update foreign keys ← Was missed
   - [ ] Update indexes
   - [ ] Update RPC functions

2. ✅ **Add E2E tests:**
   - Test complete flow: Complete test → Check Insights
   - Verify both `user_test_sessions` AND `question_attempt_history`

3. ✅ **Monitor silent failures:**
   - Add alerts for `DEV-REPLICA` errors
   - Log failed question attempt inserts to error tracking

---

## ✅ Summary

| Item | Status |
|------|--------|
| **Root Cause** | Foreign key constraint points to wrong table ✅ IDENTIFIED |
| **Fix** | SQL migration ready to apply ✅ READY |
| **Impact** | High - All Insights data affected 📊 |
| **Urgency** | High - Core feature broken 🚨 |
| **Complexity** | Low - Simple SQL migration ⚡ |
| **Risk** | Low - Safe to apply, affects future data only ✅ |

**Next Step:** Apply the SQL migration in Supabase SQL Editor
**See:** `INSIGHTS_FIX_INSTRUCTIONS.md` for step-by-step guide
