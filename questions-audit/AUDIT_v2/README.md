# VIC Selective Entry - Comprehensive Question Audit v2

**Audit Start Date:** 2026-04-07
**Status:** 🟡 In Progress
**Total Questions:** 994 (excluding Writing)
**Reviewed:** 0
**Completion:** 0.0%

---

## 📋 Quick Start

### For Continuing an Audit Session:

1. **Read the current status:**
   ```bash
   cat questions-audit/AUDIT_v2/PROGRESS.md
   ```

2. **Review the approach:**
   ```bash
   cat questions-audit/AUDIT_v2/APPROACH.md
   ```

3. **Fetch the next batch of questions:**
   ```bash
   # Example: Mathematics Reasoning - Practice Test 1
   npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \
     --section="Mathematics Reasoning" \
     --mode="practice_1"
   ```

4. **Begin auditing** questions one by one following the protocol in `APPROACH.md`

5. **Document errors** in `ERRORS.md` as you find them

6. **Update progress** in `PROGRESS.md` after each batch

---

## 📁 File Structure

```
AUDIT_v2/
├── README.md                    ← You are here
├── APPROACH.md                  ← Audit methodology (READ THIS FIRST!)
├── PROGRESS.md                  ← Current status & completion tracking
├── ERRORS.md                    ← All flagged questions
│
├── scripts/
│   └── fetch-questions.ts      ← Fetch questions systematically
│
├── sql-fixes/
│   ├── MASTER_FIX.sql          ← All fixes combined (run this to fix all)
│   ├── incremental_session_1.sql
│   ├── incremental_session_2.sql
│   └── ...
│
└── logs/
    ├── session_1_log.md        ← Detailed session logs
    └── ...
```

---

## 🎯 Audit Objectives

### Primary Goals:
1. ✅ Review **ALL 994 questions** individually
2. ✅ Verify correct answers are actually correct
3. ✅ Ensure all answer options are unique
4. ✅ Validate solution explanations
5. ✅ Check for ambiguous or unclear questions
6. ✅ Document ALL errors found
7. ✅ Create SQL fixes for all errors

### Quality Standards:
- **Zero tolerance** for incorrect answers marked as correct
- **Every question** must be solvable independently before seeing options
- **All errors** must be documented and fixed
- **Reproducible process** - any Claude session can continue where another left off

---

## 🔄 Audit Process (High-Level)

### 1. Fetch Questions
Use `scripts/fetch-questions.ts` to retrieve questions by section/mode

### 2. Review Questions
For each question:
- Solve independently (without seeing options first)
- Compare your answer to database
- Check for duplicate options
- Validate solution explanation
- Flag any errors

### 3. Document Errors
Add to `ERRORS.md` with full details and SQL fix

### 4. Update Progress
Mark questions as reviewed in `PROGRESS.md`

### 5. Create SQL Fixes
Add to `sql-fixes/incremental_session_X.sql` and `MASTER_FIX.sql`

---

## 📊 Current Status

**Last Updated:** 2026-04-07

| Section | Total | Reviewed | Errors | Status |
|---------|-------|----------|--------|--------|
| Mathematics Reasoning | 288 | 0 | 0 | ⚪ Not Started |
| General Ability - Quantitative | 188 | 0 | 0 | ⚪ Not Started |
| General Ability - Verbal | 292 | 0 | 0 | ⚪ Not Started |
| Reading Reasoning | 226 | 0 | 0 | ⚪ Not Started |
| **TOTAL** | **994** | **0** | **0** | **0.0%** |

See `PROGRESS.md` for detailed breakdown by mode.

---

## 🚀 Getting Started

### First Time Setup:

1. **Understand the scope:**
   - 994 questions total (6 writing questions excluded)
   - 4 sections: Math, Quantitative, Verbal, Reading
   - Each section has Practice Tests (1-5), Diagnostic, and Drills

2. **Read the approach:**
   Open `APPROACH.md` and read it thoroughly

3. **Check current progress:**
   Open `PROGRESS.md` to see what's been done

4. **Fetch first batch:**
   ```bash
   npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \
     --section="Mathematics Reasoning" \
     --mode="practice_1" \
     --limit=20
   ```

5. **Start auditing!**

