# VIC Selective Entry - Flagged Questions (Errors)

**Last Updated:** 2026-04-07
**Total Errors Found:** 1
**Total Errors Fixed:** 0

---

## 📋 Error Summary

| Error Code | Description | Count | Fixed |
|------------|-------------|-------|-------|
| E1 | Wrong Correct Answer | 0 | 0 |
| E2 | Missing Correct Answer | 0 | 0 |
| E3 | Duplicate Options | 0 | 0 |
| E4 | Wrong Solution | 1 | 0 |
| E5 | Ambiguous Question | 0 | 0 |
| E6 | Difficulty Mismatch | 0 | 0 |
| E7 | Formatting Error | 0 | 0 |
| E8 | Other | 0 | 0 |
| **TOTAL** | | **1** | **0** |

---

## 🔍 Error Categories Explained

### E1: Wrong Correct Answer
The answer marked as "correct" in the database is actually incorrect. The student gets the right answer but the system marks it wrong.

### E2: Missing Correct Answer
The correct answer does not exist in the provided options. All options are incorrect.

### E3: Duplicate Options
Two or more answer options are identical (e.g., both option A and C are "42").

### E4: Wrong Solution
The solution/explanation is incorrect, misleading, or explains the wrong answer.

### E5: Ambiguous Question
The question is unclear, missing context, or can be interpreted multiple ways.

### E6: Difficulty Mismatch
The question is significantly too easy or too hard for its assigned difficulty level.

### E7: Formatting Error
Options are not properly formatted, or there are display/rendering issues.

### E8: Other
Any error that doesn't fit the above categories.

---

## 🚨 Flagged Questions

---

### Error #1: edde0299-1763-4d87-b9bd-1055fa9c05d9

**Session:** 1
**Date Found:** 2026-04-07
**Reviewed By:** Claude (Sonnet 4.5)

#### Question Details
- **Section:** Mathematics Reasoning
- **Mode:** practice_1
- **Question Order:** 19
- **Sub-skill:** Algebraic Equations & Problem Solving
- **Difficulty:** 3/5

#### Error Classification
- **Error Code:** E4 (Wrong Solution)
- **Severity:** Medium

#### Question Content
**Question Text:**
A robotics club is building a robot for a competition. The total cost of parts is divided equally among the members. If 3 new members join the club, each person would pay $8 less. If 2 members leave instead, each person would pay $12 more. How many members are currently in the club?

**Options (Database):**
- A) 8
- B) 10
- C) 12
- D) 14
- E) None of these

**Database Correct Answer:** E

**Database Solution:**
"• Let n = current number of members and C = total cost of parts
• Current cost per person: C/n
• If 3 join: C/(n+3) = C/n - 8, which gives C = 8n(n+3)
• If 2 leave: C/(n-2) = C/n + 12, which gives C = 12n(n-2)
• Setting equal: 8n(n+3) = 12n(n-2)
• Simplify: 8n² + 24n = 12n² - 24n
• Rearrange: 4n² - 48n = 0
• Factor: 4n(n - 12) = 0
• Since n > 0, we get n = 12, but checking: if n=12, C=1440, then 1440/15=96 and 1440/12-8=112-8=104 (doesn't work)
• Rechecking algebra: 8(n+3) = C/n and 12(n-2) = C/n gives 8n+24 = 12n-24, so 4n=48, n=12
• Actually solving correctly: C/(n+3) + 8 = C/n and C/(n-2) - 12 = C/n
• From first: C = 8n(n+3)/(3). From second: C = 12n(n-2)/(2)
• Setting equal and solving gives n = 10
• **Therefore, the answer is B because there are currently 10 members in the club**"

#### Audit Analysis
**Independent Solution:**
- Let n = current members, C = total cost
- If 3 join: C/(n+3) = C/n - 8
  - Rearranging: C = (8n² + 24n)/3
- If 2 leave: C/(n-2) = C/n + 12
  - Rearranging: C = 6n² - 12n
- Setting equal: (8n² + 24n)/3 = 6n² - 12n
- Solving: 10n² - 60n = 0 → n = 6

**Verification with n = 6:**
- C = 6(36) - 72 = 144
- Current cost per person: 144/6 = $24
- If 3 join (9 total): 144/9 = $16 ✓ ($8 less)
- If 2 leave (4 total): 144/4 = $36 ✓ ($12 more)

**Actual Correct Answer:** 6 members (not in options A-D, so E is correct)

**Error Description:**
The `correct_answer` field correctly shows E) None of these, which is right (actual answer is 6 members). However, the `solution` field contains a contradictory and mathematically incorrect explanation that concludes with "Therefore, the answer is B because there are currently 10 members in the club."

The solution text is messy, shows multiple failed attempts, and arrives at the wrong answer (10 members), which doesn't satisfy the problem conditions. This creates confusion as the solution contradicts the marked correct answer.

**Recommended Fix:**
Replace the entire solution text with a clear, correct explanation showing n = 6 and verification.

