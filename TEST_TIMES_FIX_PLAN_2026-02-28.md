# Test Times Fix Plan
**Date:** 2026-02-28
**Related:** TEST_TIMES_AUDIT_2026-02-28.md

## Overview

This plan addresses the test timing issues identified in the audit, prioritized by severity and impact.

---

## Fix Strategy: Two-Phase Approach

### Phase 1: Quick Fix (Update V1 to Match Official Times)
**Timeline:** 1-2 hours
**Risk:** LOW
**Rationale:** This immediately fixes the UI without requiring architectural changes

### Phase 2: Long-term Fix (Migrate to V2 Architecture)
**Timeline:** 4-6 hours
**Risk:** MEDIUM
**Rationale:** This establishes proper architecture with single source of truth

---

## Phase 1: Quick Fixes (RECOMMENDED TO START)

### Fix 1.1: Update NAPLAN Year 5 Numeracy Structure
**File:** `src/data/curriculumData.ts`
**Priority:** CRITICAL
**Impact:** Fixes incorrect test structure

**Current (WRONG):**
```typescript
"Year 5 NAPLAN": {
  "Numeracy No Calculator": {
    "questions": 25,
    "time": 25,
    ...
  },
  "Numeracy Calculator": {
    "questions": 25,
    "time": 25,
    ...
  }
}
```

**Should be:**
```typescript
"Year 5 NAPLAN": {
  "Numeracy": {
    "questions": 50,
    "time": 50,
    "format": "Multiple Choice",
    "passages": 0,
    "words_per_passage": 0
  }
}
```

**Additional Changes Required:**
- Update `src/data/curriculumData_v2/naplan-year5.ts` curriculum to have single "Numeracy" section
- Check if any UI components specifically reference "Numeracy No Calculator" or "Numeracy Calculator"
- Update any product configurations that reference these sections

---

### Fix 1.2: Update NSW Selective Reading Time
**File:** `src/data/curriculumData.ts`
**Priority:** HIGH

**Change:**
```typescript
"NSW Selective Entry (Year 7 Entry)": {
  "Reading": {
    "questions": 30,
    "time": 45,  // Changed from 40 to 45
    ...
  }
}
```

**Also update:** `src/data/curriculumData_v2/sectionConfigurations.ts` line 158:
```typescript
"NSW Selective Entry (Year 7 Entry) - Reading": {
  test_type: "NSW Selective Entry (Year 7 Entry)",
  section_name: "Reading",
  total_questions: 30,
  time_limit_minutes: 45,  // Changed from 40 to 45
  ...
}
```

**Note:** Official NSW test has 38 answers across 17 questions in 45 minutes. Our 30 questions may also need review.

---

### Fix 1.3: Update ACER Scholarship Times
**File:** `src/data/curriculumData.ts`
**Priority:** HIGH

**Changes:**
```typescript
"ACER Scholarship (Year 7 Entry)": {
  "Written Expression": {
    "questions": 2,  // 2 prompts, student chooses 1
    "time": 25,      // 25 minutes per essay (keep at 25)
    ...
  },
  "Mathematics": {
    "questions": 35,
    "time": 40,      // Changed from 47 to 40
    ...
  },
  "Humanities": {
    "questions": 35,
    "time": 40,      // Changed from 47 to 40
    ...
  }
}
```

**Also update:** `src/data/curriculumData_v2/sectionConfigurations.ts`:
- Line 509: Written Expression time_limit_minutes: 25 (change from 40 to 25)
- Line 443: Humanities time_limit_minutes: 40 (change from 47 to 40)
- Line 530: Mathematics time_limit_minutes: 40 (change from 47 to 40)

**NOTE:** ACER Written Expression shows 2 questions because students get 2 prompts and choose 1 to write for 25 minutes.

---

### Fix 1.4: Verify NAPLAN Year 7 Numeracy (Investigation Required)
**Priority:** MEDIUM
**Action:** INVESTIGATE FIRST before changing

Official documentation says "80 minutes total" for both numeracy parts combined.
Our current times: 30 min (No Calculator) + 35 min (Calculator) = 65 minutes

**Options:**
1. Keep current (65 min total) - conservative but allows buffer
2. Adjust to 80 min total - more accurate but need to determine split
   - Option A: 40 min No Calc + 40 min Calc
   - Option B: 30 min No Calc + 50 min Calc (matches question ratio)

**Recommended:** Search for more specific official guidance on the time split before changing.

---

## Phase 2: Long-term Architecture Fix

### Fix 2.1: Update timeUtils.ts to Use V2 Configuration
**File:** `src/utils/timeUtils.ts`
**Priority:** HIGH (after Phase 1)
**Timeline:** 2-3 hours

**Current Implementation:**
```typescript
export function getUnifiedTimeLimit(testType: string, sectionName: string): number {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  // Uses curriculumData.ts
}
```

**New Implementation:**
```typescript
import { getSectionConfig } from '@/data/curriculumData_v2/sectionConfigurations';

export function getUnifiedTimeLimit(testType: string, sectionName: string): number {
  const sectionConfig = getSectionConfig(testType, sectionName);
  
  if (sectionConfig && sectionConfig.time_limit_minutes) {
    return sectionConfig.time_limit_minutes;
  }
  
  // Fallback to V1 for backward compatibility
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  // ... existing logic ...
}
```

**Testing Required:**
- Test all product sections load correctly
- Verify diagnostic, practice, and drill modes use correct times
- Check test instructions page shows correct times
- Verify timer counts down correctly during tests

