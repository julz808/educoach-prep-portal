# Test Configurations Summary

**All Configured Tests & Question Counts**

---

## EduTest Scholarship (Year 7 Entry)

| Section | Questions | Sub-Skills |
|---------|-----------|------------|
| Verbal Reasoning | 60 | 8 |
| Numerical Reasoning | 50 | 4 |
| Reading Comprehension | 50 | 6 (hybrid: 43 standalone + 7 passage-based) |
| Mathematics | 60 | 6 |
| **TOTAL** | **220** | **24** |

---

## NSW Selective Entry (Year 7 Entry)

| Section | Questions | Sub-Skills |
|---------|-----------|------------|
| Reading | 30 | 5 (passage-based) |
| Mathematical Reasoning | 35 | 7 |
| Thinking Skills | 40 | 7 |
| **TOTAL** | **105** | **19** |

---

## VIC Selective Entry (Year 9 Entry)

| Section | Questions | Sub-Skills |
|---------|-----------|------------|
| Reading Reasoning | 50 | 6 (passage-based) |
| Mathematics Reasoning | 60 | 8 |
| General Ability - Verbal | 60 | 7 |
| General Ability - Quantitative | 50 | 4 |
| **TOTAL** | **220** | **25** |

---

## ACER Scholarship (Year 7 Entry)

| Section | Questions | Sub-Skills |
|---------|-----------|------------|
| Humanities | 35 | 5 (grouped) |
| Mathematics | 35 | 5 (grouped) |
| **TOTAL** | **70** | **10** |

**Note:** ACER uses a grouped approach where multiple curriculum concepts are combined into broader categories.

---

## Year 5 NAPLAN

| Section | Questions | Sub-Skills | Difficulty Levels |
|---------|-----------|------------|-------------------|
| Reading | 40 | 5 | 3 (Easy, Medium, Hard) |
| Language Conventions | 40 | 4 | 3 (Easy, Medium, Hard) |
| Numeracy | 50 | 5 | 3 (Easy, Medium, Hard) |
| Writing | 1 | 2 | 3 (Easy, Medium, Hard) |
| **TOTAL** | **131** | **16** | - |

**Note:** Year 5 NAPLAN uses **3 difficulty levels** (Easy, Medium, Hard). Complete curriculum with 56 examples (100% coverage). Updated 2026-02-22.

---

## Year 7 NAPLAN

| Section | Questions | Sub-Skills | Difficulty Levels |
|---------|-----------|------------|-------------------|
| Reading | 50 | 4 | 3 (Easy, Medium, Hard) |
| Language Conventions | 45 | 4 | 3 (Easy, Medium, Hard) |
| Numeracy No Calculator | 30 | 5 | 3 (Easy, Medium, Hard) |
| Numeracy Calculator | 35 | 5 | 3 (Easy, Medium, Hard) |
| Writing | 1 | 2 | 3 (Easy, Medium, Hard) |
| **TOTAL** | **161** | **20** | - |

**Note:** Year 7 NAPLAN uses **3 difficulty levels** (Easy, Medium, Hard). Complete curriculum with 60 examples (100% coverage). Updated 2026-02-22.

---

## Test Modes

Each test type can have multiple test modes:
- `practice_1`, `practice_2`, `practice_3`, ... (Practice tests)
- `diagnostic` (Diagnostic assessment)
- `drill` (Focused skill practice)
- `custom` (Custom practice sets)

**Each test mode is independent** - generates its own complete set of questions.

---

## Question Count Totals by Test Type

| Test Type | Total Questions | Sections | Avg Questions/Section |
|-----------|----------------|----------|---------------------|
| EduTest | 220 | 4 | 55 |
| VIC Selective | 220 | 4 | 55 |
| Year 7 NAPLAN | 160 | 4 | 40 |
| NSW Selective | 105 | 3 | 35 |
| Year 5 NAPLAN | 130 | 3 | 43 |
| ACER | 70 | 2 | 35 |

---

## Gap-Filling Behavior

The V2 engine will:

1. **Query database first** for existing questions by:
   - test_type
   - test_mode
   - section_name
   - sub_skill

2. **Calculate gaps** at sub-skill level:
   - Compare existing count vs target count
   - Only generate missing questions

3. **Load context** when generating:
   - Load all existing questions for that sub-skill
   - Ensure diversity (no duplicate scenarios)
   - Maintain quality standards

4. **Handle partial completion**:
   - If target is 8, existing is 6 → generate 2 more
   - Use existing 6 as diversity context

---

## Usage Examples

### Generate full EduTest practice_1 test:
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --mode="practice_1"
```

**First run:** Generates all 220 questions
**Second run:** Checks database, sees 220 exist, does nothing
**After deleting 5:** Checks database, sees 215 exist, generates 5 missing

### Generate VIC Selective diagnostic:
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --mode="diagnostic"
```

Generates 220 questions across 4 sections.

### Generate ACER practice_2:
```bash
npx tsx --env-file=.env scripts/generation/generate-test.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --mode="practice_2"
```

Generates 70 questions across 2 sections.

---

**Status:** Gap-filling implementation in progress
