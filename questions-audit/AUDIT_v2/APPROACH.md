# VIC Selective Entry - Comprehensive Question Audit v2
## Systematic Approach Document

**Last Updated:** 2026-04-07
**Audit Status:** In Progress
**Current Session:** 1

---

## 🎯 Objective

Complete a **rigorous, question-by-question audit** of ALL VIC Selective Entry test questions to identify and fix errors including:

1. Incorrect answers marked as correct
2. Correct answer not in the options
3. Duplicate answer options
4. Wrong feedback ("not quite right" when answer IS right)
5. Ambiguous wording or unclear questions
6. Missing context or insufficient information
7. Difficulty level mismatches

---

## 📊 Audit Scope

### Total Questions: **994 questions** (excluding Writing)

#### Breakdown by Section:
| Section | Practice 1-5 | Diagnostic | Drills | **Total** |
|---------|-------------|-----------|--------|-----------|
| **Mathematics Reasoning** | 167 | 17 | 104 | **288** |
| **General Ability - Quantitative** | 165 | 16 | 7 | **188** |
| **General Ability - Verbal** | 202 | 30 | 60 | **292** |
| **Reading Reasoning** | 134 | 26 | 66 | **226** |
| **Writing** | 5 | 1 | 0 | **6** (EXCLUDED) |

**Note:** Writing questions are EXCLUDED from this audit (as per user request).

---

## 🔄 Audit Order (STRICT)

### Order: **By Section, Starting with Maths**

1. **Mathematics Reasoning** (288 questions)
   - Practice Test 1 → 2 → 3 → 4 → 5
   - Then Diagnostic
   - Then Drills

2. **General Ability - Quantitative** (188 questions)
   - Practice Test 1 → 2 → 3 → 4 → 5
   - Then Diagnostic
   - Then Drills

3. **General Ability - Verbal** (292 questions)
   - Practice Test 1 → 2 → 3 → 4 → 5
   - Then Diagnostic
   - Then Drills

4. **Reading Reasoning** (226 questions)
   - Practice Test 1 → 2 → 3 → 4 → 5
   - Then Diagnostic
   - Then Drills

---

## 📋 Question Review Protocol

### For EACH Question:

#### Step 1: Fetch Question Data
- Retrieve from `questions_v2` table
- Include: `question_text`, `answer_options`, `correct_answer`, `solution`, `passage_id`, `has_visual`

#### Step 2: Independent Solution
**CRITICAL:** Solve the question **WITHOUT seeing the options or correct answer first**
- Read question text only
- For passage-based questions: Read passage from `passages_v2` first
- Solve independently
- Write down your answer

#### Step 3: Compare & Validate
1. **Compare your answer to `correct_answer` in database**
   - Does it match? ✅ or ❌
2. **Check if your answer exists in `answer_options`**
   - Is it one of the options? ✅ or ❌
3. **Check for duplicate options**
   - Are any options identical? ✅ or ❌
4. **Validate solution explanation**
   - Does `solution` correctly explain how to get `correct_answer`? ✅ or ❌
5. **Check for ambiguity**
   - Is the question clear and unambiguous? ✅ or ❌

#### Step 4: Flag Errors
If ANY validation fails:
- Log to `ERRORS.md`
- Write SQL fix to `sql-fixes/incremental_[session_number].sql`
- Update `sql-fixes/MASTER_FIX.sql`

#### Step 5: Update Progress
- Mark question as reviewed in `PROGRESS.md`
- Update completion percentage
- Note any special cases

---

## 🗂️ Documentation Structure

### File System:
```
questions-audit/AUDIT_v2/
├── APPROACH.md                          ← This file (methodology)
├── PROGRESS.md                          ← Current audit status
├── ERRORS.md                            ← All flagged questions
├── sql-fixes/
│   ├── MASTER_FIX.sql                  ← All fixes combined
│   ├── incremental_session_1.sql       ← Session 1 fixes
│   ├── incremental_session_2.sql       ← Session 2 fixes
│   └── ...
├── scripts/
│   ├── fetch-questions.ts              ← Fetch questions by section/mode
│   └── verify-fixes.ts                 ← Verify SQL fixes applied
└── logs/
    ├── session_1_log.md                ← Detailed session 1 log
    ├── session_2_log.md                ← Detailed session 2 log
    └── ...
```

---

## 📦 Batch Size

- **~100 questions per session** (to stay within memory limits)
- **Document progress after each batch**
- **Create incremental SQL file per session**

---

## 🛠️ Tools & Scripts

### Fetch Questions Script
Use `scripts/fetch-questions.ts` to retrieve questions in the correct order.