---

### Fix 2.2: Update Question Count Helper
**File:** `src/utils/timeUtils.ts`
**Impact:** Consistency

Update `getSectionQuestionCount()` to also use V2 configuration:
```typescript
export function getSectionQuestionCount(testType: string, sectionName: string): number {
  const sectionConfig = getSectionConfig(testType, sectionName);
  
  if (sectionConfig && sectionConfig.total_questions) {
    return sectionConfig.total_questions;
  }
  
  // Fallback to V1
  // ... existing logic ...
}
```

---

### Fix 2.3: Deprecate or Update curriculumData.ts
**File:** `src/data/curriculumData.ts`
**Priority:** LOW (after migration complete)
**Options:**

**Option A: Keep for Backward Compatibility**
- Add comment: "// DEPRECATED: Use sectionConfigurations.ts for all new code"
- Keep in sync with V2 manually
- Gradually remove references over time

**Option B: Auto-Generate from V2**
- Create script to generate V1 format from V2 configurations
- Ensures consistency automatically
- Reduces maintenance burden

**Option C: Remove Completely**
- Remove file after all references migrated to V2
- Most thorough but highest risk of breaking things

**Recommendation:** Option A initially, then Option C after thorough testing.

---

## Testing Checklist

After implementing fixes, verify:

### Functional Testing
- [ ] All test sections load with correct times
- [ ] Timer displays correct initial time
- [ ] Timer counts down correctly
- [ ] Test instructions show correct time limits
- [ ] Diagnostic mode uses correct times
- [ ] Practice mode uses correct times
- [ ] Drill mode behavior unchanged (no timer)

### Visual Testing (UI)
- [ ] NAPLAN Year 5 shows single "Numeracy" section (not split)
- [ ] NSW Selective Reading shows 45 min
- [ ] ACER sections show updated times
- [ ] No references to "Numeracy No Calculator" or "Numeracy Calculator" for Year 5

### Data Consistency
- [ ] V1 and V2 configurations match for all sections
- [ ] No console errors about missing time limits
- [ ] All product pages render correctly

### Regression Testing
- [ ] Writing prompts still work correctly
- [ ] Passage-based questions still load correctly
- [ ] Session saving/resuming still works
- [ ] Progress tracking unaffected

---

## Rollback Plan

If issues arise after deployment:

1. **Quick Rollback:** Revert `curriculumData.ts` changes
   - Git revert specific commits
   - No UI changes needed if using Phase 1 approach

2. **Full Rollback:** Revert `timeUtils.ts` changes if Phase 2 implemented
   - Requires code deployment
   - Test functionality after revert

3. **Data Fix:** If user sessions affected
   - Check `user_test_sessions` table for corrupted time data
   - May need SQL script to fix in-progress sessions

---

## Files to Modify

### Phase 1 (Quick Fix)
1. `src/data/curriculumData.ts` - Update times in TEST_STRUCTURES
2. `src/data/curriculumData_v2/sectionConfigurations.ts` - Update times in SECTION_CONFIGURATIONS
3. `src/data/curriculumData_v2/naplan-year5.ts` - Fix Numeracy section structure

### Phase 2 (Architecture Fix)
4. `src/utils/timeUtils.ts` - Migrate to use V2 configuration source
5. Any components that directly reference curriculumData.ts (search codebase)

---

## Recommended Implementation Order

1. ✅ Complete audit (DONE)
2. ✅ Create fix plan (DONE)
3. **NEXT:** User approval to proceed
4. Implement Fix 1.1 (NAPLAN Year 5 structure) - CRITICAL
5. Implement Fixes 1.2 & 1.3 (time corrections) - HIGH
6. Test Phase 1 changes thoroughly
7. Deploy Phase 1
8. Plan Phase 2 migration (separate task)
9. Implement Phase 2 after Phase 1 stable

---

## Risk Assessment

| Fix | Risk Level | Impact if Wrong | Mitigation |
|-----|-----------|-----------------|------------|
| 1.1 NAPLAN Y5 | MEDIUM | Students see wrong test structure | Thorough testing, staged rollout |
| 1.2 NSW Reading | LOW | 5 min difference noticed | Easy to revert |
| 1.3 ACER times | LOW | Time discrepancy noticed | Easy to revert |
| 1.4 NAPLAN Y7 | LOW | Already approximate | More research needed |
| 2.1 timeUtils | HIGH | All tests could break | Extensive testing, fallback logic |

---

## Success Criteria

After implementation:
- ✅ All test times match official specifications (within documented ranges)
- ✅ NAPLAN Year 5 shows single Numeracy section
- ✅ No user-facing errors or timing issues
- ✅ V1 and V2 configurations are consistent
- ✅ Code uses single authoritative data source (Phase 2)

---

## Questions for User

Before proceeding:

1. **Priority:** Should we do Phase 1 (quick fix) first, or go straight to Phase 2 (architectural fix)?
   - Recommendation: Phase 1 first for safety

2. **NAPLAN Year 7:** Should we investigate the 65 vs 80 minute discrepancy first, or proceed with current times?
   - Recommendation: Investigate first

3. **Testing:** Do you have a staging environment, or should we test in production?
   - Recommendation: Test in staging if available

4. **Rollout:** Deploy all at once, or one test type at a time?
   - Recommendation: All at once for Phase 1 (low risk)

---

**Ready to proceed when you approve!**
