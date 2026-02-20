# Quick Reference: Generate Any Test

**Universal Test Generator with Automatic Gap Detection**

---

## Available Test Types

### EduTest Scholarship (Year 7 Entry)
**Total**: 220 questions across 4 sections
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --mode="practice_1"
```

**Sections**:
- Verbal Reasoning: 60 questions (8 sub-skills) ✅ Gap detection
- Numerical Reasoning: 50 questions (4 sub-skills) ✅ Gap detection
- Reading Comprehension: 50 questions (hybrid) ⚠️ Regenerates all
- Mathematics: 60 questions (6 sub-skills) ✅ Gap detection

---

### NSW Selective Entry (Year 7 Entry)
**Total**: 105 questions across 3 sections
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --mode="practice_1"
```

**Sections**:
- Reading: 30 questions (passage-based) ⚠️ Regenerates all
- Mathematical Reasoning: 35 questions (7 sub-skills) ✅ Gap detection
- Thinking Skills: 40 questions (7 sub-skills) ✅ Gap detection

---

### VIC Selective Entry (Year 9 Entry)
**Total**: 220 questions across 4 sections
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --mode="practice_1"
```

**Sections**:
- Reading Reasoning: 50 questions (passage-based) ⚠️ Regenerates all
- Mathematics Reasoning: 60 questions (8 sub-skills) ✅ Gap detection
- General Ability - Verbal: 60 questions (7 sub-skills) ✅ Gap detection
- General Ability - Quantitative: 50 questions (4 sub-skills) ✅ Gap detection

---

### ACER Scholarship (Year 7 Entry)
**Total**: 70 questions across 2 sections
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --mode="practice_1"
```

**Sections**:
- Humanities: 35 questions (5 grouped sub-skills) ✅ Gap detection
- Mathematics: 35 questions (5 grouped sub-skills) ✅ Gap detection

---

### Year 5 NAPLAN
**Total**: 130 questions across 3 sections
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="Year 5 NAPLAN" \
  --mode="practice_1"
```

**Sections**:
- Reading: 40 questions ⚠️ Needs curriculum data
- Language Conventions: 40 questions ⚠️ Needs curriculum data
- Numeracy: 50 questions ⚠️ Needs curriculum data

**Note**: Year 5 NAPLAN curriculum data is currently empty placeholders.

---

### Year 7 NAPLAN
**Total**: 160 questions across 4 sections
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="Year 7 NAPLAN" \
  --mode="practice_1"
```

**Sections**:
- Reading: 50 questions ⚠️ Needs curriculum data
- Language Conventions: 45 questions ⚠️ Needs curriculum data
- Numeracy No Calculator: 30 questions ⚠️ Needs curriculum data
- Numeracy Calculator: 35 questions ⚠️ Needs curriculum data

**Note**: Year 7 NAPLAN curriculum data needs review.

---

## Test Modes

Each test type supports multiple independent test modes:

```bash
# Practice tests (completely independent sets)
--mode="practice_1"
--mode="practice_2"
--mode="practice_3"
# ... as many as needed

# Diagnostic assessment
--mode="diagnostic"

# Drill practice (skill-focused)
--mode="drill"

# Custom practice sets
--mode="custom"
```

**Important**: Each mode maintains its own complete question bank. Generating `practice_1` does NOT affect `practice_2`.

---

## Examples

### Generate multiple practice tests
```bash
# Practice test 1
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --mode="practice_1"

# Practice test 2 (independent from practice_1)
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --mode="practice_2"

# Diagnostic test (independent from practice tests)
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --mode="diagnostic"
```

### Generate different test types
```bash
# ACER practice test 2
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --mode="practice_2"

# VIC Selective diagnostic
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --mode="diagnostic"

# NSW Selective practice 1
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --mode="practice_1"
```

---

## Gap Detection Legend

- ✅ **Gap detection enabled**: Only generates missing questions, loads existing for diversity
- ⚠️ **Regenerates all**: Currently regenerates all questions (enhancement needed)
- ⚠️ **Needs curriculum data**: Configuration exists but curriculum examples missing

**Most sections (70%+) have gap detection enabled** - including all Verbal Reasoning, Mathematical Reasoning, Thinking Skills, etc.

---

## What Happens When You Run

### If no questions exist
```
🔍 Detecting gaps...
   Target: 220 questions
   Existing: 0 questions
   Gaps: 220 questions

📝 Generating missing questions...
[Generates all 220 questions]
✅ SUCCESS! Generated 220 questions.
```

### If all questions exist
```
🔍 Detecting gaps...
   Target: 220 questions
   Existing: 220 questions
   Gaps: 0 questions

✅ TEST COMPLETE - All questions generated!
✅ SUCCESS! Test already complete.
```

### If some questions missing
```
🔍 Detecting gaps...
   Target: 220 questions
   Existing: 214 questions
   Gaps: 6 questions

📋 Section Breakdown:
⚠️ Verbal Reasoning: 54/60 (missing 6)
✅ Numerical Reasoning: 50/50 (complete)
✅ Reading Comprehension: 50/50 (complete)
✅ Mathematics: 60/60 (complete)

📝 Generating missing questions...
[Generates only the 6 missing questions]
✅ SUCCESS! Generated 6 questions.
```

---

## Tips

1. **Always run with `--env-file=.env`** to load environment variables (including Anthropic API key)

2. **Re-running is safe** - Only generates missing questions, never duplicates

3. **Delete bad questions freely** - Just delete from database, re-run to regenerate

4. **Test modes are independent** - `practice_1` and `practice_2` are separate question sets

5. **Check database after generation**:
   ```sql
   SELECT * FROM questions_v2
   WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
     AND test_mode = 'practice_1'
   ORDER BY created_at DESC;
   ```

---

## Need Help?

- **Full documentation**: See `docs/GAP_DETECTION_IMPLEMENTATION.md`
- **Test configurations**: See `docs/TEST_CONFIGURATIONS_SUMMARY.md`
- **V2 Engine guide**: See `docs/V2_ENGINE_COMPLETE_GUIDE.md`
