# V2 Migration Quickstart Guide

## Simple 3-Step Process

### Step 1: Test V2 Questions in Your Browser (5 minutes)

1. **Enable V2 mode:**
   ```bash
   # Edit .env file
   VITE_USE_V2_QUESTIONS=true
   ```

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

3. **Test the questions:**
   - Open your browser to http://localhost:5173
   - Navigate to Practice Tests, Drills, and Diagnostics
   - Try all 6 test types
   - **Look for the console message: "📊 Loading questions from V2 tables"**
   - Check questions display correctly
   - Verify passages show up
   - Test visual questions
   - Try completing a test end-to-end

### Step 2: Run Comprehensive Audit (30 seconds)

Run the audit script to check for issues:

```bash
npm run tsx scripts/migration/comprehensive-v2-audit.ts
```

**What it checks:**
- ✅ Question counts (V1 vs V2)
- ✅ Duplicate questions
- ✅ Hallucinations ("Let me..." patterns in question text)
- ✅ Missing required fields
- ✅ Invalid answer formats
- ✅ Broken passage relationships
- ✅ Difficulty distribution
- ✅ Visual question integrity

**Expected output:**

If everything is good:
```
✅ ✅ ✅  NO ISSUES FOUND - V2 DATA IS CLEAN! ✅ ✅ ✅
✅ Audit passed! V2 data is ready for migration.
```

If there are issues:
```
⚠️  12 ISSUES FOUND - REVIEW REQUIRED
🚨 CRITICAL BLOCKERS - DO NOT MIGRATE YET:
   Year 5 NAPLAN - Reading
      - 5 duplicate questions found
      - 2 questions with hallucination patterns
```

### Step 3: Switch to V2 Permanently (2 minutes)

Once you're satisfied with testing and audit passes:

1. **No code changes needed!** Just update the env variable:
   ```bash
   # .env (production)
   VITE_USE_V2_QUESTIONS=true
   ```

2. **Deploy:**
   ```bash
   npm run build
   # Deploy to your hosting (Vercel/Netlify/etc)
   ```

3. **Test in production:**
   - Verify questions load correctly
   - Check browser console for "📊 Loading questions from V2 tables"
   - Do a quick smoke test (complete 1 practice test)

4. **Once stable for 1-2 weeks, deprecate V1 tables:**

   In Supabase:
   - Go to Table Editor
   - Rename `questions` → `questions_v1_deprecated`
   - Rename `passages` → `passages_v1_deprecated`
   - Keep for 30 days as backup, then delete

---

## Rollback Plan

If something goes wrong, instant rollback:

```bash
# .env
VITE_USE_V2_QUESTIONS=false
```

Redeploy. Done. Your V1 tables are untouched.

---

## What Changed Under the Hood

The migration added **one check** to your question service:

```typescript
// Before (hardcoded):
supabase.from('questions')

// After (configurable):
const questionsTable = useV2 ? 'questions_v2' : 'questions';
supabase.from(questionsTable)
```

This was added to 4 functions:
- `fetchQuestionsFromSupabase()`
- `fetchQuestionsForTest()`
- `fetchDrillModes()`
- `fetchDiagnosticModes()`

Everything else stays exactly the same.

---

## Troubleshooting

### "No questions loading"
- Check console for errors
- Verify `VITE_USE_V2_QUESTIONS=true` in .env
- Restart dev server (env vars only load on startup)
- Check Supabase RLS policies allow reading from `questions_v2` table

### "Passages not showing"
- Verify passages exist in `passages_v2` table
- Check `passage_id` foreign keys are correct
- Run audit script to find broken relationships

### "Questions look wrong"
- Compare question data structure in V1 vs V2 tables
- Check if `answer_options` format changed
- Verify `correct_answer` field format

---

## Files Changed

**Modified:**
- `src/services/supabaseQuestionService.ts` - Added V2 table switching
- `.env` - Added `VITE_USE_V2_QUESTIONS` flag

**Created:**
- `scripts/migration/comprehensive-v2-audit.ts` - Audit script
- `docs/V2_MIGRATION_QUICKSTART.md` - This guide
- `docs/V2_MIGRATION_STRATEGY.md` - Full migration strategy (if you want the enterprise approach)

---

## Timeline

- **Step 1 (Testing):** 30 mins - 1 hour
- **Step 2 (Audit):** 30 seconds
- **Step 3 (Deploy):** 5-10 mins
- **Total:** ~1-2 hours from start to production

---

## Success Criteria

✅ All test types load questions
✅ Question counts match expectations
✅ No duplicates or hallucinations
✅ Passages display correctly
✅ Visual questions work
✅ Tests can be completed end-to-end
✅ Progress is saved and can be resumed
✅ Audit script passes with 0 critical issues

Once these pass, you're good to go live! 🚀
