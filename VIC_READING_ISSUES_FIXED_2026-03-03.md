# VIC Selective Entry Reading Reasoning - Issues Fixed (2026-03-03)

## Summary

Fixed two major issues with VIC Selective Entry Reading Reasoning questions in the `questions_v2` table:

1. **Embedded Passages**: Questions had passages embedded in `question_text` instead of stored separately
2. **Duplicate Questions**: Multiple identical questions (109 duplicates found)

## Issues Found

### Issue 1: Embedded Passages in question_text

**Problem**: 54 questions had the full passage text embedded in the `question_text` field instead of being stored separately in `passages_v2`.

**Characteristics of affected questions**:
- `passage_id: null` (should have a passage_id)
- `sub_skill: null` (should have a sub-skill)
- Question text started with "Read the following passage:" or "Read this passage:"
- The passage was duplicated - once on the left side (from passage_id) and again in question_text on the right

**Example**:
```
Question text: "Read the following passage:\n\n\"The archaeologist carefully excavated the site, removing layers of soil with painstaking precision. Each artifact was documented before being extracted, ensuring that no contextual information would be lost. The meticulous work took months, but it was essential for understanding the ancient civilization.\"\n\nWhat does \"meticulous\" mean in this context?"
```

**Root Cause**: These questions were generated incorrectly, likely from an early version of the generation engine or a misconfiguration. They bypassed the normal passage storage mechanism.

### Issue 2: Duplicate Questions

**Problem**: 109 duplicate questions across 44 duplicate groups were found. Some groups had up to 36 identical copies!

**Examples of duplicates**:
- 36 copies of "What is the main idea of this passage?"
- 7 copies of "Which sentence is grammatically correct?"
- 7 copies of "Which sentence uses punctuation correctly?"
- Multiple vocabulary questions asking about the same word (e.g., "meticulous", "undeterred", "obsolete")

**Root Cause**: The duplicate detection system was unable to detect these duplicates because:

1. **Embedded passage questions had `sub_skill: null`**
   - The duplicate detection fetches recent questions by filtering on `sub_skill`
   - Questions with `sub_skill: null` were never fetched for comparison
   - Therefore, they were never checked for duplicates

2. **Questions with `passage_id: null`**
   - For reading questions, the duplicate detection tries to compare passage IDs
   - When both questions have `passage_id: null`, it falls back to content comparison
   - However, since they weren't in the comparison set (due to null sub_skill), they were never compared

## Fix Applied

### Step 1: Audit Script Created
Created `scripts/audit-vic-reading-issues.ts` to identify:
- Questions with embedded passages
- Duplicate questions using normalized text comparison

### Step 2: Deletions Performed
1. **Deleted 109 duplicate questions** (kept one copy from each duplicate group)
2. **Deleted 54 malformed questions** with embedded passages
3. **Total: 163 questions removed**

### Step 3: Verification
Re-ran audit script to confirm:
- 0 questions with embedded passages
- 0 duplicate questions
- Total VIC Reading questions: 333 (down from 496)

## Question Count Impact

**Before**: 496 questions
**After**: 333 questions
**Removed**: 163 questions (109 duplicates + 54 malformed)

The question count reduction is expected and correct. The generation engine can now be run to regenerate questions for sub-skills that are below target.

## Why This Happened

The duplicate detection system in `src/engines/questionGeneration/v2/validator.ts` works correctly BUT:

1. It only compares against questions with the SAME `sub_skill`
2. Malformed questions with `sub_skill: null` were never included in comparisons
3. The duplicate detection couldn't detect duplicates it never saw

This is similar to having a security guard checking IDs at a door, but there's a side entrance with no guard. The malformed questions came in through the "side entrance" (null sub_skill) and bypassed the duplicate detection entirely.

## Prevention

To prevent this from happening again:

1. **Validation Improvement**: The generation engine should reject any question where:
   - Reading question has `passage_id: null` (except for drill mode)
   - Any question has `sub_skill: null`
   - Question text contains "Read the following passage:" (passage should be separate)

2. **Database Constraint**: Consider adding a CHECK constraint to `questions_v2`:
   ```sql
   ALTER TABLE questions_v2 ADD CONSTRAINT check_reading_has_passage
   CHECK (
     section_name NOT LIKE '%Reading%' OR
     passage_id IS NOT NULL OR
     test_mode = 'drill'
   );

   ALTER TABLE questions_v2 ADD CONSTRAINT check_sub_skill_not_null
   CHECK (sub_skill IS NOT NULL);
   ```

3. **Periodic Audits**: Run the audit script regularly to catch any similar issues early:
   ```bash
   npx tsx scripts/audit-vic-reading-issues.ts
   ```

## Files Created

- `scripts/audit-vic-reading-issues.ts` - Audit script to detect issues
- `scripts/fix-vic-reading-issues.ts` - Fix script to delete problematic questions
- `vic-reading-issues-report.json` - Detailed audit report

## Next Steps

1. The generation engine can now be used to regenerate questions for affected sub-skills
2. Consider implementing the prevention measures above
3. Run similar audits on other test types to ensure this issue is unique to VIC Reading

## Technical Details

### Duplicate Detection Logic

The duplicate detection in `validator.ts` works as follows:

1. **Fetch recent questions** using `getRecentQuestionsForSubSkill()`
   - Filters by `test_type`, `section_name`, and `sub_skill`
   - Returns up to 1000 recent questions

2. **Fast check**: Exact text matching
   - For reading questions: Checks if `passage_id` matches
   - If different passages → NOT duplicate
   - If same passage → continues to check question text

3. **Slow check**: LLM-based semantic comparison
   - Uses Haiku to compare question intent
   - Different rules for maths/verbal/reading/writing sections

### Why Sub-skill Null Bypassed Detection

```typescript
// In supabaseStorage.ts:487
export async function getRecentQuestionsForSubSkill(
  testType: string,
  sectionName: string,
  subSkill: string,  // ← This parameter is required and used in .eq() filter
  testMode: string | null = null,
  limit: number = 10
) {
  let query = supabase
    .from('questions_v2')
    .select('...')
    .eq('test_type', testType)
    .eq('section_name', sectionName)
    .eq('sub_skill', subSkill);  // ← Questions with sub_skill=null don't match

  // ...
}
```

When generating a new question with `sub_skill: "Context & Inference"`, the system fetches all recent questions with that EXACT sub_skill. Questions with `sub_skill: null` are excluded from the comparison set, so they're never checked for duplicates.

---

**Status**: ✅ All issues resolved
**Questions removed**: 163
**Questions remaining**: 333
**Duplicate groups eliminated**: 44