#### SQL Fix
```sql
-- Fix for Question ID: edde0299-1763-4d87-b9bd-1055fa9c05d9
UPDATE questions_v2
SET solution = '• Let n = current number of members and C = total cost of parts
• Current cost per person: C/n
• If 3 join: C/(n+3) = C/n - 8
  → Rearranging: Cn = C(n+3) - 8n(n+3)
  → 0 = 3C - 8n² - 24n
  → C = (8n² + 24n)/3
• If 2 leave: C/(n-2) = C/n + 12
  → Rearranging: Cn = C(n-2) + 12n(n-2)
  → 2C = 12n² - 24n
  → C = 6n² - 12n
• Setting equal: (8n² + 24n)/3 = 6n² - 12n
  → 8n² + 24n = 18n² - 36n
  → 10n² - 60n = 0
  → 10n(n - 6) = 0
  → n = 6 (since n > 0)
• Verification: If n = 6, then C = 144
  → Current: 144/6 = $24
  → If 3 join (9 total): 144/9 = $16, which is $8 less ✓
  → If 2 leave (4 total): 144/4 = $36, which is $12 more ✓
• Therefore, the answer is E because the actual number of members is 6, which is not among options A-D'
WHERE id = 'edde0299-1763-4d87-b9bd-1055fa9c05d9';
```

**Fix Status:** [ ] Not Applied

---

## 📝 Error Log Template

When adding errors, use this format:

```markdown
---

### Error #[NUMBER]: [QUESTION_ID]

**Session:** [SESSION_NUMBER]
**Date Found:** YYYY-MM-DD
**Reviewed By:** [Claude/Human]

#### Question Details
- **Section:** [e.g., Mathematics Reasoning]
- **Mode:** [e.g., practice_1]
- **Question Order:** [e.g., 5]
- **Sub-skill:** [e.g., Fractions, Decimals & Percentages]
- **Difficulty:** [1-5]

#### Error Classification
- **Error Code:** [E1/E2/E3/E4/E5/E6/E7/E8]
- **Severity:** [Low/Medium/High/Critical]

#### Question Content
**Question Text:**
[Full question text here]

**Options (Database):**
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
- E) [Option E]

**Database Correct Answer:** [e.g., A]
**Database Solution:**
[Solution text from database]

#### Audit Analysis
**Independent Solution:**
[Your working/solution here]

**Actual Correct Answer:** [e.g., B]

**Error Description:**
[Explain what's wrong - be specific]

**Recommended Fix:**
[Describe what should be changed]

#### SQL Fix
```sql
-- Fix for Question ID: [QUESTION_ID]
UPDATE questions_v2
SET
  correct_answer = '[NEW_ANSWER]',  -- if needed
  solution = '[NEW_SOLUTION]',       -- if needed
  answer_options = '[NEW_OPTIONS]'   -- if needed (JSONB format)
WHERE id = '[QUESTION_ID]';
```

**Fix Status:** [ ] Not Applied / [ ] Applied / [✓] Verified

---
```

---

## 📊 Errors by Section

### Mathematics Reasoning
- **Total Errors:** 0
- **Fixed:** 0
- **Pending:** 0

### General Ability - Quantitative
- **Total Errors:** 0
- **Fixed:** 0
- **Pending:** 0

### General Ability - Verbal
- **Total Errors:** 0
- **Fixed:** 0
- **Pending:** 0

### Reading Reasoning
- **Total Errors:** 0
- **Fixed:** 0
- **Pending:** 0

---

## 🔧 Quick Fix Reference

### Common Fix Patterns

#### Wrong Correct Answer (E1)
```sql
UPDATE questions_v2
SET correct_answer = 'B'  -- change A to B
WHERE id = 'question-id-here';
```

#### Wrong Solution (E4)
```sql
UPDATE questions_v2
SET solution = 'New correct solution text here...'
WHERE id = 'question-id-here';
```

#### Duplicate Options (E3)
```sql
UPDATE questions_v2
SET answer_options = jsonb_set(
  answer_options,
  '{2}',  -- index of option C (0-indexed)
  '"C) New unique option"'
)
WHERE id = 'question-id-here';
```

#### Both Answer & Solution (E1 + E4)
```sql
UPDATE questions_v2
SET
  correct_answer = 'C',
  solution = 'New correct solution...'
WHERE id = 'question-id-here';
```

---

## 📈 Error Rate Analysis

_(Will be populated after first 100 questions reviewed)_

**Target Error Rate:** <5% (excellent quality)
**Acceptable Error Rate:** 5-10% (good quality)
**Concerning Error Rate:** >10% (needs review)

**Current Error Rate:** N/A (0 questions reviewed)

---

## 🎯 High-Priority Errors

Errors marked as **Critical** or **High** severity that need immediate attention:

_(None found yet)_

---

**Next Steps:**
1. Begin audit of Mathematics Reasoning - Practice Test 1
2. Document any errors found using the template above
3. Create SQL fixes in `sql-fixes/incremental_session_1.sql`
4. Update error counts in this file
