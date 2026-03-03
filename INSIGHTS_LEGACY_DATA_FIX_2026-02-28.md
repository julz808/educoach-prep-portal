# Insights Legacy Data Fix - Complete
**Date:** 2026-02-28
**Status:** ✅ COMPLETED

## Issue

The Insights page was still showing "Numeracy No Calculator" for Year 5 NAPLAN despite earlier fixes, because:

1. The database contains **legacy data** with old section names ("Numeracy No Calculator", "Numeracy Calculator")
2. The analytics service needed to **map** these old names to the new "Numeracy" section
3. After mapping, sections with the same name needed to be **aggregated** (combined)

## Root Cause

The issue occurred in three layers:

### Layer 1: Database (Legacy Data)
- Old test sessions stored with section_name = "Numeracy No Calculator"
- Old test sessions stored with section_name = "Numeracy Calculator"
- These cannot be easily migrated without risking data loss

### Layer 2: Analytics Service Mapping (FIXED)
- `analyticsService.ts` line 60-71 had mapping for Year 5 NAPLAN
- But it was mapping TO the old names instead of FROM them
- **Fixed:** Now maps FROM old names → TO new "Numeracy" name

### Layer 3: Section Aggregation (ADDED)
- Even after mapping, multiple sessions with different old names would show as separate sections
- **Added:** Aggregation logic to combine sections with same mapped name

---

## Changes Applied

### 1. Updated Section Name Mapping (analyticsService.ts)

**File:** `src/services/analyticsService.ts` (lines 60-73)

**Before:**
```typescript
'Year 5 NAPLAN': {
  'Numeracy No Calculator': 'Numeracy No Calculator',  // ❌ Kept old name
  'Numeracy Calculator': 'Numeracy Calculator',        // ❌ Kept old name
  // ...
}
```

**After:**
```typescript
'Year 5 NAPLAN': {
  // Map old section names to new V2 structure
  'Numeracy No Calculator': 'Numeracy',  // ✅ Map to single section
  'Numeracy Calculator': 'Numeracy',     // ✅ Map to single section
  'Mathematics Reasoning': 'Numeracy',   // Legacy mapping
  'General Ability - Quantitative': 'Numeracy',  // Legacy mapping
  // Keep correct V2 names as-is
  'Numeracy': 'Numeracy',  // V2 correct name
  // ...
}
```

### 2. Added Section Aggregation Logic

Added aggregation in THREE places where section breakdown is created:

#### A. Diagnostic Analytics (Main Function)
**Location:** Lines 428-470

**Logic:**
```typescript
// BEFORE: Multiple sections with same name after mapping
rawSectionBreakdown = [
  { sectionName: "Numeracy", correct: 3, total: 5, attempted: 5 },
  { sectionName: "Numeracy", correct: 2, total: 3, attempted: 3 }
]

// AFTER: Aggregated into single section
sectionBreakdown = [
  { sectionName: "Numeracy", correct: 5, total: 8, attempted: 8, score: 63%, accuracy: 63% }
]
```

#### B. Diagnostic Analytics (Session-Based)
**Location:** Lines 1627-1669

Same aggregation logic applied to session-based diagnostic analytics.

#### C. Practice Test Analytics
**Location:** Lines 647-685

Same aggregation logic applied to practice test analytics.

---

## How It Works

### Data Flow (After Fix)

```
1. Database Query
   ↓
   section_name = "Numeracy No Calculator" (legacy data)
   section_name = "Numeracy Calculator" (legacy data)
   ↓
2. Mapping Function (mapSectionNameToCurriculum)
   ↓
   "Numeracy No Calculator" → "Numeracy"
   "Numeracy Calculator" → "Numeracy"
   ↓
3. Aggregation Logic (NEW)
   ↓
   Combine:
   - questionsCorrect: 3 + 2 = 5
   - questionsTotal: 5 + 3 = 8
   - questionsAttempted: 5 + 3 = 8
   ↓
4. Calculate Final Stats
   ↓
   score = (5/8) × 100 = 63%
   accuracy = (5/8) × 100 = 63%
   ↓
5. Display in Insights
   ✅ Shows single "Numeracy" section
```

---

## Technical Details

### Aggregation Algorithm

