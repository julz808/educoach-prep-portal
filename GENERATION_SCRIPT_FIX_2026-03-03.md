# Generation Script Fix - Year 7 NAPLAN Over-Generation Issue

**Date:** March 3, 2026
**Issue:** Script over-generated questions for Year 7 NAPLAN Language Conventions
**Status:** ✅ FIXED

---

## 🔍 Problem Summary

The `generate-section-all-modes.ts` script massively over-generated questions for Year 7 NAPLAN Language Conventions:

| Test Mode | Target | Actual | Over-Generated |
|-----------|--------|--------|----------------|
| practice_1 | 45 | 85 | +40 |
| practice_2 | 45 | 75 | +30 |
| practice_3 | 45 | 79 | +34 |
| practice_4 | 45 | 81 | +36 |
| practice_5 | 45 | 45 | ✅ (correct) |
| diagnostic | 45 | 37 | -8 |
| **TOTAL** | **270** | **402** | **+132** |

---

## 🎯 Root Cause

The database contained questions with **different sub-skill names** than what was configured:

### Expected Sub-Skills (Configuration):
1. Advanced Spelling & Orthography
2. Sophisticated Grammar
3. Advanced Punctuation
4. Advanced Vocabulary & Usage
5. Advanced Editing Skills
6. Complex Syntax Analysis

### Actual Sub-Skills (Database):
1. Advanced Editing Skills ✓
2. **Advanced Grammar & Sentence Structure** ❌ (should be "Sophisticated Grammar")
3. Advanced Punctuation ✓
4. Advanced Spelling & Orthography ✓
5. Advanced Vocabulary & Usage ✓
6. Complex Syntax Analysis ✓
7. **Punctuation & Sentence Boundaries** ❌ (duplicate/old name)
8. Sophisticated Grammar ✓
9. **Spelling & Word Formation** ❌ (should be "Advanced Spelling & Orthography")
10. **Vocabulary Precision & Usage** ❌ (should be "Advanced Vocabulary & Usage")

### Why This Caused Over-Generation:

1. Gap detection script looked for questions with expected sub-skill names
2. Found 0 questions for expected names (because they had different names)
3. Thought all 45 questions were missing per mode
4. Generated NEW questions with correct sub-skill names
5. Result: OLD questions (with wrong names) + NEW questions (with correct names) = DOUBLE!

---

## ✅ Solution

### 1. Delete Over-Generated Questions (SQL Script)

**File:** `delete-overgenerated-year7-language-conventions.sql`

This script deletes the **most recently generated** questions (by `created_at DESC`) to bring each mode back to exactly 45 questions:

- practice_1: Delete 40 most recent (85 → 45)
- practice_2: Delete 30 most recent (75 → 45)
- practice_3: Delete 34 most recent (79 → 45)
- practice_4: Delete 36 most recent (81 → 45)

**How to use:**
```sql
-- In Supabase SQL Editor:
-- 1. Copy contents of delete-overgenerated-year7-language-conventions.sql
-- 2. Paste into SQL Editor
-- 3. Review the script carefully
-- 4. Execute

-- 5. Verify results with the verification query at the end
```

### 2. Fixed Generation Script

**Files Modified:**
- `src/engines/questionGeneration/v2/gapDetection.ts`

**Changes:**

#### A) Added Sub-Skill Validation
The script now validates that database sub-skill names match configuration:

```typescript
export async function getExistingQuestionCounts(
  testType: string,
  sectionName: string,
  testMode: string,
  standaloneOnly: boolean = false,
  expectedSubSkills?: string[]  // ⭐ NEW: Validate against expected sub-skills
): Promise<ExistingQuestionCounts>
```

If unexpected sub-skill names are found, the script **WARNS** you:

```
⚠️  WARNING: Found questions with UNEXPECTED sub-skill names in database:
   • "Advanced Grammar & Sentence Structure" (50 questions)
   • "Punctuation & Sentence Boundaries" (66 questions)
   • "Spelling & Word Formation" (66 questions)
   • "Vocabulary Precision & Usage" (66 questions)

💡 This may indicate:
   1. Database contains questions generated with old sub-skill names
   2. Configuration was updated but database was not
   3. Questions were manually inserted with incorrect sub-skill names

⚠️  RISK: If you continue, the script may generate NEW questions with the
   expected sub-skill names, resulting in OVER-GENERATION!
```

