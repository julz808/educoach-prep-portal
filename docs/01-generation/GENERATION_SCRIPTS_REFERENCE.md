# Generation Scripts Quick Reference

**Engine:** V2 Pattern-Based Generator (v2.2.0)
**Last Updated:** February 19, 2026
**Scripts Location:** `scripts/generation/`

## ✅ Quality Assurance Built-In

All production scripts use the V2 engine with automatic:
- ✅ **Structure Validation** - Free, instant checks
- ✅ **Correctness Verification** - Haiku LLM validates answers
- ✅ **Duplicate Detection** - Semantic duplicate checking across ALL modes
- ✅ **Cross-Mode Diversity** - Questions avoid repetition across practice/diagnostic/drills
- ✅ **Solution Quality Checks** - Detects hallucinations & overly long solutions
- ✅ **Retry Logic** - Up to 3 attempts per question

**Cost:** ~$0.01-0.03 per question (includes all validation)

---

## Prerequisites

### 1. Environment Variables

Ensure `.env` contains:

```env
ANTHROPIC_API_KEY=sk-ant-...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 2. Database Tables

The V2 engine writes to `questions_v2` and `passages_v2`. Confirm these exist:

```sql
SELECT COUNT(*) FROM questions_v2;
SELECT COUNT(*) FROM passages_v2;
```

If missing, apply the migration:

```bash
npx supabase db push
# or manually run: supabase/migrations/20260209000000_create_v2_tables.sql
```

---

## Test Types and Sections

These are the valid `--test` and `--section` values for every script:

| Test Type | Sections |
|-----------|----------|
| `EduTest Scholarship (Year 7 Entry)` | `Verbal Reasoning`, `Numerical Reasoning`, `Mathematics`, `Reading Comprehension` |
| `NSW Selective Entry (Year 7 Entry)` | `Reading`, `Mathematical Reasoning`, `Thinking Skills`, `Writing`* |
| `VIC Selective Entry (Year 9 Entry)` | `Reading Reasoning`, `Mathematics Reasoning`, `General Ability - Verbal`, `General Ability - Quantitative`, `Writing`* |
| `ACER Scholarship (Year 7 Entry)` | `Humanities`, `Mathematics`, `Written Expression`* |
| `Year 5 NAPLAN` | `Reading`, `Language Conventions`, `Numeracy`, `Writing`* |
| `Year 7 NAPLAN` | `Reading`, `Language Conventions`, `Numeracy No Calculator`, `Numeracy Calculator`, `Writing`* |

**Note:** *Writing/Written Expression sections generate essay prompts (not multiple choice questions). Each test includes 1 prompt per test mode. The generation scripts work the same way, but output writing prompts instead of MCQ.

---

## Test Modes

| Mode | Description | Difficulty Distribution |
|------|-------------|------------------------|
| `practice_1` … `practice_5` | Full practice tests (5 per product) | Balanced: 33% easy, 33% medium, 33% hard |
| `diagnostic` | Diagnostic test (1 per product) | Balanced: 33% easy, 33% medium, 33% hard |
| `drill` | Skill drills by difficulty level | Per sub-skill: 10 q × 3 levels (3-level tests) or 5 q × 6 levels (NAPLAN) |

---

## Recommended Generation Order

```
1. practice_1, practice_2, practice_3, practice_4, practice_5   (5 × full tests with balanced difficulty)
2. diagnostic                                                     (1 × diagnostic test with balanced difficulty)
3. drills                                                         (30 questions per sub-skill across all difficulty levels)
```

**Difficulty Distribution:**
- **Practice/Diagnostic Tests**: Balanced difficulty (33% easy, 33% medium, 33% hard) for realistic test simulation
- **Skill Drills**: Separate questions per difficulty level for targeted practice
  - 3-level tests: 10 questions each at difficulty 1, 2, 3 = 30 per sub-skill
  - 6-level tests (NAPLAN): 5 questions each at difficulty 1-6 = 30 per sub-skill

Generate practice + diagnostic together per section using `generate-section-all-modes.ts`, then run drills with `generate-drills-for-section.ts`.

---

## Script 1: Generate All Modes for a Section (RECOMMENDED)

**File:** `scripts/generation/generate-section-all-modes.ts`

Generates practice tests + diagnostic for one section with cross-mode diversity. This is the primary generation script — run this first for each section.

```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="<TEST_TYPE>" \
  --section="<SECTION_NAME>" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

### All Sections — Copy-Paste Commands