```typescript
// 1. Create aggregation map
const sectionAggregation = new Map();

// 2. Process each section
rawSectionBreakdown.forEach(section => {
  const existing = sectionAggregation.get(section.sectionName);
  
  if (existing) {
    // Combine with existing data
    existing.questionsCorrect += section.questionsCorrect;
    existing.questionsTotal += section.questionsTotal;
    existing.questionsAttempted += section.questionsAttempted;
  } else {
    // First occurrence
    sectionAggregation.set(section.sectionName, {
      questionsCorrect: section.questionsCorrect,
      questionsTotal: section.questionsTotal,
      questionsAttempted: section.questionsAttempted
    });
  }
});

// 3. Recalculate scores from aggregated data
const sectionBreakdown = Array.from(sectionAggregation.entries())
  .map(([sectionName, data]) => ({
    sectionName,
    score: Math.round((data.questionsCorrect / data.questionsTotal) * 100),
    accuracy: Math.round((data.questionsCorrect / data.questionsAttempted) * 100),
    ...data
  }));
```

### Why Aggregation Is Necessary

Without aggregation, you'd see:
- ❌ "Numeracy" (3/5 = 60%)
- ❌ "Numeracy" (2/3 = 67%)
- **Two separate sections with same name!**

With aggregation:
- ✅ "Numeracy" (5/8 = 63%)
- **Single combined section**

---

## Files Modified

1. **`src/services/analyticsService.ts`**
   - Lines 60-73: Updated Year 5 NAPLAN mapping
   - Lines 428-470: Added aggregation to diagnostic analytics
   - Lines 1627-1669: Added aggregation to session-based diagnostics  
   - Lines 647-685: Added aggregation to practice test analytics

---

## Testing

✅ **TypeScript Compilation:** No errors
✅ **Section Mapping:** Old names map to new "Numeracy"
✅ **Section Aggregation:** Multiple sections combine correctly
✅ **Score Calculation:** Aggregated scores calculated correctly

---

## What This Fixes

### Before (Broken)
**Insights Spider Chart & Section List:**
- Writing
- Reading
- Language Conventions
- Numeracy No Calculator ❌

**Issue:** Shows old section name from database

### After (Fixed)
**Insights Spider Chart & Section List:**
- Writing
- Reading
- Language Conventions
- Numeracy ✅

**Success:** Shows correct V2 section name, aggregated from legacy data

---

## Verification Steps

1. **Navigate to Insights Page**
   - Select "Year 5 NAPLAN" product
   - View diagnostic results

2. **Expected Display:**
   - Spider chart shows 4 sections: Writing, Reading, Language Conventions, **Numeracy**
   - Section list shows same 4 sections
   - NO "Numeracy No Calculator" or "Numeracy Calculator"
   - Numeracy scores combine data from both old sections

3. **Check Console (Optional):**
   - Look for mapping logs showing old → new section names
   - No errors about duplicate sections

---

## Backward Compatibility

This fix maintains full backward compatibility:

✅ **Existing Data:** Old sessions still load correctly
✅ **New Data:** New sessions use correct "Numeracy" name
✅ **Mixed Data:** Both old and new data aggregate correctly
✅ **Other Products:** No impact on Year 7 NAPLAN or other tests

---

## Benefits

### For Users
- ✅ Correct section names displayed
- ✅ Accurate performance metrics
- ✅ No duplicate/confusing section names
- ✅ Historical data preserved

### For Developers
- ✅ Clean data normalization layer
- ✅ Legacy data handled transparently
- ✅ No database migration needed
- ✅ Easy to add more mappings in future

### For Data Integrity
- ✅ No data loss
- ✅ Accurate aggregation
- ✅ Consistent with V2 configuration
- ✅ Handles edge cases (missing sections, etc.)

---

## Future Considerations

### Option 1: Leave As-Is (Recommended)
- Mapping and aggregation work transparently
- No risk of data corruption
- Supports any legacy data

### Option 2: Migrate Database (Not Recommended)
- Could update old section_name values in database
- Risk of data loss or corruption
- Not worth the complexity given current solution works

### Option 3: Add Migration Helper
- Create script to identify and report legacy section names
- Help track which users have legacy data
- Useful for analytics but not required

---

## Related Documents

1. **FIXES_APPLIED_2026-02-28.md** - Original test time fixes
2. **INSIGHTS_FIX_2026-02-28.md** - Insights V2 migration
3. **COMPLETE_V2_MIGRATION_SUMMARY_2026-02-28.md** - Full migration overview
4. **INSIGHTS_LEGACY_DATA_FIX_2026-02-28.md** (this file) - Legacy data handling

---

## Status: ✅ COMPLETE

**Insights now correctly displays "Numeracy" for Year 5 NAPLAN, aggregating data from legacy "Numeracy No Calculator" and "Numeracy Calculator" sections!**

The fix is transparent to users and maintains full backward compatibility.
