# Number Operations & Properties - Error Documentation

**Sub-Skill**: Number Operations & Properties
**Test Type**: VIC Selective Entry (Year 9 Entry)
**Total Questions**: 72
**Questions Reviewed**: 72 (100%)
**Errors Found**: 2
**Error Rate**: 2.8%
**Date**: March 28, 2026

---

## Executive Summary

Audited all 72 questions in the Number Operations & Properties sub-skill. Found 2 errors:
1. **Q2 (Jeweler/Stones)**: Incorrect count of numbers expressible as difference of two squares
2. **Q10 (Cinema Revenue)**: Arithmetic error in ticket revenue calculation

Both errors have been fixed in the live database.

---

## ERROR 1: Q2 - Jeweler/Stones (Difference of Two Squares)

**Question ID**: `46a1f383-e9b8-4117-8c03-80a36a99163f`
**Test Mode**: diagnostic
**Stored Answer**: B (38)
**Correct Answer**: E (None of these)
**Actual Correct Value**: 37

### Question Text

"A jeweler is creating necklaces using precious stones. She has a collection of stones numbered consecutively from 1 to 50. She selects only those stones whose numbers can be expressed as the difference of two perfect squares. How many stones does she select?"

### Options

- A) 25
- B) 38
- C) 40
- D) 45
- E) 50

### Mathematical Proof

A number n can be expressed as a² - b² = (a+b)(a-b) if and only if:
1. n is odd (all odd numbers work), OR
2. n is a multiple of 4 (but NOT of form 4k+2)

**Odd numbers from 1-50:**
1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49

Count = **25 numbers**

**Multiples of 4 from 1-50:**
4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48

Count = **12 numbers**

**Total**: 25 + 12 = **37 numbers**

### Why Stored Answer is Wrong

The solution states: "Actually 25 odd + 13 multiples of 4 = 38"

This is incorrect. There are only **12 multiples of 4** in the range 1-50, not 13.

Counting manually:
- 4 × 1 = 4 ✓
- 4 × 2 = 8 ✓
- 4 × 3 = 12 ✓
- 4 × 4 = 16 ✓
- 4 × 5 = 20 ✓
- 4 × 6 = 24 ✓
- 4 × 7 = 28 ✓
- 4 × 8 = 32 ✓
- 4 × 9 = 36 ✓
- 4 × 10 = 40 ✓
- 4 × 11 = 44 ✓
- 4 × 12 = 48 ✓
- 4 × 13 = 52 (exceeds 50) ✗

Total multiples of 4: **12**

### Fix Applied

Since 37 is not in options A-D, the correct answer is **E**.

**Update**: `correct_answer` changed from 'B' to 'E'

**Verification**: ✅ Confirmed in database on 2026-03-28

---

## ERROR 2: Q10 - Cinema Tickets (Revenue Calculation)

**Question ID**: `d9bfc32b-5fef-460c-8efa-2faec1f23b84`
**Test Mode**: drill
**Stored Answer**: E ($234)
**Correct Answer**: A ($264)

### Question Text

"A cinema sells tickets for different age groups. Adult tickets cost $18 each, child tickets cost $12 each, and senior tickets cost $15 each. On a particular evening, the cinema sold 8 adult tickets, 5 child tickets, and 4 senior tickets. What was the total revenue from ticket sales that evening?"

### Options

- A) $264
- B) $198
- C) $204
- D) $288
- E) $234

### Mathematical Proof

**Step-by-step calculation:**

1. Adult tickets: 8 × $18 = **$144**
2. Child tickets: 5 × $12 = **$60**
3. Senior tickets: 4 × $15 = **$60**
4. Total revenue: $144 + $60 + $60 = **$264**

**Verification:**
- $144 + $60 = $204
- $204 + $60 = $264 ✓

### Why Stored Answer is Wrong

The solution in the database states:
"Add all revenues together: $144 + $60 + $60 = $234"

This is an arithmetic error. The correct sum is **$264**, not $234.

The error appears to be a simple calculation mistake (possibly $234 = $144 + $60 + $30, using $30 instead of $60 for the second $60).

### Fix Applied

**Update**: `correct_answer` changed from 'E' to 'A'

**Verification**: ✅ Confirmed in database on 2026-03-28

---

## Error Statistics

### By Test Mode

| Test Mode | Errors | Total Questions | Error Rate |
|-----------|--------|----------------|------------|
| diagnostic | 1 | 8 | 12.5% |
| drill | 1 | 24 | 4.2% |
| practice_1-5 | 0 | 40 | 0% |
| **TOTAL** | **2** | **72** | **2.8%** |

### Error Types

1. **Counting Error** (1 error): Miscounted multiples of 4 in range 1-50
2. **Arithmetic Error** (1 error): Addition mistake in revenue calculation

---

## Quality Assessment

**Overall Quality**: Excellent (97.2% accuracy)

- **Mathematical Reasoning**: Generally sound
- **Solution Explanations**: Clear and detailed
- **Common Error Patterns**: None identified (isolated errors)
- **Recommendation**: No systemic issues found

---

## Files Created

1. **Fetch Script**: `questions-audit/vic-selective/scripts/fetch-number-operations-30.ts`
2. **Fetch All Script**: `questions-audit/vic-selective/scripts/fetch-number-operations-all.ts`
3. **Error Check Script**: `questions-audit/vic-selective/scripts/check-errors-q2-q10.ts`
4. **Fix Script**: `questions-audit/vic-selective/scripts/fix-number-operations-errors.ts`
5. **Question Dump**: `/tmp/number_operations_all_72.txt`
6. **Error Data**: `/tmp/error_questions.json`

---

## Verification Log

**Date**: March 28, 2026
**Audited By**: Claude (Sonnet 4.5)
**Method**: Manual verification of all 72 questions
**Errors Fixed**: 2/2 (100%)
**Database Status**: All fixes verified in live database

---

**End of Report**
