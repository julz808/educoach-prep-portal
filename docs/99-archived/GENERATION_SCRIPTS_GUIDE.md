# Question Generation Scripts Guide

**Last Updated:** 2026-02-19
**Status:** ✅ All systems operational with nuanced duplicate detection

---

## ✅ Confirmation: Your System is Ready

When you run the generation scripts, the V2 engine will automatically:

1. **Load ALL existing questions** (up to 1000) for each sub-skill from all modes
2. **Detect gaps** by comparing existing vs target distribution
3. **Apply nuanced duplicate detection** with category-specific rules
4. **Only generate missing questions** to fill the gaps

---

## 📂 Script Locations

All generation scripts are in: `scripts/generation/`

---

## 🎯 Available Scripts (V2 Engine)

Both scripts below use the V2 engine with full duplicate detection and cross-mode diversity.

---

## 📝 Script 1: Practice Tests & Diagnostic

### `generate-section-all-modes.ts`

**Purpose:** Generate practice_1, practice_2, practice_3, practice_4, practice_5, and diagnostic modes

**Location:** `scripts/generation/generate-section-all-modes.ts`

**Features:**
- ✅ Loads ALL existing questions for comprehensive duplicate checking
- ✅ Cross-mode diversity (checks across all test modes including drills)
- ✅ Nuanced duplicate rules (verbal, maths, reading)
- ✅ Gap detection (only generates what's missing)
- ✅ Generates all test modes for one section in sequence

**Usage:**
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**Examples:**

```bash
# Generate all EduTest Verbal Reasoning practice modes
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Generate all ACER Humanities practice modes
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Generate all VIC Selective Reading Reasoning practice modes
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Reading Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

---

## 🎯 Script 2: Skill Drills

### `generate-drills-for-section.ts`

**Purpose:** Generate focused skill drills (drill_1, drill_2, ..., drill_N) for each sub-skill

**Location:** `scripts/generation/generate-drills-for-section.ts`

**Features:**
- ✅ Loads ALL existing questions from practice tests + diagnostic
- ✅ Cross-mode diversity (checks against practice_1-5, diagnostic, and other drills)
- ✅ Nuanced duplicate rules (verbal, maths, reading)
- ✅ Gap detection (only generates missing drills)
- ✅ 5-10 questions per drill (focused practice)

**Usage:**
```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Numerical Reasoning" \
  --drills-per-subskill=20
```

**Examples:**

```bash
# Generate 20 drills for each EduTest Numerical Reasoning sub-skill
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Numerical Reasoning" \
  --drills-per-subskill=20

# Generate 15 drills for each ACER Mathematics sub-skill
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Mathematics Reasoning" \
  --drills-per-subskill=15

# Generate 10 drills for each VIC Selective Verbal Reasoning sub-skill
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Verbal Reasoning" \
  --drills-per-subskill=10
```

**What are drills?**
- Focused practice on a single sub-skill
- 5 questions per drill (shorter than practice tests)
- Allows students to target weak areas
- Examples: drill_1, drill_2, drill_3, ..., drill_20

---

## 🔧 How It Works

### Step 1: Gap Detection

The script first checks what's already in the database:

```
🔍 Detecting gaps across all test modes...

📊 practice_1:
   Target: 30 questions
   Existing: 18 questions
   Gaps: 12 questions

📊 practice_2:
   Target: 30 questions
   Existing: 0 questions
   Gaps: 30 questions

📊 OVERALL SUMMARY:
   Total Target: 180 questions (6 modes × 30 questions)
   Total Existing: 18 questions
   Total Gaps: 162 questions
   Completion: 10.0%
```

### Step 2: Generate Missing Questions

For each mode with gaps:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 MODE 1/6: practice_1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Target: 30 questions
   Existing: 18 questions
   Gaps to fill: 12 questions

   🔀 Cross-mode diversity: Loading questions from ALL modes for context

   ✅ Mode Complete!
   📊 Generated: 12 questions
   💰 Cost: $0.0024
```

### Step 3: Duplicate Detection During Generation

For each question attempt, the V2 engine:

1. **Loads all existing questions** for that sub-skill (up to 1000 from all modes)
2. **Layer 1: Exact Match** - Instant check for word-for-word duplicates
3. **Layer 2: Category Rules** - Instant check for category-specific duplicates:
   - **Verbal**: Same target word + same type (opposite vs similar)
   - **Maths**: Same numbers in similar calculation
   - **Reading**: Skip to Layer 3
4. **Layer 3: Haiku LLM** - Semantic duplicate check (~2-3 sec)

If duplicate detected → Regenerate up to 3 times

---

## 📊 What You'll See in the Logs

### Successful Generation
```
✅ Question generated successfully
   Sub-skill: Vocabulary Recognition
   Duplicate checks passed: 3/3 layers
   Validation: ✓ No hallucinations | ✓ Answer verified
```

### Duplicate Detected
```
⚠️  Duplicate detected (Layer 2: Verbal)
   Reason: Both test opposite of "ABUNDANT"
   Regenerating... (Attempt 2/3)
```

### Gap Already Filled
```
✅ Already complete! (30/30 questions)
   Skipping practice_3 - all questions already generated
```

---

## ✅ Cross-Mode Diversity (Drills vs Practice/Diagnostic)

### Does drill generation check practice/diagnostic questions?

**YES!** Both scripts use `crossModeDiversity: true`:

**`generate-section-all-modes.ts`** (line 256):
```typescript
crossModeDiversity: true  // Loads from ALL modes for duplicate checking
```

**`generate-drills-for-section.ts`** (line 286):
```typescript
crossModeDiversity: true  // Loads questions from practice tests + diagnostic
```

This means:
- ✅ **Drills** check against **practice_1, practice_2, ..., practice_5, diagnostic**
- ✅ **Practice tests** check against **other practice modes, diagnostic, and drills**
- ✅ **Diagnostic** checks against **all practice modes and drills**

### Example Flow

1. Generate practice_1 for "Vocabulary Recognition"
   - Creates question: "Opposite of ABUNDANT"

2. Generate drill_1 for "Vocabulary Recognition"
   - Loads ALL existing questions (including from practice_1)
   - Won't create "Opposite of ABUNDANT" again (duplicate detected)

3. Generate diagnostic for "Vocabulary Recognition"
   - Loads ALL existing questions (including practice_1 and drill_1)
   - Won't create "Opposite of ABUNDANT" again (duplicate detected)

---

## 🎯 Complete Example Workflow

### Scenario: Generate all EduTest questions

```bash
# 1. Generate Verbal Reasoning (all modes)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# 2. Generate Numerical Reasoning (all modes)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Numerical Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# 3. Generate Reading Comprehension (all modes)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Reading Comprehension" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# 4. Generate Mathematics (all modes)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Mathematics" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

---

## 🔍 Verify Generation After Running

After running generation, you can audit for any duplicate violations:

```bash
# Run the duplicate audit script
npx tsx --env-file=.env scripts/audit/audit-duplicate-rules.ts
```

This will generate a report at `docs/DUPLICATE_VIOLATIONS_REPORT.md` showing any violations found.

---

## 📋 Available Test Types

Use these exact strings for the `--test` parameter:

- `"EduTest Scholarship (Year 7 Entry)"`
- `"ACER Scholarship (Year 7 Entry)"`
- `"NSW Selective Test (Year 7 Entry)"`
- `"VIC Selective Entry (Year 9 Entry)"`
- `"Year 5 NAPLAN"`
- `"Year 7 NAPLAN"`

---

## 📋 Available Sections by Test Type

### EduTest Scholarship (Year 7 Entry)
- Verbal Reasoning
- Numerical Reasoning
- Reading Comprehension
- Mathematics

### ACER Scholarship (Year 7 Entry)
- General Ability - Verbal
- General Ability - Quantitative
- Reading Comprehension
- Mathematics Reasoning
- Written Expression
- Humanities

### NSW Selective Test (Year 7 Entry)
- Thinking Skills
- Reading
- Mathematical Reasoning

### VIC Selective Entry (Year 9 Entry)
- Verbal Reasoning
- Numerical Reasoning
- Reading Reasoning
- Mathematics

### Year 5 NAPLAN
- Reading
- Writing
- Language Conventions
- Numeracy No Calculator
- Numeracy Calculator

### Year 7 NAPLAN
- Reading
- Writing
- Language Conventions
- Numeracy No Calculator
- Numeracy Calculator

---

## 🎯 Summary

**To generate questions:**

1. **Use** `generate-section-all-modes.ts` (V2 engine with full duplicate detection)
2. **Specify** test type, section name, and modes
3. **The system automatically:**
   - Loads ALL existing questions for duplicate checking
   - Detects gaps (only generates what's missing)
   - Applies nuanced duplicate rules
   - Validates all questions (hallucination + answer verification)

**The duplicate detection system is fully operational and will prevent:**
- ✅ Word-for-word duplicates
- ✅ Verbal: Same target word + same type
- ✅ Maths: Same numbers in similar calculations
- ✅ Reading: Same question about same passage

---

## 📚 Related Documentation

- **Duplicate Detection Rules:** `docs/DUPLICATE_DETECTION_RULES.md`
- **Implementation Status:** `docs/IMPLEMENTATION_STATUS.md`
- **V2 Engine Guide:** `docs/V2_ENGINE_COMPLETE_GUIDE.md`
- **Duplicate Violations Report:** `docs/DUPLICATE_VIOLATIONS_REPORT.md`

---

**System Status:** ✅ Ready for production generation
