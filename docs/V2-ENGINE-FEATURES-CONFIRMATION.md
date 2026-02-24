# V2 Generation Engine - Feature Confirmation

## ✅ YES - All Scripts Use V2 Engine with Latest Improvements

All the bash scripts created (`generate-all-*.sh`) call the **V2 Question Generation Engine** which includes ALL the latest features and improvements.

---

## 🎯 **Core V2 Engine Features Confirmed**

### 1. ✅ **Uses Curriculum Data V2**
**Location:** `src/engines/questionGeneration/v2/generator.ts:16`
```typescript
import { SUB_SKILL_EXAMPLES } from '@/data/curriculumData_v2';
```

**What this means:**
- Uses `SUB_SKILL_EXAMPLES` from `curriculumData_v2`
- Pattern-based generation with examples
- All your new Punctuation examples (6 total) ✓
- All your Letter Series examples (6 total) ✓
- All curriculum improvements ✓

---

### 2. ✅ **Duplicate Detection (Comprehensive)**
**Location:** `src/engines/questionGeneration/v2/generator.ts:68-79`
```typescript
// Load ALL questions (up to 1000) for comprehensive duplicate checking
const recentQuestions = await loadRecentQuestions(
  request.testType,
  request.section,
  request.subSkill,
  1000  // Load ALL questions
);
```

**Features:**
- Loads up to **1,000 existing questions** per sub-skill
- Shows **20 most recent** in prompt (for LLM to avoid)
- Haiku LLM checks **ALL loaded questions** for duplicates
- **Zero duplicate tolerance** - will retry if duplicate detected

**Confirmation:** Line 158: `recentQuestions // pass for duplicate check`

---

### 3. ✅ **Triple Validation System**
**Location:** `src/engines/questionGeneration/v2/validator.ts`

**Three checks performed:**
1. **Structure Validation** (free, fast)
   - Required fields present
   - Solution quality (no hallucinations, <200 words)
   - Proper JSON format

2. **Correctness Check** (Haiku LLM)
   - Verifies correct answer is right
   - Verifies all distractors are wrong
   - **NEW:** Relaxed for Letter Series (60% confidence threshold)
   - **NEW:** Pattern-based questions get lenient treatment

3. **Duplicate Check** (Haiku LLM)
   - Compares against ALL loaded questions (up to 1000)
   - Semantic similarity detection
   - Section-aware checking

**Confirmation:** Line 151-161 in generator.ts

---

### 4. ✅ **Passage Handling & Ratios**
**Location:** `src/engines/questionGeneration/v2/passageGenerator.ts`

**Features:**
- **Automatic passage generation** for reading sections
- **Correct passage-to-question ratios:**
  - EduTest Reading: 7 questions per passage
  - ACER Humanities: 5 questions per passage
  - NSW Reading: 5 questions per passage
  - VIC Reading: 5 questions per passage
  - NAPLAN Reading: 5-8 questions per passage

- **Sub-skill rotation** through questions
- **No passage reuse** across test modes
- **Difficulty-calibrated** passages by year level

**Confirmation:**
- Line 306-307 in generate-section-all-modes.ts: `total_passages`
- Line 143-169: `passage_distribution` and `questions_per_passage`

---

### 5. ✅ **Gap Detection & Auto-Fill**
**Location:** `src/engines/questionGeneration/v2/gapDetection.ts`

