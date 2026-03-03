# VIC Selective Practice Test Insights Fix - March 3, 2026

## Issues Fixed

### 1. **Wrong Section Names (Numerical Reasoning instead of proper names)**
**Problem:** Sections were showing as "Numerical Reasoning" instead of the correct V2 curriculum names:
- "General Ability - Quantitative"
- "Mathematics Reasoning"

**Root Cause:** The `mapSectionNameToCurriculum()` function in `analyticsService.ts` was incorrectly mapping BOTH "General Ability - Quantitative" AND "Mathematics Reasoning" to "Numerical Reasoning", causing them to aggregate together.

**Fix:** Updated the mapping for VIC Selective Entry to use the correct V2 section names without any mapping:
```typescript
'VIC Selective Entry (Year 9 Entry)': {
  // V2 uses the correct section names - NO MAPPING NEEDED
  'General Ability - Quantitative': 'General Ability - Quantitative',
  'General Ability - Verbal': 'General Ability - Verbal',
  'Mathematics Reasoning': 'Mathematics Reasoning',
  'Reading Reasoning': 'Reading Reasoning',
  'Writing': 'Writing'
}
```

**Files Changed:**
- `src/services/analyticsService.ts` (lines 56-64 and 136-143)

---

### 2. **Wrong Denominator (4/110 instead of 4/50)**
**Problem:** "General Ability - Quantitative" showed 4/110 instead of 4/50. The 110 was coming from both sections being aggregated due to the mapping issue.

**Fix:** Fixed automatically by fixing the section name mapping above. Now each section maintains its own correct total:
- General Ability - Quantitative: /50
- Mathematics Reasoning: /60

---

### 3. **Wrong Overall Score Denominator (7/309 instead of 7/110)**
**Problem:** Overall score showed 7/309 (all sections) instead of 7/110 (only completed sections).

**Root Cause:** The overall total was including ALL sections in the practice test (both completed and incomplete), giving a total of 309 instead of just the 110 from the 2 completed sections.

**Fix:** Changed the calculation to ONLY sum up completed sections:
```typescript
// Calculate totals ONLY from completed sections (like diagnostic)
const completedSectionsOnly = sectionBreakdown.filter(s => s.completed);
const totalQuestionsCorrect = completedSectionsOnly.reduce((sum, s) => sum + s.questionsCorrect, 0);
const totalQuestions = completedSectionsOnly.reduce((sum, s) => sum + s.questionsTotal, 0);
const totalQuestionsAttempted = completedSectionsOnly.reduce((sum, s) => sum + s.questionsAttempted, 0);
```

**Files Changed:**
- `src/services/analyticsService.ts` (lines 2455-2471)

---

### 4. **Incomplete Sections Showing on Spider Chart**
**Problem:** The spider chart was showing all 5 sections including incomplete ones (with 0% scores), making the chart look cluttered and confusing.

**Fix:** Filter the spider chart data to only show completed sections:
```typescript
<SpiderChart
  data={(selectedTest.sectionBreakdown || [])
    .filter(section => section.completed !== false)  // Only show completed sections
    .map((section) => ({
      label: section.sectionName.replace('General Ability - ', 'GA - ').replace(' Reasoning', '\nReasoning'),
      value: sectionView === 'score' ? section.score : section.accuracy,
      maxValue: 100
    }))}
  size={280}
  animate={animateSpiderChart}
/>
```

**Files Changed:**
- `src/pages/Insights.tsx` (lines 1574-1584)

---

## Expected Results After Fix

1. ✅ Section names show correctly:
   - "General Ability - Quantitative" (not "Numerical Reasoning")
   - "Mathematics Reasoning" (not merged with GA-Q)

2. ✅ Correct denominators for each section:
   - General Ability - Quantitative: 4/50 = 8%
   - Mathematics Reasoning: 3/60 = 5%

3. ✅ Correct overall score: 7/110 = 6% (not 7/309)

4. ✅ Spider chart only shows completed sections (2 points, not 5)

5. ✅ Incomplete sections still appear in the section list but grayed out with "-/-"

---

## Testing Instructions

1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R) to clear cache
2. Navigate to Insights > Practice Tests > VIC Selective > Test 1
3. Verify:
   - Overall Score shows correct denominator (sum of completed sections only)
   - Section names are correct (no "Numerical Reasoning")
   - Each section has correct individual totals
   - Spider chart only shows completed sections
   - Incomplete sections are grayed out in the list

---

## Notes

- This fix aligns VIC Selective with the V2 curriculum structure
- The mapping function was legacy code from when section names were being standardized
- VIC Selective V2 already uses the correct canonical section names, so no mapping is needed
- The `completed` flag is properly set for each section, allowing proper filtering