**EduTest Scholarship (Year 7 Entry)**
```bash
# Verbal Reasoning
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Numerical Reasoning
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Numerical Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Mathematics
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Mathematics" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Reading Comprehension
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Reading Comprehension" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**NSW Selective Entry (Year 7 Entry)**
```bash
# Reading
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --section="Reading" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Mathematical Reasoning
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --section="Mathematical Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Thinking Skills
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --section="Thinking Skills" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Writing (generates essay prompts, not MCQ)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --section="Writing" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**VIC Selective Entry (Year 9 Entry)**
```bash
# Reading Reasoning
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Reading Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Mathematics Reasoning
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Mathematics Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# General Ability - Verbal
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="General Ability - Verbal" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# General Ability - Quantitative
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="General Ability - Quantitative" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Writing (generates essay prompts, not MCQ)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Writing" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**ACER Scholarship (Year 7 Entry)**
```bash
# Humanities
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Mathematics
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Mathematics" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Written Expression (generates essay prompts, not MCQ)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Written Expression" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**Year 5 NAPLAN**
```bash
# Reading
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 5 NAPLAN" \
  --section="Reading" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Language Conventions
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 5 NAPLAN" \
  --section="Language Conventions" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Numeracy
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 5 NAPLAN" \
  --section="Numeracy" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Writing (generates essay prompts, not MCQ)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 5 NAPLAN" \
  --section="Writing" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**Year 7 NAPLAN**
```bash
# Reading
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Reading" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Language Conventions
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Language Conventions" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Numeracy No Calculator
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Numeracy No Calculator" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Numeracy Calculator
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Numeracy Calculator" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Writing (generates essay prompts, not MCQ)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Writing" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

---

## Script 2: Generate Drills for a Section

**File:** `scripts/generation/generate-drills-for-section.ts`

Generates skill drill questions for every sub-skill in a section across all difficulty levels. Run this after practice + diagnostic are complete.

**Automatic Difficulty Configuration:**
- **3-level tests** (ACER, EduTest, NSW, VIC): 10 questions × 3 difficulties = 30 per sub-skill
- **6-level tests** (NAPLAN): 5 questions × 6 difficulties = 30 per sub-skill

```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="<TEST_TYPE>" \
  --section="<SECTION_NAME>"
```

**Note:** The `--drills-per-subskill` parameter has been removed. Difficulty distribution is now automatic based on test type.

### All Sections — Copy-Paste Commands

**EduTest Scholarship (Year 7 Entry)** - 10 q × 3 difficulties per sub-skill
```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" --section="Verbal Reasoning"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" --section="Numerical Reasoning"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" --section="Mathematics"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" --section="Reading Comprehension"
```

**NSW Selective Entry (Year 7 Entry)** - 10 q × 3 difficulties per sub-skill
```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="NSW Selective Entry (Year 7 Entry)" --section="Reading"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="NSW Selective Entry (Year 7 Entry)" --section="Mathematical Reasoning"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="NSW Selective Entry (Year 7 Entry)" --section="Thinking Skills"

# Note: Writing drills generate essay prompts (5 sub-skills: Imaginative, Informative, Narrative, Personal, Persuasive)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="NSW Selective Entry (Year 7 Entry)" --section="Writing"
```

**VIC Selective Entry (Year 9 Entry)** - 10 q × 3 difficulties per sub-skill
```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="VIC Selective Entry (Year 9 Entry)" --section="Reading Reasoning"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="VIC Selective Entry (Year 9 Entry)" --section="Mathematics Reasoning"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="VIC Selective Entry (Year 9 Entry)" --section="General Ability - Verbal"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="VIC Selective Entry (Year 9 Entry)" --section="General Ability - Quantitative"

# Note: Writing drills generate essay prompts (2 sub-skills: Creative & Persuasive)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="VIC Selective Entry (Year 9 Entry)" --section="Writing"
```

**ACER Scholarship (Year 7 Entry)** - 10 q × 3 difficulties per sub-skill
```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="ACER Scholarship (Year 7 Entry)" --section="Humanities"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="ACER Scholarship (Year 7 Entry)" --section="Mathematics"

# Note: Written Expression drills generate essay prompts (2 sub-skills: Creative & Persuasive)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="ACER Scholarship (Year 7 Entry)" --section="Written Expression"
```

