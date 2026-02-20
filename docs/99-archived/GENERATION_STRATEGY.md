# Question Generation Strategy - Section-First Approach

**Last Updated**: February 13, 2026

---

## 🎯 Recommended Approach: Section-First Generation

Generate ALL test modes for a SINGLE section at once, with cross-mode diversity checking.

### Why Section-First?

✅ **Maximum diversity**: Questions across all test modes are generated together with full context
✅ **Consistent quality**: Same generation session = consistent standards
✅ **Better variety tracking**: Tracks scenarios/names across ALL 360+ questions per section
✅ **Logical grouping**: All Verbal Reasoning together, all Math together
✅ **Easier review**: Review all questions for a skill area at once
✅ **Cost efficient**: Batch API calls, shared context loading

---

## 📦 Product Offering Structure

**Per Package** ($199 AUD):
- 1× Diagnostic test
- 5× Practice tests (practice_1 through practice_5)
- 20× Skill drills per sub-skill

**Example for EduTest Verbal Reasoning** (24 sub-skills):
- 1× Diagnostic = 60 questions
- 5× Practice tests = 300 questions
- 20× drills × 24 sub-skills = **480 drills** (~2,400 questions if 5 questions/drill)

**Total per section**: ~2,760 questions

---

## 🚀 Generation Workflow

### Step 1: Generate One Section Across All Modes

```bash
# Generate EduTest - Verbal Reasoning (all modes)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**What happens**:
1. Detects gaps for each mode (practice_1, practice_2, ..., diagnostic)
2. For each mode with gaps:
   - Loads questions from **ALL modes** for diversity context
   - Generates only missing questions
   - Ensures questions are unique across all 6 test modes

**Output**: 360 questions (60 per mode × 6 modes)

---

### Step 2: Generate Skill Drills for Section

```bash
# Generate drills for all Verbal Reasoning sub-skills
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --drills-per-subskill=20
```

**What happens**:
1. For each sub-skill in Verbal Reasoning:
   - Generates 20 drills (test_mode = "drill_1", "drill_2", ..., "drill_20")
   - Each drill has 5-10 questions
   - Uses cross-mode diversity (loads from practice + diagnostic too)

**Output**: ~2,400 drill questions (varies by sub-skill count)

---

### Step 3: Repeat for Next Section

```bash
# Generate EduTest - Numerical Reasoning (all modes)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Numerical Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

Continue until all sections are complete.

---

## 📊 Cross-Mode Diversity Checking

### How It Works

When generating `practice_2`, the engine:

1. **Loads ALL existing questions** for the sub-skill being generated
   - From `practice_1`: 8 questions
   - From `diagnostic`: 8 questions
   - From `practice_2`: 6 questions (if partial)
   - **Total context**: 22 questions

2. **Shows 5-10 most recent** questions to the LLM in the prompt
   - Example: "Here are existing questions. DO NOT create similar ones."

3. **Tracks all scenarios/names/numbers** across entire sub-skill history
   - Ensures `practice_2 Q1` doesn't use same scenario as `practice_1 Q1`

### Benefits

✅ **No duplicate scenarios** across practice_1, practice_2, ..., diagnostic
✅ **Better variety** in the entire question bank (300+ questions per sub-skill)
✅ **Consistent difficulty** across all test modes

---

## 🗂️ Complete Generation Plan by Test Type

### EduTest Scholarship (Year 7 Entry)

**4 Sections**: Verbal Reasoning, Numerical Reasoning, Reading Comprehension, Mathematics

#### Section 1: Verbal Reasoning
```bash
# Practice + Diagnostic (360 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Drills (~2,400 questions)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --drills-per-subskill=20
```

#### Section 2: Numerical Reasoning
```bash
# Practice + Diagnostic (300 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Numerical Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Drills (~1,600 questions)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Numerical Reasoning" \
  --drills-per-subskill=20
```

#### Section 3: Reading Comprehension
```bash
# Practice + Diagnostic (300 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Reading Comprehension" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Drills (~1,600 questions)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Reading Comprehension" \
  --drills-per-subskill=20
```

