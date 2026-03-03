# Year 7 NAPLAN Language Conventions - Generation Fix (Final)

**Date:** March 3, 2026
**Issue:** Script over-generated due to sub-skill name mismatch
**Status:** ✅ FIXED - Ready to execute cleanup

---

## 🎯 Executive Summary

The generation script was counting questions with the **wrong sub-skill names**, thinking they didn't exist, and generating duplicates. The solution is to **delete all questions with OLD sub-skill names** and regenerate with the correct names.

### Current State:
- **Total questions in database:** 598
- **Questions with CORRECT sub-skill names:** 350 (170 practice/diagnostic + 180 drill)
- **Questions with OLD sub-skill names:** 248 (to be deleted)

### After Cleanup:
- **Remaining questions:** 350 (all with correct sub-skill names)
- **Practice & Diagnostic modes:** 170/270 (100 still needed)
- **Drill mode:** 180 (correct, separate from practice/diagnostic)

---

## ✅ Correct Sub-Skill Names (from curriculumData_v2)

These are the ONLY correct sub-skill names:

1. **Advanced Spelling & Orthography**
2. **Sophisticated Grammar**
3. **Advanced Punctuation**
4. **Advanced Vocabulary & Usage**
5. **Advanced Editing Skills**
6. **Complex Syntax Analysis**

---

## ❌ Old Sub-Skill Names (To Be Deleted)

These are INCORRECT and will be deleted:

1. ~~Punctuation & Sentence Boundaries~~ (66 questions)
2. ~~Vocabulary Precision & Usage~~ (66 questions)
3. ~~Advanced Grammar & Sentence Structure~~ (50 questions)
4. ~~Spelling & Word Formation~~ (66 questions)

**Total to delete:** 248 questions

---

## 📊 Current State by Test Mode (Correct Sub-Skills Only)

| Test Mode | Current | Target | Still Needed |
|-----------|---------|--------|--------------|
| practice_1 | 43 | 45 | 2 |
| practice_2 | 41 | 45 | 4 |
| practice_3 | 38 | 45 | 7 |
| practice_4 | 41 | 45 | 4 |
| practice_5 | 7 | 45 | 38 |
| diagnostic | 0 | 45 | 45 |
| **TOTAL** | **170** | **270** | **100** |
| drill | 180 | N/A | (separate) |

---

## 🔧 Solution Steps

### Step 1: Delete Questions with OLD Sub-Skill Names

**File:** `delete-old-subskill-names-year7-language-conventions.sql`

This script deletes ALL questions with the 4 old/incorrect sub-skill names.

**To execute:**
```bash
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy contents of: delete-old-subskill-names-year7-language-conventions.sql
# 3. Paste into SQL Editor
# 4. Review the script
# 5. Execute
# 6. Run verification queries at the end
```

**Expected result:**
- 248 rows deleted
- 350 questions remaining (all with correct sub-skill names)

### Step 2: Verify Deletion

Run the verification queries included in the SQL script:

```sql
-- Check sub-skills (should only show 6 correct ones)
SELECT sub_skill, COUNT(*) as question_count
FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN'
  AND section_name = 'Language Conventions'
GROUP BY sub_skill
ORDER BY sub_skill;
```

**Expected:** Only the 6 CORRECT sub-skill names should appear.

### Step 3: Generate Missing Questions

After deletion, generate the remaining 100 questions:

```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Language Conventions" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**The fixed script will:**
- ✅ Only count questions with CORRECT sub-skill names
- ✅ Warn if it finds unexpected sub-skill names
- ✅ Prevent over-generation with safety checks
- ✅ Generate exactly 100 questions to fill gaps

---

## 🛡️ What Was Fixed

### 1. Sub-Skill Name Validation

**File:** `src/engines/questionGeneration/v2/gapDetection.ts`

Added validation to warn about unexpected sub-skill names:

```typescript
export async function getExistingQuestionCounts(
  testType: string,
  sectionName: string,
  testMode: string,
  standaloneOnly: boolean = false,
  expectedSubSkills?: string[]  // ⭐ NEW: Validates sub-skill names
): Promise<ExistingQuestionCounts>
```

**Output when issues detected:**
```
⚠️  WARNING: Found questions with UNEXPECTED sub-skill names in database:
   • "Punctuation & Sentence Boundaries" (66 questions)
   • "Vocabulary Precision & Usage" (66 questions)

