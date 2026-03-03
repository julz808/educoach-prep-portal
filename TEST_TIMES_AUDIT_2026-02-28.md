# Test Times Audit Report
**Date:** 2026-02-28
**Issue:** User reported that NAPLAN Year 5 Numeracy shows 25 minutes instead of expected time

## Executive Summary

**CRITICAL FINDING:** The UI is loading test times from the **WRONG DATA SOURCE**.

- **Current Implementation:** UI uses `curriculumData.ts` (v1) via `getUnifiedTimeLimit()` function in `timeUtils.ts`
- **Correct Source:** Should use `sectionConfigurations.ts` (v2) which contains `time_limit_minutes`

This has resulted in **MULTIPLE INCORRECT TIME LIMITS** across the platform.

---

## Source Code Analysis

### Where Times Are Loaded From

**File:** `src/utils/timeUtils.ts` (lines 7-47)
```typescript
export function getUnifiedTimeLimit(testType: string, sectionName: string): number {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  // ... uses curriculumData.ts TEST_STRUCTURES
}
```

**Called by:** `src/pages/TestTaking.tsx` (line 729)
```typescript
const timeAllocation = getTimeAllocation(properDisplayName, sectionName, actualTestMode, questions.length);
```

### Two Conflicting Data Sources

| Location | File | Field Name |
|----------|------|------------|
| **V1 (Currently Used by UI)** | `src/data/curriculumData.ts` | `TEST_STRUCTURES[test][section].time` |
| **V2 (Correct, Not Used)** | `src/data/curriculumData_v2/sectionConfigurations.ts` | `SECTION_CONFIGURATIONS[key].time_limit_minutes` |

---

## Comprehensive Time Audit

### 🔴 NAPLAN Year 5

