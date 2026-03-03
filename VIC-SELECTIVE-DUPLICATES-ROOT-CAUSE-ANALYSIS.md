# VIC Selective Entry Duplicates - Root Cause Analysis

**Date:** 2026-03-03
**Issue:** 73 duplicate questions found across VIC Selective Entry General Ability sections
**Status:** Identified and analyzed - deletion script ready

---

## Executive Summary

Found **29 duplicate groups** containing **73 duplicate questions** (to be deleted, keeping 29 originals) in VIC Selective Entry General Ability - Quantitative and Verbal sections. The root cause is **NOT a failure of duplicate detection**, but rather a **timing-based gap** in how questions are generated across different test modes (practice_1, practice_2, etc.).

### Key Finding
The duplicate detection system **DOES work correctly** within a single mode generation session, but duplicates occur when:
1. Multiple test modes are generated in **separate script executions**
2. Questions from practice_1 are not loaded when generating practice_2
3. The `crossModeDiversity` flag is not consistently used

---

## Duplicate Statistics

### General Ability - Quantitative
- **16 duplicate groups** found
- Largest duplicate: **14 copies** of the same question ("5 10 15 / 7 12 17 / 9 14 ?")
- Notable patterns:
  - "48 42 36 / 44 38 32 / 40 34 ?" appeared **13 times**
  - "5 10 15 / 8 13 18 / 11 16 ?" appeared **6 times** (example from user)
  - Time between duplicates: **789s average** (13 minutes) - indicates separate generation sessions

### General Ability - Verbal
- **13 duplicate groups** found
- Most duplicates: **5 copies** of "Which word is the odd one out"
- Pattern: Vocabulary and synonym questions being regenerated across modes

### Timing Evidence
- Most duplicates created **10-60 minutes apart** (average 700-2800 seconds)
- Some drill mode duplicates created **13-135 seconds apart** (race conditions in drill generation)
- This timing pattern indicates:
  - Different generation script runs (NOT parallel within same run)
  - Sequential mode generation without cross-mode checking

---

## Root Cause Analysis

### What Happened

#### 1. **Script Execution Pattern** (Primary Cause)
The generation scripts were likely run separately for each mode:
```bash
# This is what likely happened:
npm run generate:vic-selective:practice_1
# ... questions stored to DB
npm run generate:vic-selective:practice_2
# ... questions stored to DB (without checking practice_1)
npm run generate:vic-selective:practice_3
# ... more duplicates created
```

Each script run:
- ✅ Checked for duplicates **within its own mode**
- ❌ Did NOT check for duplicates **across other modes**

#### 2. **Generator Configuration Gap**
In `generator.ts:69-76`, the code has this option:
```typescript
const testModeForDiversity = options.crossModeDiversity ? null : request.testMode;
const recentQuestions = await getRecentQuestionsForSubSkill(
  request.testType,
  request.section,
  request.subSkill,
  testModeForDiversity,  // <-- If this is 'practice_2', only loads practice_2 questions
  1000
);
```

**The Issue:**
- When `testModeForDiversity = 'practice_2'`, it only loads questions from practice_2
- It does NOT load questions from practice_1, practice_3, etc.
- So when generating practice_2, the validator never sees practice_1 questions
- Result: Same questions pass duplicate detection in each mode

#### 3. **Validator Logic is Correct**
The validator in `validator.ts:618-736` works perfectly:
- Fast text matching for exact duplicates  ✅
- Number-based duplicate detection for maths ✅
- Word-based duplicate detection for verbal ✅
- Haiku LLM fallback for edge cases ✅

**BUT** it can only check against the questions it's given in `recentQuestions`.

### Why the Duplicate Detection Didn't Catch Them