**Example Usage:**
```bash
# Fetch Mathematics Reasoning - Practice Test 1
npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \
  --section="Mathematics Reasoning" \
  --mode="practice_1"
```

### Verify Fixes Script
After applying SQL fixes, verify they worked:
```bash
npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/verify-fixes.ts
```

---

## 🚨 Special Cases

### Visual Questions
- **Status:** 0 visual questions in VIC Selective (as of 2026-04-07)
- **Action:** If visual question found, include `has_visual` and `visual_data` in review

### Passage-Based Questions
- **Total:** 162 passage-based questions
- **Action:** Always fetch passage from `passages_v2` table first
- **Note:** Same passage may be reused, but questions should be unique

### Number Grid Questions
- **Format:** Grid-based puzzles with patterns
- **Action:** Carefully verify pattern logic

---

## 🔄 Session Handoff Protocol

### When Starting a New Session:

1. **Read `PROGRESS.md`** to see what's been completed
2. **Check `ERRORS.md`** to understand errors found so far
3. **Continue from "Current Position"** in `PROGRESS.md`
4. **Create new session log** in `logs/session_X_log.md`
5. **Create new incremental SQL** in `sql-fixes/incremental_session_X.sql`

### When Ending a Session:

1. **Update `PROGRESS.md`** with:
   - Current position (section, mode, question number)
   - Questions reviewed this session
   - Errors found this session
   - Completion percentage
2. **Save all flagged errors** to `ERRORS.md`
3. **Commit incremental SQL fixes** to `sql-fixes/incremental_session_X.sql`
4. **Update `MASTER_FIX.sql`** with new fixes
5. **Save session log** to `logs/session_X_log.md`

---

## 📊 Error Categories

When logging errors, categorize as:

| Code | Category | Description |
|------|----------|-------------|
| `E1` | **Wrong Correct Answer** | Answer marked as correct is actually wrong |
| `E2` | **Missing Correct Answer** | Correct answer not in options |
| `E3` | **Duplicate Options** | Two or more identical answer options |
| `E4` | **Wrong Solution** | Solution explains wrong answer or wrong logic |
| `E5` | **Ambiguous Question** | Question unclear or missing context |
| `E6` | **Difficulty Mismatch** | Question too easy/hard for assigned difficulty |
| `E7` | **Formatting Error** | Options not properly formatted |
| `E8` | **Other** | Any other error type |

---

## ✅ Success Criteria

Audit is complete when:
- ✅ All 994 questions reviewed individually
- ✅ All errors logged in `ERRORS.md`
- ✅ All fixes documented in `MASTER_FIX.sql`
- ✅ `PROGRESS.md` shows 100% completion
- ✅ SQL fixes tested and verified

---

## 🔑 Database Info

### Main Table: `questions_v2`
```sql
SELECT
  id,
  test_type,
  test_mode,
  section_name,
  sub_skill,
  question_text,
  answer_options,  -- JSONB array
  correct_answer,  -- e.g., 'A', 'B', 'C', 'D', 'E'
  solution,
  difficulty,
  passage_id,
  has_visual,
  visual_data,
  question_order,
  created_at
FROM questions_v2
WHERE test_type = 'VIC Selective Entry (Year 9 Entry)'
ORDER BY section_name, test_mode, question_order;
```

### Passages Table: `passages_v2`
```sql
SELECT
  id,
  passage_text,
  topic,
  difficulty_level,
  word_count
FROM passages_v2
WHERE test_type = 'VIC Selective Entry (Year 9 Entry)';
```

---

## 📝 Sample Error Log Entry

```markdown
### Question ID: abc123...
- **Section:** Mathematics Reasoning
- **Mode:** practice_1
- **Order:** 5
- **Error Code:** E1 (Wrong Correct Answer)
- **Question:** What is 3/4 + 1/8?
- **Options:** A) 5/8  B) 7/8  C) 1  D) 4/12  E) 11/8
- **Database Correct Answer:** A
- **Actual Correct Answer:** B
- **Explanation:** 3/4 = 6/8, so 6/8 + 1/8 = 7/8
- **SQL Fix:** UPDATE questions_v2 SET correct_answer = 'B' WHERE id = 'abc123...';
```

---

## 🎯 Remember

1. **Independence is key** - Solve WITHOUT seeing options first
2. **Document everything** - Every error, every session
3. **Follow the order** - Don't skip around
4. **Update after each batch** - Don't wait until end of session
5. **Test your SQL** - Verify fixes work before moving on

---

**Start Position:** Mathematics Reasoning → Practice Test 1 → Question 1
**Next Session:** Read `PROGRESS.md` to continue from current position
