# V2 Production Deployment Checklist

**Date:** 2026-03-02
**Status:** Ready for deployment with required configuration

## Before You Deploy

### ✅ 1. Verify Local Questions Exist

Check that your questions_v2 table has data:

```bash
npx supabase db query "SELECT test_type, test_mode, section_name, COUNT(*) as count FROM questions_v2 GROUP BY test_type, test_mode, section_name ORDER BY test_type, test_mode, section_name;"
```

Expected: Should show counts for all your test types.

### ✅ 2. Set Vercel Environment Variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these variables:**

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_USE_V2_QUESTIONS` | `true` | Production, Preview, Development |
| `VITE_SUPABASE_URL` | (your existing value) | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | (your existing value) | Production, Preview, Development |

**CRITICAL:** `VITE_USE_V2_QUESTIONS=true` MUST be set, or production will try to use V1 tables!

### ✅ 3. Apply Database Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. SQL Editor → New Query
4. Run this migration:

```sql
-- ============================================================================
-- CRITICAL MIGRATION: Update Foreign Keys to questions_v2
-- ============================================================================
-- This allows responses to be saved with question IDs from questions_v2 table
-- Without this, test completion will fail silently

-- Step 1: Drop old foreign key (points to questions table)
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

-- Step 2: Add new foreign key (points to questions_v2 table)
ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions_v2(id)
ON DELETE CASCADE;

-- Verify the change
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'question_attempt_history_question_id_fkey';
```

**Expected result:** Should show foreign key pointing to `questions_v2` table.

**Option B: Using Supabase CLI**

```bash
cd /Users/julz88/Documents/educoach-prep-portal-2
npx supabase db push
```

This will apply the migration file:
`supabase/migrations/20260228_update_foreign_key_to_questions_v2.sql`

### ✅ 4. Verify V2 Tables Exist and Have Data

Run in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT COUNT(*) as questions_count FROM questions_v2;
SELECT COUNT(*) as passages_count FROM passages_v2;

-- Check data distribution
SELECT test_type, test_mode, COUNT(*) as count
FROM questions_v2
GROUP BY test_type, test_mode
ORDER BY test_type, test_mode;
```

**Expected:**
- questions_v2 should have thousands of questions
- passages_v2 should have hundreds of passages
- All test types should be represented

---

## Deploy to Production

Once all checklist items are complete:

```bash
git add .
git commit -m "feat: Deploy V2 question bank to production"
git push origin main
```

Vercel will automatically:
1. Build the application
2. Bundle with environment variables (including `VITE_USE_V2_QUESTIONS=true`)
3. Deploy to production

**Build time:** ~2-3 minutes

---

## Post-Deployment Verification

### 1. Check Environment Variable

Open browser console on production site and run:

```javascript
console.log(import.meta.env.VITE_USE_V2_QUESTIONS)
```

**Expected:** Should output `"true"`

If it shows `undefined` or `"false"`, the environment variable wasn't set correctly in Vercel.

### 2. Test Question Loading

1. Open production site
2. Navigate to any test (e.g., Year 7 NAPLAN)
3. Open browser console (F12)
4. Look for this log message:

```
📊 Loading questions from V2 tables
```

**If you see:** `"Loading questions from V1 tables"` → Environment variable not set

### 3. Complete a Test Session

1. Start a practice test
2. Answer a few questions
3. Submit the test
4. Check browser console for:
   ```
   ✅ DEV-REPLICA: Successfully inserted attempt for question [question-id]
   ```

**If you see foreign key errors:** The database migration wasn't applied

### 4. Verify Insights Page

1. Go to Insights page
2. Select the test you just completed
3. **Expected:**
   - Shows correct question counts (e.g., "2/50 questions answered")
   - Sub-skills are populated
   - Section breakdown shows accurate totals
   - Accuracy percentage is correct

**If insights show 0/0:** Either migration not applied or environment variable not set

---

## What Happens to Existing Users?

### User Progress is Preserved

User progress is stored independently from questions in these tables:
- `user_progress` - Overall stats
- `user_question_responses` - Individual responses
- `question_attempt_history` - Attempt tracking

**Key point:** Progress is keyed by question IDs, not table names.

### Migration Impact

**Before Migration (V1 questions):**
- Users who completed tests with V1 questions: ✅ Their progress remains intact
- Those question IDs are stored in their response history

**After Migration (V2 questions):**
- New test sessions use V2 question IDs
- Old progress is still visible (from V1 questions)
- New progress is tracked (from V2 questions)

### Mixed History Scenario

If a user has:
- Old progress from V1 questions: ✅ Still visible in their history
- New progress from V2 questions: ✅ Tracked separately

**Impact:** Minimal. Most customers aren't using the platform actively, so they'll only see V2 questions.