⚠️  RISK: If you continue, the script may generate NEW questions with the
   expected sub-skill names, resulting in OVER-GENERATION!
```

### 2. Total Count Safety Check

Added a safety check that counts ALL questions regardless of sub-skill names:

```typescript
// ⭐ SAFETY CHECK: Check total count regardless of sub-skill names
const totalQuestionsInDb = Object.values(existingCounts).reduce((sum, count) => sum + count, 0);
const targetTotal = Object.values(config.targetDistribution).reduce((sum, count) => sum + count, 0);

if (totalQuestionsInDb >= targetTotal) {
  console.warn('⚠️  SAFETY CHECK: Section already has enough questions!');
}
```

This prevents over-generation even if sub-skill names don't match.

---

## 📋 Diagnostic Scripts Created

### 1. Check Current Counts
```bash
npx tsx --env-file=.env scripts/check-year7-language-conventions-counts.ts
```
Shows detailed counts by mode and sub-skill.

### 2. Identify Sub-Skill Mismatch
```bash
npx tsx --env-file=.env scripts/identify-correct-vs-old-subskills.ts
```
Shows which sub-skills are correct vs old.

### 3. Check Correct Sub-Skills by Mode
```bash
npx tsx --env-file=.env scripts/check-correct-subskills-by-mode.ts
```
Shows counts for ONLY correct sub-skills, excluding old ones.

---

## 🎯 Why This Approach Is Better

**Original Approach:** Delete most recent questions by `created_at`
- ❌ Might delete good questions with correct sub-skill names
- ❌ Leaves questions with wrong sub-skill names in database
- ❌ Could cause same issue again in the future

**New Approach:** Delete questions with old sub-skill names
- ✅ Keeps all questions with correct sub-skill names
- ✅ Removes all questions with incorrect/legacy names
- ✅ Database is clean and aligned with configuration
- ✅ Future generations won't have this problem

---

## 📈 Expected Final State

After completing all steps:

| Component | Status |
|-----------|--------|
| Total Questions | 270 (practice/diagnostic) + 180 (drill) = 450 |
| practice_1 | 45/45 ✅ |
| practice_2 | 45/45 ✅ |
| practice_3 | 45/45 ✅ |
| practice_4 | 45/45 ✅ |
| practice_5 | 45/45 ✅ |
| diagnostic | 45/45 ✅ |
| drill | 180 ✅ |
| Sub-Skill Names | All 6 correct names only ✅ |

---

## 🚀 Quick Start

**Complete process in 3 commands:**

```bash
# 1. Check current state (optional but recommended)
npx tsx --env-file=.env scripts/check-correct-subskills-by-mode.ts

# 2. Run SQL deletion script in Supabase SQL Editor
# (Copy/paste delete-old-subskill-names-year7-language-conventions.sql)

# 3. Generate missing questions
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Language Conventions" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

---

## 📁 Files Reference

### SQL Scripts:
- ✅ `delete-old-subskill-names-year7-language-conventions.sql` - **USE THIS ONE**
- ~~`delete-overgenerated-year7-language-conventions.sql`~~ - Old approach, don't use

### Diagnostic Scripts:
- `scripts/check-year7-language-conventions-counts.ts`
- `scripts/identify-correct-vs-old-subskills.ts`
- `scripts/check-correct-subskills-by-mode.ts`

### Fixed Code:
- `src/engines/questionGeneration/v2/gapDetection.ts`
- `scripts/generation/generate-section-all-modes.ts`

### Documentation:
- `GENERATION_FIX_FINAL_2026-03-03.md` - **This file**
- `GENERATION_SCRIPT_FIX_2026-03-03.md` - Original analysis

---

## ✅ Checklist

Before proceeding:
- [ ] Read this document completely
- [ ] Understand which sub-skills are correct vs old
- [ ] Backup database (optional but recommended)

Execute:
- [ ] Run SQL deletion script in Supabase
- [ ] Verify deletion with verification queries
- [ ] Confirm only 6 correct sub-skill names remain
- [ ] Run generation script to fill gaps
- [ ] Verify final counts: 45 questions per mode (practice/diagnostic)

---

**Ready to proceed!** 🚀

The database will be clean, aligned with configuration, and the generation script has safeguards to prevent this from happening again.