**Year 5 NAPLAN** - 5 q × 6 difficulties per sub-skill
```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 5 NAPLAN" --section="Reading"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 5 NAPLAN" --section="Language Conventions"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 5 NAPLAN" --section="Numeracy"

# Note: Writing drills generate essay prompts (2 sub-skills: Narrative & Persuasive)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 5 NAPLAN" --section="Writing"
```

**Year 7 NAPLAN** - 5 q × 6 difficulties per sub-skill
```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 7 NAPLAN" --section="Reading"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 7 NAPLAN" --section="Language Conventions"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 7 NAPLAN" --section="Numeracy No Calculator"

npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 7 NAPLAN" --section="Numeracy Calculator"

# Note: Writing drills generate essay prompts (2 sub-skills: Narrative & Persuasive)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 7 NAPLAN" --section="Writing"
```

---

## Passage-Based Generation (Reading/Humanities Sections)

Certain sections use **passages** (reading passages, historical texts, etc.) where multiple questions are generated per passage. These sections include:

- **EduTest**: Reading Comprehension
- **NSW Selective**: Reading
- **VIC Selective**: Reading Reasoning
- **ACER**: Humanities
- **Year 5 NAPLAN**: Reading
- **Year 7 NAPLAN**: Reading

### Key Rules for Passages

**1. Passages Are Test-Mode Specific**
- Each test mode (`practice_1`, `practice_2`, `diagnostic`, `drill`) gets its own unique set of passages
- Passages are **NEVER reused** across different test modes
- This ensures students don't see the same passage twice across different tests

**2. One Passage = Multiple Questions**
- Within a single test mode, one passage can have multiple questions
- Typical ratio: 3-5 questions per passage (varies by section config)
- All questions for a passage are generated together and link via `passage_id`

**3. Gap Detection Logic**

The V2 engine performs intelligent gap detection checking BOTH passages AND questions:

**Scenario A: Missing Passages + Questions**
```
Existing: 0 passages, 0 questions
Action: Generate new passages WITH questions
Result: Creates passages and questions together
```

**Scenario B: Have Passages, Missing Questions**
```
Existing: 43 passages, 0 questions (or partial questions)
Action: Generate questions FROM existing passages
Result: Reuses existing passages, adds missing questions
```

**Scenario C: Complete**
```
Existing: 43 passages, 195+ questions (target met)
Action: Skip generation
Result: No changes needed
```

### Smart Question Distribution

When generating questions from existing passages (Scenario B), the engine:

1. **Counts questions per passage**
   - Identifies passages with fewer questions
   - Calculates target questions per passage (e.g., 195 questions ÷ 43 passages = ~5 questions each)

2. **Prioritizes passages with gaps**
   - Sorts passages by question count (fewest first)
   - Generates questions for passages below target count
   - Distributes questions evenly across all passages

3. **Respects passage-mode linkage**
   - Only uses passages already linked to the current test mode
   - Does NOT pull passages from other test modes

### Example: NSW Selective Reading Generation

```bash
# First run: practice_1
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --section="Reading" \
  --modes="practice_1"

# Output:
# ✅ Generated 7 passages (genres: Fiction, Poetry, Non-Fiction, etc.)
# ✅ Generated 27 questions (3-5 per passage)
# ✅ All questions linked via passage_id
```

```bash
# Second run: practice_2
# Output:
# ✅ Generated 7 NEW passages (different from practice_1)
# ✅ Generated 27 questions (3-5 per passage)
# ✅ No passage duplication across modes
```

```bash
# Later: Re-running practice_1 (already has 7 passages, 27 questions)
# Output:
# ✅ All passages already exist!
# ✅ 27/27 questions already exist for practice_1. Skipping.
```

```bash
# Edge case: Has passages but missing questions
# (e.g., 43 passages but only 50 questions, need 195)
# Output:
# ✅ All passages already exist!
# 📝 Generating questions from existing passages for practice_1...
# 📊 Target: 195 questions (145 still needed)
# 📊 Smart distribution: ~5 questions per passage
# ⚡ Generated 145 questions across 43 passages
```

### Checking Passage Health

```sql
-- Check passages and questions per test mode
SELECT
  test_type,
  section_name,
  test_mode,
  COUNT(DISTINCT passage_id) FILTER (WHERE passage_id IS NOT NULL) as passages,
  COUNT(*) as questions,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT passage_id) FILTER (WHERE passage_id IS NOT NULL), 0), 1) as questions_per_passage
FROM questions_v2
GROUP BY test_type, section_name, test_mode
HAVING COUNT(DISTINCT passage_id) FILTER (WHERE passage_id IS NOT NULL) > 0
ORDER BY test_type, section_name, test_mode;
```

