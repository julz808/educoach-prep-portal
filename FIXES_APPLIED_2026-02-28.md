# Test Times & Configuration Fixes Applied
**Date:** 2026-02-28
**Status:** ✅ COMPLETED

## Summary

Fixed all test timing issues and established `sectionConfigurations.ts` (V2) as the single source of truth for test times, question counts, and section structures across the platform.

---

## Changes Applied

### 1. Fixed Time Discrepancies

#### NSW Selective Entry (Year 7)
- **Reading Section**
  - Changed: 40 minutes → **45 minutes**
  - Reason: Official NSW test specifies 45 minutes
  - Files updated: `sectionConfigurations.ts`, `curriculumData.ts`

#### ACER Scholarship (Year 7 Entry)
- **Humanities Section**
  - Changed: 47 minutes → **40 minutes**
  - Reason: Official ACER test specifies 40 minutes
  - Files updated: `sectionConfigurations.ts`, `curriculumData.ts`

- **Mathematics Section**
  - Changed: 47 minutes → **40 minutes**
  - Reason: Official ACER test specifies 40 minutes
  - Files updated: `sectionConfigurations.ts`, `curriculumData.ts`

- **Written Expression Section**
  - Changed: 40 minutes → **25 minutes**
  - Note: Generates 2 prompts, student chooses 1 to write for 25 minutes
  - Changed: 1 question → **2 questions** (for clarity in config)
  - Reason: Official ACER test specifies 25 minutes per essay
  - Files updated: `sectionConfigurations.ts`, `curriculumData.ts`

#### Year 5 NAPLAN
- **Numeracy Section**
  - Fixed: Removed incorrect split into "No Calculator" (25 min) + "Calculator" (25 min)
  - Correct: Single "Numeracy" section with 50 questions in 50 minutes
  - Reason: Year 5 NAPLAN has NO calculator/non-calculator split (unlike Year 7)
  - Files updated: `curriculumData.ts`
  - Note: `sectionConfigurations.ts` already had the correct structure

---

### 2. Architectural Changes

#### Made V2 sectionConfigurations.ts the Source of Truth

**File:** `src/utils/timeUtils.ts`

**Updated Functions:**
1. `getUnifiedTimeLimit()` - Now prioritizes V2, falls back to V1
2. `getSectionQuestionCount()` - Now prioritizes V2, falls back to V1

**Implementation:**
```typescript
// PRIORITY 1: Try V2 sectionConfigurations (SOURCE OF TRUTH)
const sectionConfig = getSectionConfig(testType, sectionName);
if (sectionConfig && sectionConfig.time_limit_minutes) {
  return sectionConfig.time_limit_minutes;
}

// PRIORITY 2: Fall back to V1 curriculumData for backward compatibility
// ... existing V1 logic ...
```

**Benefits:**
- Single source of truth for all time limits
- V2 configurations now control the UI
- V1 still available as fallback for any legacy code paths
- Clear console logging shows which source is being used

---

### 3. Verified Section Name Alignment

**Confirmed all section names match between:**
- `curriculumData_v2/*.ts` (curriculum files)
- `sectionConfigurations.ts` (V2 configurations)
- `curriculumData.ts` (V1 legacy file)

**Section Names by Product:**

**Year 5 NAPLAN:**
- Year 5 NAPLAN - Writing
- Year 5 NAPLAN - Reading
- Year 5 NAPLAN - Language Conventions
- Year 5 NAPLAN - Numeracy

**Year 7 NAPLAN:**
- Year 7 NAPLAN - Writing
- Year 7 NAPLAN - Reading
- Year 7 NAPLAN - Language Conventions
- Year 7 NAPLAN - Numeracy No Calculator
- Year 7 NAPLAN - Numeracy Calculator

**ACER Scholarship (Year 7 Entry):**
- ACER Scholarship (Year 7 Entry) - Mathematics
- ACER Scholarship (Year 7 Entry) - Humanities
- ACER Scholarship (Year 7 Entry) - Written Expression

**EduTest Scholarship (Year 7 Entry):**
- EduTest Scholarship (Year 7 Entry) - Verbal Reasoning
- EduTest Scholarship (Year 7 Entry) - Numerical Reasoning
- EduTest Scholarship (Year 7 Entry) - Reading Comprehension
- EduTest Scholarship (Year 7 Entry) - Mathematics
- EduTest Scholarship (Year 7 Entry) - Written Expression

**NSW Selective Entry (Year 7 Entry):**
- NSW Selective Entry (Year 7 Entry) - Reading
- NSW Selective Entry (Year 7 Entry) - Mathematical Reasoning
- NSW Selective Entry (Year 7 Entry) - Thinking Skills
- NSW Selective Entry (Year 7 Entry) - Writing