```
Generation Flow:
1. Generate practice_1 questions
   → Validator sees: []
   → Stores: [Q1, Q2, Q3...]

2. Generate practice_2 questions (separate run)
   → Validator sees: [] (if crossModeDiversity = false)
   → Stores: [Q1, Q2, Q3...] again! ❌

3. Generate practice_3 questions (separate run)
   → Validator sees: [] (if crossModeDiversity = false)
   → Stores: [Q1, Q2, Q3...] again! ❌
```

### Evidence Supporting This Theory

1. **Time Gaps:**
   - 789-2800s average between duplicates (13-47 minutes)
   - This matches separate script runs, not parallel generation

2. **Duplicate Patterns:**
   - Same questions appear across practice_1, practice_2, practice_3, practice_4, practice_5
   - Each mode got "fresh" generation without seeing other modes

3. **Drill Mode Race Conditions:**
   - Some drill questions have 13-135s gaps
   - These might be true race conditions (parallel generation within drill)

4. **No Random Variation:**
   - If LLM was generating independently with diversity context, we'd see MORE variation
   - The fact that IDENTICAL questions appear suggests insufficient diversity context

---

## What Should Have Happened

### Correct Generation Approach

#### Option A: Cross-Mode Diversity (Recommended)
```typescript
await generateQuestionV2(request, {
  crossModeDiversity: true,  // ✅ Loads questions from ALL modes
  strictValidation: true
});
```

This ensures that when generating practice_2, the validator sees practice_1 questions.

#### Option B: Sequential with Cross-Mode Checking
```typescript
// Generate all modes in ONE script run
for (const mode of ['practice_1', 'practice_2', 'practice_3']) {
  await generateSectionQuestions(testType, section, mode, {
    crossModeDiversity: true
  });
}
```

#### Option C: Database-Level Unique Constraint (Strongest)
```sql
-- Add constraint to prevent duplicates at DB level
ALTER TABLE questions_v2
ADD CONSTRAINT unique_question_fingerprint
UNIQUE (test_type, section_name, question_fingerprint);
```

---

## Detection Gap: Why Manual Audit Was Needed

The v2 engine has duplicate detection, but it relies on the **caller** to:
1. Set `crossModeDiversity: true` for cross-mode checking
2. Run all modes in a single script session
3. Ensure recent questions are properly loaded

**There is NO database-level constraint** preventing duplicates if:
- Scripts are run separately
- `crossModeDiversity` flag is not set
- Race conditions occur in parallel generation

---

## Fixes Applied

### 1. **Audit Script Created**
- `/scripts/audit-vic-selective-general-ability-duplicates.ts`
- Identifies all duplicate groups
- Generates detailed JSON report
- Creates SQL deletion script

### 2. **Deletion Script Ready**
- `/delete-vic-selective-duplicates.sql`
- Backs up 73 duplicate questions before deletion
- Deletes duplicates (keeps oldest copy)
- Verifies no duplicates remain

### 3. **Root Cause Documented**
- This file provides complete analysis
- Explains why duplicates occurred despite duplicate detection
- Provides multiple fix options

---

## Recommended Permanent Fixes

### Immediate (Quick Wins)

1. **Update Generation Scripts**
   ```typescript
   // In all generation scripts, add:
   const options = {
     crossModeDiversity: true,  // ✅ Load from ALL modes
     strictValidation: true
   };
   ```

2. **Run All Modes Sequentially**
   ```typescript
   // Generate all modes in ONE script execution
   for (const mode of ALL_MODES) {
     await generateSection(testType, section, mode, { crossModeDiversity: true });
   }
   ```

### Medium Term (Robust)