```sql
-- Find orphaned passages (passages with no questions)
SELECT p.id, p.test_type, p.section_name, p.test_mode, p.passage_type, LEFT(p.title, 50) as title
FROM passages_v2 p
LEFT JOIN questions_v2 q ON q.passage_id = p.id
WHERE q.id IS NULL
ORDER BY p.test_type, p.section_name, p.test_mode;
```

```sql
-- Find orphaned questions (questions missing passage_id for reading sections)
SELECT
  test_type,
  section_name,
  test_mode,
  COUNT(*) as orphaned_questions
FROM questions_v2
WHERE passage_id IS NULL
  AND section_name IN ('Reading', 'Reading Comprehension', 'Reading Reasoning', 'Humanities')
GROUP BY test_type, section_name, test_mode
HAVING COUNT(*) > 0
ORDER BY test_type, section_name, test_mode;
```

### Passage Configuration by Section

Each reading/humanities section defines:
- **total_passages**: Target number of passages per test mode
- **questions_per_passage**: How many questions to generate per passage
- **passage_types**: Distribution of passage types (Fiction, Non-Fiction, Poetry, etc.)

Example from `sectionConfigs.ts`:

```typescript
{
  test_type: "NSW Selective Entry (Year 7 Entry)",
  section_name: "Reading",
  total_passages: 7,              // 7 passages per test mode
  questions_per_passage: 4,       // ~4 questions each
  total_questions: 27,            // Total = 27 questions
  passage_types: {
    "Fiction": 2,
    "Non-Fiction": 2,
    "Poetry": 1,
    "News Article": 1,
    "Opinion Piece": 1
  }
}
```

This ensures:
- ✅ Each test mode has unique passages
- ✅ Questions are evenly distributed across passages
- ✅ Diverse passage types for comprehensive assessment
- ✅ No duplicate passages across different tests

---

## Monitoring and Verification

### Check Question Counts

```sql
-- Count by test type, section, and mode
SELECT test_type, section_name, test_mode, COUNT(*) AS count
FROM questions_v2
GROUP BY test_type, section_name, test_mode
ORDER BY test_type, section_name, test_mode;
```

```sql
-- Count by test type only (high-level overview)
SELECT test_type, COUNT(*) AS total
FROM questions_v2
GROUP BY test_type
ORDER BY test_type;
```

```sql
-- Check passage counts
SELECT test_type, section_name, COUNT(*) AS passages
FROM passages_v2
GROUP BY test_type, section_name
ORDER BY test_type, section_name;
```

```sql
-- Check quality scores
SELECT
  test_type,
  section_name,
  ROUND(AVG((generation_metadata->>'quality_score')::numeric), 1) AS avg_quality,
  MIN((generation_metadata->>'quality_score')::numeric) AS min_quality,
  COUNT(*) AS total
FROM questions_v2
WHERE generation_metadata->>'quality_score' IS NOT NULL
GROUP BY test_type, section_name
ORDER BY avg_quality DESC;
```

### Verify Engine is Working

```bash
npx tsx --env-file=.env scripts/generation/verify-v2-engine.ts
```

---

## Cost Estimates

| Scope | Questions | Approx Cost |
|-------|-----------|-------------|
| One section × 6 modes | ~200–400 q | ~$4–9 |
| One full product (all sections, 6 modes) | ~1,000–1,800 q | ~$22–40 |
| All 6 products (all sections, 6 modes) | ~8,000–12,000 q | ~$175–265 |
| Drills — one section (20 drills × N sub-skills × 5 q) | varies | ~$1–3 per sub-skill |

Pricing basis: Sonnet 4.5 at $3/1M input + $15/1M output tokens; Haiku 4 validation adds ~$0.0002/question.

---

## Troubleshooting

**"No configuration found for: ..."**
The `--test` or `--section` value is wrong. Copy exactly from the table above — these values are case-sensitive.

**`passages_v2.year_level NOT NULL violation`**
This was a known bug fixed in v2.2.0. Ensure you're on the latest engine code.

**`claude-sonnet-4-20250514: model not found`**
Old model ID. Ensure `config.ts` has `claude-sonnet-4-5-20250514` (with the `-5-` in the name).

**Questions already exist — script does nothing**
The gap detection is working correctly. The engine only generates what's missing. To regenerate, delete existing rows from `questions_v2` for that test type / section / mode first.