---

## 📝 Example Audit Workflow

### Step-by-Step for One Question:

```
1. Question appears:
   "What is 3/4 + 1/8?"

2. Solve independently (don't look at options yet):
   3/4 = 6/8
   6/8 + 1/8 = 7/8
   My answer: 7/8

3. Now look at database answer:
   Database says: A) 5/8

4. Compare:
   My answer (7/8) ≠ Database answer (5/8)
   ❌ ERROR FOUND!

5. Check options:
   A) 5/8  ← Database says this is correct (WRONG!)
   B) 7/8  ← This is actually correct
   C) 1
   D) 4/12
   E) 11/8

6. Document in ERRORS.md:
   - Error Code: E1 (Wrong Correct Answer)
   - Database Answer: A
   - Actual Answer: B
   - SQL Fix: UPDATE questions_v2 SET correct_answer = 'B' WHERE id = '...';

7. Add SQL fix to incremental_session_X.sql

8. Update PROGRESS.md:
   - Increment "Reviewed" count
   - Increment "Errors" count

9. Continue to next question
```

---

## 🛠️ Commands Reference

### Fetch Questions

```bash
# Fetch specific section/mode
npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \
  --section="Mathematics Reasoning" \
  --mode="practice_1"

# Fetch with limit
npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \
  --section="Mathematics Reasoning" \
  --mode="practice_1" \
  --limit=20

# Fetch and save to file
npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \
  --section="Mathematics Reasoning" \
  --mode="practice_1" \
  --output="math_p1.json"
```

### Apply SQL Fixes

```bash
# Apply all fixes (careful!)
psql "$SUPABASE_DB_URL" -f questions-audit/AUDIT_v2/sql-fixes/MASTER_FIX.sql

# Or use Supabase SQL Editor:
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy contents of MASTER_FIX.sql
# 3. Paste and run
```

---

## 📈 Progress Tracking

### After Each Batch (~20-30 questions):
- [ ] Update reviewed count in `PROGRESS.md`
- [ ] Update status (⚪ → 🟡 → ✅)
- [ ] Update error count if errors found

### After Each Session:
- [ ] Create session log in `logs/session_X_log.md`
- [ ] Update `ERRORS.md` with all flagged questions
- [ ] Update `sql-fixes/incremental_session_X.sql`
- [ ] Update `MASTER_FIX.sql`
- [ ] Update completion percentage

---

## ⚠️ Important Notes

### DO:
- ✅ Solve each question independently BEFORE seeing options
- ✅ Document EVERY error, no matter how small
- ✅ Update progress after each batch
- ✅ Create SQL fixes as you go
- ✅ Read `APPROACH.md` carefully before starting

### DON'T:
- ❌ Skip questions or assume they're correct
- ❌ Look at the correct answer before solving
- ❌ Batch up errors to document later (do it immediately)
- ❌ Apply SQL fixes without testing first
- ❌ Forget to update `PROGRESS.md`

---

## 🎓 Error Codes Reference

| Code | Description |
|------|-------------|
| **E1** | Wrong Correct Answer |
| **E2** | Missing Correct Answer |
| **E3** | Duplicate Options |
| **E4** | Wrong Solution |
| **E5** | Ambiguous Question |
| **E6** | Difficulty Mismatch |
| **E7** | Formatting Error |
| **E8** | Other |

See `ERRORS.md` for detailed descriptions and examples.

---

## 📞 Support

### Questions about the audit?
1. Check `APPROACH.md` for methodology
2. Check `PROGRESS.md` for current status
3. Check `ERRORS.md` for error examples

### Database Issues?
- Check Supabase connection: `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Test connection: `npx supabase status`

---

## 🏁 Completion Checklist

When audit is 100% complete:

- [ ] All 994 questions reviewed
- [ ] All errors documented in `ERRORS.md`
- [ ] All SQL fixes in `MASTER_FIX.sql`
- [ ] All SQL fixes tested and verified
- [ ] `PROGRESS.md` shows 100% completion
- [ ] Final session log created
- [ ] User notified of completion
- [ ] SQL fixes ready to apply to production

---

**Next Action:** Read `APPROACH.md` and begin audit of Mathematics Reasoning - Practice Test 1