3. **Add Database Constraint**
   ```sql
   -- Create fingerprint function
   CREATE OR REPLACE FUNCTION generate_question_fingerprint(
     p_question_text TEXT,
     p_answer_options JSONB,
     p_correct_answer TEXT
   ) RETURNS TEXT AS $$
   BEGIN
     RETURN md5(
       LOWER(REGEXP_REPLACE(p_question_text, '\s+', ' ', 'g')) ||
       p_answer_options::text ||
       LOWER(p_correct_answer)
     );
   END;
   $$ LANGUAGE plpgsql IMMUTABLE;

   -- Add computed column
   ALTER TABLE questions_v2
   ADD COLUMN question_fingerprint TEXT
   GENERATED ALWAYS AS (
     generate_question_fingerprint(question_text, answer_options, correct_answer)
   ) STORED;

   -- Add unique constraint
   CREATE UNIQUE INDEX idx_unique_question_per_test
   ON questions_v2 (test_type, section_name, question_fingerprint);
   ```

4. **Add Retry with Exponential Backoff**
   ```typescript
   // On duplicate insert error, retry with different generation
   try {
     await storeQuestionV2(question);
   } catch (err) {
     if (isDuplicateError(err)) {
       console.log('Duplicate detected at DB level, regenerating...');
       // Retry with more diversity
     }
   }
   ```

### Long Term (Best Practice)

5. **Two-Phase Commit Pattern**
   ```typescript
   // Phase 1: Check + Lock
   const lock = await acquireDuplicateLock(testType, section, questionFingerprint);

   try {
     // Phase 2: Insert if lock acquired
     await storeQuestionV2(question);
   } finally {
     await releaseLock(lock);
   }
   ```

6. **Generation Coordinator Service**
   - Central service that coordinates all generation across modes
   - Ensures cross-mode diversity automatically
   - Prevents race conditions through centralized queue

---

## Prevention Checklist

Before running question generation:

- [ ] Set `crossModeDiversity: true` in options
- [ ] Generate all modes in ONE script execution (not separate runs)
- [ ] Use latest duplicate detection code (v2 validator)
- [ ] Check database connection before generation
- [ ] Monitor generation logs for duplicate warnings
- [ ] Run post-generation audit to verify no duplicates

After generation:

- [ ] Run duplicate audit script
- [ ] Verify question counts match expected targets
- [ ] Check generation report for quality scores
- [ ] Review any validation failures

---

## SQL Execution Instructions

### Step 1: Review Report
```bash
# Open the detailed JSON report
cat vic-selective-duplicates-report.json | jq '.summary'
```

### Step 2: Execute Deletion (When Ready)
```bash
# Execute the SQL script
psql $DATABASE_URL < delete-vic-selective-duplicates.sql

# OR with Supabase CLI:
cat delete-vic-selective-duplicates.sql | npx supabase db query
```

### Step 3: Verify
```bash
# Run audit again to confirm zero duplicates
npx tsx scripts/audit-vic-selective-general-ability-duplicates.ts
```

---

## Related Files

- **Audit Script:** `scripts/audit-vic-selective-general-ability-duplicates.ts`
- **Deletion SQL:** `delete-vic-selective-duplicates.sql`
- **Detailed Report:** `vic-selective-duplicates-report.json`
- **Validator Code:** `src/engines/questionGeneration/v2/validator.ts:618-736`
- **Generator Code:** `src/engines/questionGeneration/v2/generator.ts:69-76`
- **Storage Code:** `src/engines/questionGeneration/v2/supabaseStorage.ts:487-531`

---

## Conclusion

The duplicate detection system is **working as designed**, but it has a **usage gap**:

✅ **What works:**
- Duplicate detection within a single mode
- Fast text matching for exact duplicates
- Number/word-based duplicate detection
- LLM-based validation for edge cases

❌ **What doesn't work:**
- Cross-mode duplicate prevention when modes generated separately
- No database-level constraint to enforce uniqueness
- No centralized generation coordinator

**Solution:** Use `crossModeDiversity: true` and generate all modes in one script execution, or add database-level unique constraints.

---

**Next Actions:**
1. ✅ Audit complete (this document)
2. ⏳ Review SQL script
3. ⏳ Execute deletion
4. ⏳ Update generation scripts with `crossModeDiversity: true`
5. ⏳ Consider adding database constraint