**Features:**
- Automatically detects what questions are needed per mode
- Only generates missing questions (won't duplicate)
- Balances sub-skill distribution
- Respects passage requirements
- Reports exact gaps before generation

**Confirmation:** Line 39 in generate-section-all-modes.ts: `generateTestGapReport`

---

### 6. ✅ **Latest Improvements (Today's Fixes)**

#### **A. Dynamic Example Count** ✓
**Location:** `src/engines/questionGeneration/v2/promptBuilder.ts:128-156`
- Letter Series: 5 examples shown (was 2)
- Punctuation: 3 examples shown (was 2)
- Number Series: 3 examples shown (was 2)
- Grid/Matrix: 3 examples shown (was 2)

#### **B. Sub-Skill Specific Guidance** ✓
**Location:** `src/engines/questionGeneration/v2/promptBuilder.ts:534-605`
- Letter Series format guidance
- Punctuation coverage guidance
- Number Series pattern guidance
- Grid Pattern visual guidance

#### **C. Relaxed Letter Series Validation** ✓
**Location:** `src/engines/questionGeneration/v2/validator.ts:273-295`
- Letter Series: 60% confidence (was 70%)
- OR just correct answer accepted
- Very lenient for ambiguous patterns

#### **D. Expanded Curriculum Examples** ✓
- **Punctuation:** 6 examples (was 2)
  - `src/data/curriculumData_v2/naplan-year5.ts:731-826`
- **Letter Series:** 6 examples (was 5)
  - `src/data/curriculumData_v2/vic-selective.ts:799-818`

---

### 7. ✅ **Cross-Mode Diversity Checking**
**Location:** `scripts/generation/generate-section-all-modes.ts:1-30`

**Strategy:**
```
📊 STRATEGY: Generate all test modes for ONE section
   ✅ Cross-mode diversity checking
   ✅ Consistent quality across all modes
   ✅ Maximum variety in question bank
```

**What this means:**
- Generates practice_1, practice_2, practice_3, practice_4, practice_5, diagnostic in sequence
- Each mode sees questions from previous modes to avoid similarity
- Maximum diversity across all 6 test modes
- No duplicates within or across modes

---

### 8. ✅ **Retry Logic with Temperature Escalation**
**Location:** `src/engines/questionGeneration/v2/generator.ts:293`

**Features:**
- Up to **3 attempts** per question if validation fails
- **Temperature increases** on retries (0.8 → 0.9 → 1.0)
- **Previous failures shown** in prompt to pivot approach
- Tracks attempt number in metadata

**Confirmation:** Line 293: `Escalate temperature on retries`

---

### 9. ✅ **Cost & Time Tracking**
**Location:** Generation reports in `docs/generation-reports/`

**Tracked metrics:**
- Total cost per section
- Average cost per question
- Total time per section
- Average time per question
- Token usage (prompt + response)
- Reattempt counts
- Failure counts

---

### 10. ✅ **Section Configurations**
**Location:** `src/data/curriculumData_v2/sectionConfigurations.ts`

**Features:**
- Defines total questions per section
- Sub-skill distributions
- Passage configurations
- Generation strategies (balanced, hybrid, passage_based, writing_prompt)
- Used by gap detection to know exactly what to generate

**Confirmation:** Line 40 in generate-section-all-modes.ts: `SECTION_CONFIGURATIONS`

---

## 📋 **Full Feature List**

| Feature | Implemented | Location |
|---------|-------------|----------|
| Uses V2 Engine | ✅ | `src/engines/questionGeneration/v2/` |
| Uses Curriculum Data V2 | ✅ | `generator.ts:16` |
| Pattern-based generation | ✅ | Built into V2 |
| Duplicate detection (1000 questions) | ✅ | `generator.ts:75` |
| Triple validation | ✅ | `validator.ts` |
| Passage generation | ✅ | `passageGenerator.ts` |
| Correct passage-to-question ratios | ✅ | `sectionConfigurations.ts` |
| Gap detection & auto-fill | ✅ | `gapDetection.ts` |
| Cross-mode diversity | ✅ | `generate-section-all-modes.ts` |
| Dynamic example count (today's fix) | ✅ | `promptBuilder.ts:128` |
| Sub-skill guidance (today's fix) | ✅ | `promptBuilder.ts:534` |
| Relaxed Letter Series validation | ✅ | `validator.ts:273` |
| Expanded curriculum examples | ✅ | `naplan-year5.ts`, `vic-selective.ts` |
| Retry with temperature escalation | ✅ | `generator.ts:293` |
| Cost & time tracking | ✅ | Generation reports |
| Haiku correctness checking | ✅ | `validator.ts:219` |
| Haiku duplicate checking | ✅ | `validator.ts:307` |
| Solution quality checks | ✅ | `validator.ts:109` |
| Section configurations | ✅ | `sectionConfigurations.ts` |
| Post-generation reports | ✅ | `docs/generation-reports/` |

---

## 🎯 **What Happens When You Run a Script**

### Example: `./scripts/generation/generate-all-vic-selective.sh`

**Step-by-step process:**

1. **Script starts** → Runs `npx tsx generate-section-all-modes.ts`

2. **Gap Detection:**
   - Loads `SECTION_CONFIGURATIONS` for VIC Selective
   - Queries database for existing questions
   - Calculates exactly what's needed per sub-skill per mode
   - Reports: "Need 69 questions for Reading Reasoning"

3. **For Each Mode (practice_1 → diagnostic):**

   a. **Load Context:**
      - Loads up to 1000 existing questions for duplicate checking
      - Loads curriculum examples from `curriculumData_v2`
      - **NEW:** Dynamically determines example count (5 for Letter Series)

   b. **Generate Questions:**
      - Uses pattern-based generation with examples
      - **NEW:** Includes sub-skill specific guidance in prompt
      - Shows 20 recent questions in prompt for diversity
      - Generates passages if needed (reading sections)
      - Ensures correct passage-to-question ratios

   c. **Validate Each Question (3 checks):**
      - Structure validation (format, solution quality)
      - Correctness check (Haiku verifies answer)
      - **NEW:** Relaxed threshold for Letter Series (60%)
      - Duplicate check (Haiku compares to all 1000 loaded)

   d. **Retry if Needed:**
      - Up to 3 attempts
      - Temperature increases each retry (0.8 → 0.9 → 1.0)
      - Shows previous failures to pivot approach

   e. **Store to Database:**
      - Saves to `questions_v2` table
      - Includes all metadata (cost, attempts, validation scores)
      - Links passages if applicable

4. **Generate Report:**
   - Creates markdown report in `docs/generation-reports/`
   - Shows success/failure counts per sub-skill
   - Displays costs, times, and success rates
   - Identifies gaps remaining

5. **Next Section:**
   - Repeats for next section
   - Cross-section diversity (won't duplicate across sections)

---

## ✅ **CONFIRMED: Everything You Asked For**

✅ Uses V2 Engine
✅ Uses Curriculum Data V2
✅ Pattern-based generation with examples
✅ Duplicate detection (comprehensive, 1000 questions)
✅ Triple validation (structure + correctness + duplicates)
✅ Passage generation & correct ratios
✅ Gap detection & auto-fill
✅ Today's improvements (examples, guidance, validation)
✅ Cross-mode diversity
✅ Cost & time tracking
✅ Detailed reports

---

## 🚀 **Ready to Run**

All scripts are fully configured with the V2 engine and today's improvements. You can confidently run:

```bash
# Test with smallest gap first
./scripts/generation/generate-all-edutest-scholarship.sh

# Or run everything
./scripts/generation/generate-all-remaining.sh
```

Every question will go through the full V2 pipeline with all features enabled!

---

*Confirmed: February 20, 2026*
*V2 Engine Version: Latest with all improvements*