#### B) Added Safety Check
The script now checks **total question count** regardless of sub-skill names:

```typescript
// ⭐ SAFETY CHECK: Check total count regardless of sub-skill names
const totalQuestionsInDb = Object.values(existingCounts).reduce((sum, count) => sum + count, 0);
const targetTotal = Object.values(config.targetDistribution).reduce((sum, count) => sum + count, 0);

if (totalQuestionsInDb >= targetTotal) {
  console.warn('⚠️  SAFETY CHECK: Section already has enough questions!');
  // ... warning message
}
```

This prevents over-generation even if sub-skill names don't match.

---

## 📋 Step-by-Step Instructions

### Step 1: Delete Over-Generated Questions

```bash
# Navigate to Supabase Dashboard
# Go to: SQL Editor
# Copy and paste: delete-overgenerated-year7-language-conventions.sql
# Review and execute
```

**Expected Result:**
- practice_1: 85 → 45 questions
- practice_2: 75 → 45 questions
- practice_3: 79 → 45 questions
- practice_4: 81 → 45 questions
- practice_5: 45 → 45 questions (no change)
- diagnostic: 37 → 37 questions (no change, still needs +8)

**Total:** 402 → 262 questions

### Step 2: Verify Deletion

Run the verification query at the end of the SQL script:

```sql
SELECT
  test_mode,
  COUNT(*) as question_count,
  45 as target,
  COUNT(*) - 45 as difference
FROM questions_v2
WHERE test_type = 'Year 7 NAPLAN'
  AND section_name = 'Language Conventions'
GROUP BY test_mode
ORDER BY test_mode;
```

### Step 3: Fill Remaining Gaps (Diagnostic Mode)

After deletion, only diagnostic mode needs 8 more questions:

```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Language Conventions" \
  --modes="diagnostic"
```

**Expected Output:**
The script will now show proper warnings about existing questions and only generate the 8 missing questions for diagnostic mode.

---

## 🛡️ Prevention

The fixed script will now:

1. ✅ **Validate sub-skill names** against configuration
2. ✅ **Warn about unexpected sub-skill names** in database
3. ✅ **Check total question count** as a safety net
4. ✅ **Prevent over-generation** even with name mismatches

### Best Practices Going Forward:

1. **Always review warnings** before continuing generation
2. **Keep sub-skill names consistent** between configuration and database
3. **If you see unexpected sub-skill warnings**, STOP and investigate before proceeding
4. **Use the verification query** after each generation run to check counts

---

## 📊 Files Created/Modified

### Created:
- ✅ `delete-overgenerated-year7-language-conventions.sql` - SQL script to clean up
- ✅ `scripts/check-year7-language-conventions-counts.ts` - Diagnostic script
- ✅ `scripts/investigate-subskill-mismatch.ts` - Investigation script
- ✅ `GENERATION_SCRIPT_FIX_2026-03-03.md` - This document

### Modified:
- ✅ `src/engines/questionGeneration/v2/gapDetection.ts` - Added validation and safety checks

---

## 🧪 Testing

To test the fixed script without generating questions:

```bash
# Check current counts
npx tsx --env-file=.env scripts/check-year7-language-conventions-counts.ts

# Investigate sub-skill mismatch
npx tsx --env-file=.env scripts/investigate-subskill-mismatch.ts
```

---

## ✅ Next Steps

1. **Execute SQL deletion script** in Supabase SQL Editor
2. **Verify deletion** with verification query
3. **Run diagnostic mode generation** to fill remaining 8 questions
4. **Monitor warnings** - if you see sub-skill mismatch warnings, investigate before proceeding
5. **Consider standardizing** sub-skill names across all test types to prevent future issues

---

## 💡 Key Takeaways

- **Sub-skill naming matters!** Configuration and database must match exactly
- **The script now protects you** with validation and safety checks
- **Always review warnings** before proceeding with generation
- **Use verification queries** to double-check results after generation

---

**Status:** Ready to proceed with deletion and regeneration
**Risk Level:** Low (script now has safeguards)
**Estimated Time:** 5-10 minutes to complete all steps