**VIC Selective Entry (Year 9 Entry):**
- VIC Selective Entry (Year 9 Entry) - Reading Reasoning
- VIC Selective Entry (Year 9 Entry) - Mathematics Reasoning
- VIC Selective Entry (Year 9 Entry) - General Ability - Verbal
- VIC Selective Entry (Year 9 Entry) - General Ability - Quantitative
- VIC Selective Entry (Year 9 Entry) - Writing

---

## Files Modified

1. **`src/data/curriculumData_v2/sectionConfigurations.ts`**
   - Updated NSW Selective Reading: 40 → 45 min
   - Updated ACER Humanities: 47 → 40 min
   - Updated ACER Mathematics: 47 → 40 min
   - Updated ACER Written Expression: 40 → 25 min

2. **`src/data/curriculumData.ts`**
   - Fixed Year 5 NAPLAN Numeracy structure (removed split, added single section)
   - Updated NSW Selective Reading: 40 → 45 min
   - Updated ACER Humanities: 47 → 40 min
   - Updated ACER Mathematics: 47 → 40 min
   - Updated ACER Written Expression: 1 → 2 questions, kept 25 min

3. **`src/utils/timeUtils.ts`**
   - Updated `getUnifiedTimeLimit()` to use V2 as source of truth
   - Updated `getSectionQuestionCount()` to use V2 as source of truth
   - Added comprehensive logging for debugging
   - Maintained V1 fallback for backward compatibility

---

## Testing Results

✅ **TypeScript Compilation:** No errors
✅ **Section Names:** All aligned across V1 and V2
✅ **Time Limits:** All match official specifications
✅ **Backward Compatibility:** V1 fallback works correctly

---

## What This Fixes

### User-Reported Issue
- ✅ NAPLAN Year 5 Numeracy now shows **50 minutes** (single test)
- ✅ No longer incorrectly split into two 25-minute sections

### Additional Issues Found
- ✅ NSW Selective Reading now shows correct **45 minutes** (was 40)
- ✅ ACER Humanities now shows correct **40 minutes** (was 47)
- ✅ ACER Mathematics now shows correct **40 minutes** (was 47)
- ✅ ACER Written Expression now shows correct **25 minutes** (was 40)

### Architectural Improvement
- ✅ V2 `sectionConfigurations.ts` is now the source of truth
- ✅ UI loads times from V2 (with V1 fallback)
- ✅ Single authoritative source for all test metadata
- ✅ Clear separation between V1 (legacy) and V2 (current)

---

## Notes for Future Maintenance

### When Adding New Tests or Sections

1. **Update V2 First** (Source of Truth)
   - File: `src/data/curriculumData_v2/sectionConfigurations.ts`
   - Add section configuration with correct times

2. **Update V1 for Compatibility** (Optional but recommended)
   - File: `src/data/curriculumData.ts`
   - Keep in sync with V2 to avoid confusion

3. **Create Curriculum Data**
   - File: `src/data/curriculumData_v2/{test-name}.ts`
   - Define sub-skills and examples

### Data Flow

```
sectionConfigurations.ts (V2)  ← SOURCE OF TRUTH
         ↓
    timeUtils.ts               ← Retrieval layer
         ↓
    UI Components              ← Display layer
         ↓
    (fallback to V1 if needed)
```

### Console Logging

The updated `timeUtils.ts` now provides clear logging:
- ✅ `TIME (V2):` - Successfully loaded from V2
- ⚠️  `TIME FALLBACK:` - Using V1 as fallback
- ❌ `TIME ERROR:` - Section not found in either V1 or V2

Monitor console logs to ensure all sections load from V2.

---

## Verification Steps

To verify the fixes are working:

1. **Check NAPLAN Year 5 Numeracy:**
   - Navigate to Year 5 NAPLAN product
   - Verify "Numeracy" section shows 50 questions in 50 minutes
   - Verify NO "Numeracy No Calculator" or "Numeracy Calculator" sections appear

2. **Check NSW Selective Reading:**
   - Navigate to NSW Selective Entry product
   - Verify "Reading" section shows 45 minutes (not 40)

3. **Check ACER Times:**
   - Navigate to ACER Scholarship product
   - Verify "Humanities" shows 40 minutes (not 47)
   - Verify "Mathematics" shows 40 minutes (not 47)
   - Verify "Written Expression" shows 25 minutes (not 40)

4. **Check Console Logs:**
   - Open browser console during test loading
   - Look for "✅ TIME (V2):" messages
   - Should NOT see many "⚠️ TIME FALLBACK:" messages

---

## Status: ✅ COMPLETE

All test times now align with official specifications and V2 is the source of truth!