#### Section 4: Mathematics
```bash
# Practice + Diagnostic (360 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Mathematics" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Drills (~2,000 questions)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Mathematics" \
  --drills-per-subskill=20
```

**Total for EduTest**: ~9,920 questions

---

### ACER Scholarship (Year 7 Entry)

**2 Sections**: Humanities, Mathematics

#### Section 1: Humanities
```bash
# Practice + Diagnostic (210 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Drills (~1,000 questions)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --drills-per-subskill=20
```

#### Section 2: Mathematics
```bash
# Practice + Diagnostic (210 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Mathematics" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Drills (~1,000 questions)
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Mathematics" \
  --drills-per-subskill=20
```

**Total for ACER**: ~2,420 questions

---

### VIC Selective Entry (Year 9 Entry)

**4 Sections**: Reading Reasoning, Mathematics Reasoning, General Ability - Verbal, General Ability - Quantitative

Similar pattern - generate each section across all 6 modes, then drills.

**Total for VIC Selective**: ~10,000 questions

---

### NSW Selective Entry (Year 7 Entry)

**3 Sections**: Reading, Mathematical Reasoning, Thinking Skills

Similar pattern - generate each section across all 6 modes, then drills.

**Total for NSW Selective**: ~6,000 questions

---

## 🎓 Test Modes Explained

### Practice Tests (practice_1 through practice_5)
- Complete full-length practice tests
- Same structure as real exam
- Independent question sets
- Used for: Timed practice, progress tracking

### Diagnostic Test
- Complete full-length test
- Used for: Initial assessment, identifying weak areas
- Generates personalized learning path

### Skill Drills (drill_1 through drill_20)
- Focused practice on specific sub-skill
- 5-10 questions per drill
- Used for: Targeted improvement, mastering specific skills

---

## 💡 Best Practices

### 1. Generate by Section, Not by Test Mode
❌ **Don't**: Generate practice_1 (all sections), then practice_2 (all sections)
✅ **Do**: Generate Verbal Reasoning (all modes), then Numerical Reasoning (all modes)

### 2. Enable Cross-Mode Diversity
✅ **Always** use `crossModeDiversity: true` when generating
✅ This ensures questions are unique across ALL test modes

### 3. Review by Section
✅ Review all Verbal Reasoning questions together (easier to spot patterns)
✅ Check quality across all modes before moving to next section

### 4. Generate Drills After Practice Tests
✅ Generate practice + diagnostic first (360 questions)
✅ Then generate drills (2,400 questions)
✅ Drills benefit from having practice test context for diversity

---

## 📈 Progress Tracking

Use this checklist when generating for a test type:

### EduTest Scholarship (Year 7 Entry)
- [ ] Verbal Reasoning - Practice + Diagnostic (360 questions)
- [ ] Verbal Reasoning - Drills (2,400 questions)
- [ ] Numerical Reasoning - Practice + Diagnostic (300 questions)
- [ ] Numerical Reasoning - Drills (1,600 questions)
- [ ] Reading Comprehension - Practice + Diagnostic (300 questions)
- [ ] Reading Comprehension - Drills (1,600 questions)
- [ ] Mathematics - Practice + Diagnostic (360 questions)
- [ ] Mathematics - Drills (2,000 questions)

**Total**: ~9,920 questions

---

## ⚙️ Technical Details

### Gap Detection
- Queries database for existing questions by: `test_type`, `section_name`, `sub_skill`, `test_mode`
- Compares with target distribution
- Only generates missing questions

### Cross-Mode Diversity
- Passes `testMode = null` to query functions
- Loads questions from ALL modes for sub-skill
- LLM sees 5-10 most recent questions as context
- Ensures variety across entire question bank

### Storage
- All questions stored in `questions_v2` table
- Indexed on `(test_type, test_mode, section_name, sub_skill)` for fast queries
- Includes `test_mode` field to distinguish between practice_1, practice_2, etc.

---

## 🚦 Quick Start

**To generate all questions for ONE section**:

```bash
# 1. Generate practice tests + diagnostic
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# 2. Generate skill drills
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --drills-per-subskill=20

# 3. Review questions in database
# Check quality scores, verify diversity
```

---

**Status**: ✅ Section-first generator complete, drill generator complete