### Insights Display

Insights page uses the `QUESTIONS_TABLE` constant:

```typescript
const QUESTIONS_TABLE = import.meta.env.VITE_USE_V2_QUESTIONS === 'true'
  ? 'questions_v2'
  : 'questions';
```

**Result:**
- Production (with V2 enabled): Shows V2 question data
- Old V1 responses: May not match up if question IDs differ

**Recommendation for active users:** Consider offering a "Reset Progress" option to start fresh with V2 questions.

---

## Rollback Plan (If Something Goes Wrong)

### Option 1: Quick Rollback (Environment Variable)

If you need to revert immediately:

1. Go to Vercel → Environment Variables
2. Change `VITE_USE_V2_QUESTIONS` from `true` to `false`
3. Redeploy

**Effect:** Production will use V1 tables (questions, passages)

**Note:** This only works if you still have data in V1 tables!

### Option 2: Database Rollback

If you need to revert the foreign key migration:

```sql
-- Point foreign key back to questions table (V1)
ALTER TABLE question_attempt_history
DROP CONSTRAINT IF EXISTS question_attempt_history_question_id_fkey;

ALTER TABLE question_attempt_history
ADD CONSTRAINT question_attempt_history_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions(id)
ON DELETE CASCADE;
```

---

## Common Issues and Solutions

### Issue 1: "No questions found"

**Symptom:** Tests load but show no questions

**Cause:** Environment variable not set in Vercel

**Fix:** Add `VITE_USE_V2_QUESTIONS=true` in Vercel, then redeploy

### Issue 2: "Foreign key constraint violation"

**Symptom:** Tests complete but responses don't save

**Cause:** Database migration not applied

**Fix:** Run the SQL migration in Supabase Dashboard

### Issue 3: "Insights show 0/0"

**Symptom:** Completed tests but insights show no data

**Possible causes:**
1. Foreign key migration not applied (responses not saving)
2. Environment variable mismatch (looking in wrong table)

**Fix:**
1. Verify `VITE_USE_V2_QUESTIONS=true` in Vercel
2. Apply database migration
3. Complete a new test to verify

### Issue 4: "Mixed V1/V2 data"

**Symptom:** Some insights show data, others don't

**Cause:** Partial migration or environment variable only set for some environments

**Fix:** Ensure `VITE_USE_V2_QUESTIONS=true` for ALL environments (Production, Preview, Development)

---

## Success Criteria

After deployment, you should see:

- ✅ Tests load questions from questions_v2 table
- ✅ All test types available (Year 5 NAPLAN, Year 7 NAPLAN, etc.)
- ✅ Test completion saves responses successfully
- ✅ Insights page shows accurate data
- ✅ Sub-skills are populated
- ✅ Section breakdowns show correct totals
- ✅ No foreign key constraint errors in console

---

## Maintenance Notes

### When Adding New Questions

Always use the V2 generation engines:
- Path: `src/engines/questionGeneration/v2/`
- Target tables: `questions_v2`, `passages_v2`

**DO NOT use V1 engines:**
- Path: `src/engines/questionGeneration/supabaseStorage.ts`
- These are deprecated

### When Adding New Services

Always use the `QUESTIONS_TABLE` constant:

```typescript
const USE_V2_QUESTIONS = import.meta.env.VITE_USE_V2_QUESTIONS === 'true';
const QUESTIONS_TABLE = USE_V2_QUESTIONS ? 'questions_v2' : 'questions';
const PASSAGES_TABLE = USE_V2_QUESTIONS ? 'passages_v2' : 'passages';

// Use in queries
await supabase.from(QUESTIONS_TABLE).select('*');
```

### Monitoring

After deployment, monitor for:
- Foreign key constraint errors in logs
- Zero question counts in tests
- Insights showing 0/0 data
- User reports of missing questions

---

## Support

If you encounter issues during deployment:

1. Check Vercel build logs for environment variable confirmation
2. Check Supabase logs for database errors
3. Use browser console to verify V2 flag is true
4. Run the verification queries in SQL Editor

---

## Status

- 📋 **Pre-deployment checklist:** Complete this before pushing
- 🚀 **Deployment:** Push to GitHub, Vercel auto-deploys
- ✅ **Post-deployment verification:** Test thoroughly after deploy
- 🔄 **Rollback plan:** Available if needed

**Estimated total time:** 15-20 minutes (including verification)

**Risk level:** Low (rollback available via environment variable)

---

## Final Notes

Your V2 migration is well-prepared:
- ✅ All services are V2-ready
- ✅ Database schema is prepared
- ✅ Migration file exists
- ✅ Environment flag controls everything

The main risk is forgetting to:
1. Set the environment variable in Vercel
2. Apply the database migration

**Once those two items are complete, deployment should be seamless!**