**Visual generation timeout**
Visual generation (geometry diagrams, charts) uses Opus 4.5 and can take 20–40s. The engine has a 60s timeout. If it fires frequently, check your network or API rate limits.

**Sub-skill name mismatch error**
Sub-skill names in scripts must match exactly what's in `curriculumData_v2`. Use the verify script to list valid sub-skill names:
```bash
npx tsx --env-file=.env scripts/generation/verify-v2-engine.ts
```

---

## Validation & Quality Control Details

### What Runs Automatically

Every question generated goes through these checks (no configuration needed):

#### 1. Structure Validation (Free, Instant)
- Question text not empty
- Multiple choice has exactly 4 options
- Correct answer is valid
- Solution not too long (>200 words flagged)
- All required fields present

#### 2. Correctness Verification (Haiku LLM, ~$0.0002/question)
- Verifies correct answer is actually correct
- Verifies distractors are actually wrong
- Checks reasoning is sound
- **Only runs for multiple choice** (writing prompts are subjective)

#### 3. Duplicate Detection (Haiku LLM, ~$0.0002/question)
- Compares against recent questions for same sub-skill
- Detects semantic duplicates (not just exact text matches)
- Checks across ALL test modes when `crossModeDiversity: true`
- Uses up to 1000 existing questions for comprehensive checking

#### 4. Retry Logic
- Up to 3 attempts per question if validation fails
- Different examples used on each retry
- Configurable delay between retries

### Quality Metrics Stored

Each question includes comprehensive metadata:

```typescript
{
  quality_score: 100,                    // Overall score (0-100)
  validated_by: "claude-haiku-4-v2",     // Validator model

  generation_metadata: {
    attempt_number: 1,                   // Which attempt succeeded
    model: "claude-sonnet-4-5-20250514",
    examples_used: 2,                    // Number of examples in prompt
    pattern_type: "analogies"
  },

  validation_metadata: {
    hallucination_check: {
      passed: true,
      issues_found: []
    },
    answer_verification: {
      passed: true,
      confidence: 95,
      method: "haiku-verification"
    },
    quality_checks: {
      style_match: 100,
      difficulty_match: 95,
      curriculum_alignment: 100
    }
  }
}
```

### Checking Quality After Generation

```sql
-- Overall quality scores
SELECT
  test_type,
  section_name,
  test_mode,
  ROUND(AVG(quality_score), 1) as avg_quality,
  MIN(quality_score) as min_quality,
  MAX(quality_score) as max_quality,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE quality_score >= 90) as excellent,
  COUNT(*) FILTER (WHERE quality_score < 80) as needs_review
FROM questions_v2
WHERE quality_score IS NOT NULL
GROUP BY test_type, section_name, test_mode
ORDER BY test_type, section_name, test_mode;

-- Validation pass rates
SELECT
  test_type,
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE quality_score >= 90) as high_quality,
  COUNT(*) FILTER (WHERE quality_score BETWEEN 80 AND 89) as good_quality,
  COUNT(*) FILTER (WHERE quality_score < 80) as low_quality,
  ROUND(100.0 * COUNT(*) FILTER (WHERE quality_score >= 80) / COUNT(*), 1) as pass_rate_pct
FROM questions_v2
WHERE quality_score IS NOT NULL
GROUP BY test_type
ORDER BY pass_rate_pct DESC;

-- Find questions that need review
SELECT
  test_type,
  section_name,
  sub_skill,
  difficulty,
  LEFT(question_text, 100) as question_preview,
  quality_score,
  validation_metadata->'answer_verification'->>'confidence' as answer_confidence,
  generation_metadata->>'attempt_number' as attempts_needed
FROM questions_v2
WHERE quality_score < 80
ORDER BY quality_score ASC, test_type, section_name
LIMIT 20;
```

### Expected Quality Benchmarks

Based on V2 engine performance:

| Metric | Target | Typical |
|--------|--------|---------|
| **Overall Pass Rate** | >95% | 97-99% |
| **High Quality (90+)** | >85% | 90-95% |
| **First Attempt Success** | >80% | 85-90% |
| **Duplicate Rate** | <1% | 0.1-0.5% |
| **Hallucination Rate** | <0.5% | 0.1-0.3% |

If your metrics fall below these targets, check:
- Sub-skill has enough example questions
- Examples are high quality and diverse
- Pattern definitions are clear
- Difficulty level is appropriate for year level
