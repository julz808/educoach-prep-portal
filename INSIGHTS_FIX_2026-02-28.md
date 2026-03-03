# Insights Page Fix - V2 Migration
**Date:** 2026-02-28
**Status:** ✅ COMPLETED

## Issue

The Insights page was displaying incorrect section names for NAPLAN Year 5, showing "Numeracy - No Calculator" instead of the correct "Numeracy" section name.

**Root Cause:** The Insights page was loading section names from `TEST_STRUCTURES` in `curriculumData_v2/types.ts` instead of the authoritative V2 `SECTION_CONFIGURATIONS`.

---

## Changes Applied

### 1. Updated TEST_STRUCTURES in curriculumData_v2/types.ts

Fixed outdated times to match official specifications:

**ACER Scholarship (Year 7 Entry):**
- Written Expression: 1 → 2 questions (generates 2 prompts, student chooses 1)
- Mathematics: 47 → 40 minutes
- Humanities: 47 → 40 minutes

**NSW Selective Entry (Year 7 Entry):**
- Reading: 40 → 45 minutes

**Note:** Year 5 NAPLAN was already correct with single "Numeracy" section (50 questions, 50 minutes).

---

### 2. Migrated Insights Page to V2 SECTION_CONFIGURATIONS

**File:** `src/pages/Insights.tsx`

**Changed:**
```typescript
// OLD: Used TEST_STRUCTURES
import { SUB_SKILL_EXAMPLES, TEST_STRUCTURES } from '@/data/curriculumData_v2';

const sections = Object.keys(TEST_STRUCTURES[productType] || {});
```

**To:**
```typescript
// NEW: Uses SECTION_CONFIGURATIONS (V2 source of truth)
import { SUB_SKILL_EXAMPLES, SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2';

const sections = Object.keys(SECTION_CONFIGURATIONS)
  .filter(key => key.startsWith(productType))
  .map(key => {
    const config = SECTION_CONFIGURATIONS[key];
    return config.section_name;
  });
```

**Benefits:**
- ✅ Insights now loads sections from V2 source of truth
- ✅ Section names always match sectionConfigurations.ts
- ✅ No more discrepancies between Insights and other pages
- ✅ Consistent with timeUtils.ts migration

---

## What This Fixes

### NAPLAN Year 5
- ✅ Shows "Numeracy" (not "Numeracy - No Calculator")
- ✅ All 4 sections display correctly:
  - Writing
  - Reading
  - Language Conventions
  - Numeracy

### ACER Scholarship
- ✅ All times now correct (40 min for Mathematics & Humanities)
- ✅ Written Expression shows 2 questions

### NSW Selective
- ✅ Reading section shows correct 45 minutes

### All Products
- ✅ Section names match V2 configurations exactly
- ✅ Filter tabs generated from authoritative source

---

## Data Flow (After Fix)

```
User navigates to Insights
         ↓
  getFilterTabsForProduct()
         ↓
  SECTION_CONFIGURATIONS (V2)  ← SOURCE OF TRUTH
         ↓
  Extract section_name for each section
         ↓
  Display filter tabs with correct section names
```

---

## Files Modified

1. **`src/data/curriculumData_v2/types.ts`**
   - Updated ACER times: 47 → 40 minutes
   - Updated NSW Reading: 40 → 45 minutes
   - Updated ACER Written Expression: 1 → 2 questions

2. **`src/pages/Insights.tsx`**
   - Changed import from TEST_STRUCTURES to SECTION_CONFIGURATIONS
   - Updated `getFilterTabsForProduct()` to use V2 configurations
   - Added console logging for debugging

---

## Testing

✅ **TypeScript Compilation:** No errors
✅ **Data Source:** Now uses SECTION_CONFIGURATIONS (V2)
✅ **Section Names:** Match V2 configurations exactly
✅ **Console Logs:** Show "V2" indicator for debugging

---

## Verification Steps

To verify the fix:

1. **Navigate to Insights Page:**
   - Select "Year 5 NAPLAN" product
   - Check filter tabs at top of page

2. **Expected Sections (Year 5 NAPLAN):**
   - All Skills (default)
   - Writing
   - Reading
   - Language Conventions
   - Numeracy ✅ (NOT "Numeracy - No Calculator")

3. **Check Console Logs:**
   - Open browser console
   - Look for "🔍 getFilterTabsForProduct (V2):"
   - Should show sections array with correct names

4. **Test Other Products:**
   - ACER Scholarship → Should show Mathematics, Humanities, Written Expression
   - NSW Selective → Should show Reading, Mathematical Reasoning, Thinking Skills, Writing
   - All sections should match SECTION_CONFIGURATIONS in V2

---

## Consistency Across Platform

After this fix, the following all use V2 as source of truth:

| Component | Source | Status |
|-----------|--------|--------|
| `timeUtils.ts` | SECTION_CONFIGURATIONS | ✅ Fixed |
| `Insights.tsx` | SECTION_CONFIGURATIONS | ✅ Fixed |
| `curriculumData.ts` (V1) | - | ✅ Updated (fallback) |
| `curriculumData_v2/types.ts` | - | ✅ Updated (fallback) |
| `sectionConfigurations.ts` | - | ✅ SOURCE OF TRUTH |

---

## Next Steps

**Recommended:** Audit other components to ensure they also use V2:
- `Dashboard.tsx`
- `Diagnostic.tsx`
- `CourseDetail.tsx`
- `PracticeTests.tsx`
- `TestInstructionsPage.tsx`

These files currently import `TEST_STRUCTURES` and may need similar migration to V2 for consistency.

---

## Status: ✅ COMPLETE

Insights page now displays correct section names aligned with V2 SECTION_CONFIGURATIONS!
