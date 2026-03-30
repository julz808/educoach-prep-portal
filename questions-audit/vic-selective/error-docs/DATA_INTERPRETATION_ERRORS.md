# Data Interpretation: Tables & Graphs - Error Documentation

**Sub-skill:** Data Interpretation: Tables & Graphs
**Total Questions:** 74
**Questions with Errors:** 2
**Error Rate:** 2.70%
**Audit Date:** 2026-03-28

---

## Error Summary

| Question # | Question ID | Error Type | Severity | Status |
|-----------|-------------|------------|----------|---------|
| 1 | 8abd3773-2850-4b76-829b-4b7b70de1410 | Solution uses wrong table values | HIGH | Pending Fix |
| 32 | eeb581cc-00b1-4612-a661-3410334518dd | Solution references wrong categories | HIGH | Pending Fix |

---

## Detailed Error Analysis

### Error 1: Question 1 - Solution Uses Completely Wrong Table Values

**Question ID:** `8abd3773-2850-4b76-829b-4b7b70de1410`
**Test Mode:** diagnostic
**Difficulty:** 2

**Problem:**
The solution calculates totals using completely different values than what's shown in the question table.

**Question Table (Correct):**
```
| Paleontologist | Site A | Site B | Site C |
|----------------|--------|--------|--------|
| Dr. Chen       | 24     | 18     | 32     |
| Dr. Patel      | 30     | 22     | 28     |
| Dr. Kim        | 26     | 34     | 20     |
| Dr. Lopez      | 28     | 26     | 30     |
```

**Solution's Calculations (WRONG - uses different values):**
```
• Site A total: 45 + 32 + 28 = 105 fossils
• Site B total: 38 + 41 + 35 = 114 fossils
• Site C total: 52 + 29 + 43 = 124 fossils
```

**Correct Calculations Should Be:**
```
• Site A total: 24 + 30 + 26 + 28 = 108 fossils
• Site B total: 18 + 22 + 34 + 26 = 100 fossils
• Site C total: 32 + 28 + 20 + 30 = 110 fossils
• Highest total: Site C with 110 fossils
• Lowest total: Site B with 100 fossils
• Difference: 110 - 100 = 10 fossils
```

**Stored Answer:** E (None of these)

**Correct Answer:** E (None of these) - The answer is coincidentally correct, but for the wrong reason!

**Impact:** The solution is confusing and uses completely fabricated data. Students who correctly calculate from the table data will get the right answer (E), but the solution explanation is completely wrong.

---

### Error 2: Question 32 - Solution References Wrong Categories

**Question ID:** `eeb581cc-00b1-4612-a661-3410334518dd`
**Test Mode:** drill
**Difficulty:** 1

**Problem:**
The solution text references "Strategy games" and "Party games" but the question table shows "Family" and "Card" games instead.

**Question Table (Correct):**
```
| Game Type | Thursday | Friday | Saturday | Sunday |
|-----------|----------|--------|----------|--------|
| Strategy  | 18       | 22     | 35       | 28     |
| Family    | 25       | 30     | 42       | 33     |
| Card      | 12       | 15     | 20       | 18     |
```

**Question:** "How many more Family games than Card games were sold during the entire four-day sale?"

**Current Solution (WRONG):**
```
• Strategy games: 45 + 52 + 38 + 41 = 176
• Party games: 28 + 35 + 22 + 26 = 111
• Difference: 176 - 111 = 65
• Therefore, the answer is B because the store sold 65 more strategy games than party games
```

**Correct Solution Should Be:**
```
• Total Family games = 25 + 30 + 42 + 33 = 130
• Total Card games = 12 + 15 + 20 + 18 = 65
• Difference = 130 - 65 = 65
• Therefore, the answer is B because the store sold 65 more Family games than Card games
```

**Stored Answer:** B
**Correct Answer:** B - The numeric answer is coincidentally correct, but the solution is completely wrong!

**Impact:** The solution uses entirely different category names and different values than what's in the table. This will confuse students who are trying to learn how to solve these problems.

---

## Questions Verified as Correct (72 out of 74)

The following question ranges were manually verified and found to be correct:

- **Questions 2-31:** All correct ✓
- **Questions 33-74:** All correct ✓

---

## Patterns and Observations

1. **Both errors involve solutions using wrong data:**
   - Question 1: Solution uses completely fabricated table values
   - Question 32: Solution references wrong category names and values

2. **Coincidental correct answers:**
   - Both questions have correct stored answers (E and B respectively)
   - However, the solution explanations are completely wrong
   - This suggests the solutions may have been copied from different questions

3. **Error type: Copy-paste errors:**
   - These appear to be copy-paste errors where solutions from other questions were mistakenly used
   - The calculation methodology is correct, but applied to wrong data

---

## Recommendations

1. **Fix Priority:** HIGH - These errors will confuse students learning the methodology
2. **Fix Type:** Complete solution rewrite using correct table values and categories
3. **Verification:** After fixes, verify that solution steps match the actual table data
4. **Additional Check:** Search for similar copy-paste errors in other sub-skills

---

## Fix Script Requirements

The fix script must:
1. Update the `solution` field for Question 1 (ID: 8abd3773-2850-4b76-829b-4b7b70de1410)
2. Update the `solution` field for Question 32 (ID: eeb581cc-00b1-4612-a661-3410334518dd)
3. Use the correct table values from the `question_text` field
4. Maintain the same solution structure and formatting
5. Verify the stored answers remain correct (E and B)

---

## Audit Completion Status

- ✅ All 74 questions reviewed
- ✅ 2 errors identified and documented
- ⏳ Fix script creation pending
- ⏳ Database fixes pending
- ⏳ Post-fix verification pending