| Section | Our V1 (UI) | Our V2 (Config) | Official | Status |
|---------|-------------|-----------------|----------|--------|
| Writing | 42 min | 42 min | **42 min** | ✅ CORRECT |
| Reading | 50 min | 50 min | **50 min** | ✅ CORRECT |
| Language Conventions | 45 min | 45 min | **45 min** | ✅ CORRECT |
| Numeracy No Calculator | **25 min** ❌ | 50 min | N/A (doesn't exist) | ❌ WRONG STRUCTURE |
| Numeracy Calculator | **25 min** ❌ | 50 min | N/A (doesn't exist) | ❌ WRONG STRUCTURE |
| **Numeracy (Correct)** | N/A | **50 min** ✅ | **50 min** | ✅ V2 CORRECT |

**ISSUE:** Year 5 NAPLAN is a SINGLE 50-minute numeracy test, NOT split into calculator/no-calculator sections. V1 incorrectly splits it into two 25-minute sections.

### 🔴 NAPLAN Year 7

| Section | Our V1 (UI) | Our V2 (Config) | Official | Status |
|---------|-------------|-----------------|----------|--------|
| Writing | 42 min | 42 min | **42 min** | ✅ CORRECT |
| Reading | 65 min | 65 min | **65 min** | ✅ CORRECT |
| Language Conventions | 45 min | 45 min | **45 min** | ✅ CORRECT |
| Numeracy No Calculator | 30 min | 30 min | **~30 min** (part of 80 min total) | ⚠️ APPROXIMATE |
| Numeracy Calculator | 35 min | 35 min | **~50 min** (part of 80 min total) | ⚠️ APPROXIMATE |

**NOTE:** Official NAPLAN Year 7 documentation states "80 minutes total" for numeracy (both parts combined in one session), but doesn't specify exact breakdown. Our split of 30+35=65 minutes may be conservative.

### 🟡 NSW Selective Entry (Year 7)

| Section | Our V1 (UI) | Our V2 (Config) | Official | Status |
|---------|-------------|-----------------|----------|--------|
| Reading | 40 min | 40 min | **45 min** | ❌ SHORT by 5 min |
| Mathematical Reasoning | 40 min | 40 min | **40 min** | ✅ CORRECT |
| Thinking Skills | 40 min | 40 min | **40 min** | ✅ CORRECT |
| Writing | 30 min | 30 min | **30 min** | ✅ CORRECT |

**ISSUE:** Reading test is 5 minutes short (should be 45 minutes, not 40).

### 🟡 VIC Selective Entry (Year 9)

| Section | Our V1 (UI) | Our V2 (Config) | Official | Status |
|---------|-------------|-----------------|----------|--------|
| Reading Reasoning | 35 min | 35 min | **35 min** | ✅ CORRECT |
| Mathematics Reasoning | 30 min | 30 min | **30 min** | ✅ CORRECT |
| General Ability - Verbal | 30 min | 30 min | **30 min** | ✅ CORRECT |
| General Ability - Quantitative | 30 min | 30 min | **30 min** | ✅ CORRECT |
| Writing | 40 min | 40 min | **40 min** | ✅ CORRECT |

**STATUS:** All correct! ✅

### 🟡 ACER Scholarship (Year 7)

| Section | Our V1 (UI) | Our V2 (Config) | Official | Status |
|---------|-------------|-----------------|----------|--------|
| Written Expression | **25 min** | **40 min** | **25 min each (2 essays)** | ⚠️ MISMATCH |
| Humanities | 47 min | 47 min | **40 min** | ❌ LONG by 7 min |
| Mathematics | 47 min | 47 min | **40 min** | ❌ LONG by 7 min |

**ISSUE:** 
- V1 shows 25 min, V2 shows 40 min for written expression. Official is 25 min × 2 essays = 50 min total.
- Humanities and Mathematics are 7 minutes too long each (should be 40 min, not 47).

### 🟡 EduTest Scholarship (Year 7)

| Section | Our V1 (UI) | Our V2 (Config) | Official | Status |
|---------|-------------|-----------------|----------|--------|
| Verbal Reasoning | 30 min | 30 min | **30 min** | ✅ CORRECT |
| Numerical Reasoning | 30 min | 30 min | **30 min** | ✅ CORRECT |
| Reading Comprehension | 30 min | 30 min | **30 min** | ✅ CORRECT |
| Mathematics | 30 min | 30 min | **30 min** | ✅ CORRECT |
| Written Expression | **30 min** | **30 min** | **30 min (2 prompts)** | ✅ CORRECT |

**STATUS:** All correct! ✅

---

## Summary of Issues

### Critical Issues (Must Fix)

1. **NAPLAN Year 5 Numeracy Structure** ❌
   - Current: Split into "No Calculator" (25 min) + "Calculator" (25 min)
   - Correct: Single "Numeracy" test (50 min)
   - Impact: WRONG TEST STRUCTURE

2. **Wrong Data Source** ❌
   - UI uses `curriculumData.ts` (V1) instead of `sectionConfigurations.ts` (V2)
   - Impact: Any V1 errors propagate to UI

### Time Discrepancies

| Test | Section | Current | Should Be | Diff |
|------|---------|---------|-----------|------|
| NSW Selective | Reading | 40 min | 45 min | -5 min |
| ACER Scholarship | Humanities | 47 min | 40 min | +7 min |
| ACER Scholarship | Mathematics | 47 min | 40 min | +7 min |
| ACER Scholarship | Written Expression | 25 min (V1) / 40 min (V2) | 25 min × 2 | Unclear |

### Warnings

- **NAPLAN Year 7 Numeracy:** Our split (30+35=65 min) vs official "80 min total" - need verification
- **ACER Written Expression:** V1 vs V2 mismatch (25 vs 40 min)

---

## Official Sources Consulted

1. **NAPLAN:** 
   - ACARA official example tests
   - nap.edu.au practice materials
   - 2025 Test Administration Handbooks

2. **NSW Selective:**
   - education.nsw.gov.au official placement test information
   - 2025 test specifications

3. **VIC Selective:**
   - ACER selectiveentry.acer.org/vic
   - VCAA resources

4. **ACER Scholarship:**
   - acer.org/au/scholarship official materials
   - Example questions document

5. **EduTest Scholarship:**
   - edutest.com.au official website
   - School administration guides

---

## Recommendations

### Immediate Actions

1. **Fix Data Source** (Priority: CRITICAL)
   - Update `timeUtils.ts` to read from `sectionConfigurations.ts` instead of `curriculumData.ts`
   - OR update `curriculumData.ts` to match `sectionConfigurations.ts`

2. **Fix NAPLAN Year 5 Structure** (Priority: CRITICAL)
   - Remove "Numeracy No Calculator" and "Numeracy Calculator" sections
   - Use single "Numeracy" section with 50 questions in 50 minutes

3. **Correct Time Limits** (Priority: HIGH)
   - NSW Selective Reading: 40 → 45 minutes
   - ACER Humanities: 47 → 40 minutes
   - ACER Mathematics: 47 → 40 minutes

4. **Verify NAPLAN Year 7 Numeracy** (Priority: MEDIUM)
   - Confirm whether 30+35=65 min is correct or should be adjusted to match official 80 min

5. **Clarify ACER Written Expression** (Priority: MEDIUM)
   - Determine correct time: 25 min each (2 essays) or 40 min total?
   - Align V1 and V2 configurations

### Long-term Solution

- **Deprecate V1 curriculumData.ts:** Migrate all references to use V2 sectionConfigurations.ts
- **Single source of truth:** All curriculum data should come from one authoritative location
- **Validation scripts:** Create automated tests to verify times against official sources

---

## Next Steps

**DO NOT IMPLEMENT CHANGES YET** - This is an audit only.

Awaiting user approval to proceed with fixes.
