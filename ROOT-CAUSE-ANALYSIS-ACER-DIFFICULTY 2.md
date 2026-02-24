# Root Cause Analysis: ACER Humanities Difficulty Imbalance
**Issue:** 85-97% of ACER Humanities questions generated at Difficulty 1 (Easy)
**Expected:** ~30% Easy, ~40% Medium, ~25% Hard
**Date:** 2026-02-22

---

## 🔍 Root Cause Identified

### The Issue
Despite the V2 generation engine being configured to use **balanced difficulty** strategy `[1, 2, 3]`, ACER Humanities sections ended up with 85-97% Easy questions.

### The Root Cause: **Insufficient Examples in curriculumData_v2**

The ACER Humanities curriculum data has **severe gaps in example coverage across difficulty levels**:

| Sub-Skill | Difficulty Range | Easy (1) | Medium (2) | Hard (3) | Total |
|-----------|------------------|----------|------------|----------|-------|
| Main Idea & Theme Identification | [1, 2, 3] | **0** | 2 | **0** | 2 |
| Inference & Interpretation | [2, 3] | **0** | 1 | 1 | 2 |
| Vocabulary in Context | [1, 2, 3] | **0** | 2 | **0** | 2 |
| Sequencing & Text Organization | [2, 3] | **0** | **0** | 1 | 1 |
| Literal Comprehension | [1, 2] | 1 | 1 | 0 | 2 |
| Analysis & Comparison | [2, 3] | **0** | 2 | **0** | 2 |
| Visual Interpretation | [1, 2, 3] | **0** | 3 | **0** | 3 |
| Poetry Analysis | [2, 3] | **0** | 3 | **0** | 3 |

**Summary:**
- **Only 1 Easy example** across all 8 sub-skills (from Literal Comprehension)
- **14 Medium examples** across all sub-skills
- **Only 2 Hard examples** across all sub-skills
- **Total: 17 examples** for 8 sub-skills

---

## 🧩 How the V2 Engine Works

### Designed Behavior

1. **Difficulty Distribution Plan Created:**
   ```typescript
   difficultyStrategy: { type: 'balanced', difficulties: [1, 2, 3] }
   ```
   For 35 questions: ~12 Easy, ~12 Medium, ~11 Hard

2. **Example Selection Logic** (`promptBuilder.ts:166-174`):
   ```typescript
   function selectExamplesForDifficulty(
     examples: SubSkillExample[],
     targetDifficulty: number,
     max: number = 2
   ): SubSkillExample[] {
     const sorted = [...examples].sort((a, b) =>
       Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty)
     );
     return sorted.slice(0, max);
   }
   ```

   **This selects the CLOSEST examples to target difficulty.**

3. **What Actually Happens with ACER Humanities:**
   - Engine requests: "Generate Easy (difficulty 1) question"
   - Available examples for most sub-skills: Only Medium (difficulty 2)
   - Engine selects: **Medium example** (closest available)
   - **BUT** Claude defaults to generating **Easy questions** when:
     - The examples don't match the requested difficulty
     - The prompt lacks strong difficulty indicators
     - The LLM errs on the side of caution

---

## 🎯 Why Easy Questions Got Generated

### The LLM Fallback Behavior

When asked to generate a Difficulty 1 question but given Difficulty 2 examples:

1. **Prompt says:** "Generate difficulty 1 question"
2. **Examples show:** Difficulty 2 complexity
3. **Claude's response:** Defaults to **simpler/easier** when uncertain
4. **Result:** Easy question generated (despite Medium examples)

This is **conservative LLM behavior** - when in doubt, make it easier rather than harder.

### Why This Didn't Happen with Other Products

**EduTest, NSW, VIC, NAPLAN** all have:
- 2-4 examples **per difficulty level** per sub-skill
- When requesting Easy (1), Easy examples are provided
- When requesting Hard (3), Hard examples are provided
- LLM has clear templates at the correct difficulty

**ACER Humanities** has:
- 0-1 examples per difficulty level
- When requesting Easy (1), Medium (2) examples provided
- When requesting Hard (3), Medium (2) examples provided
- LLM has unclear difficulty signals → defaults to Easy

---

## 📊 Comparison: ACER vs Other Products

### ACER Mathematics (GOOD ✅)
```
Set Theory & Venn Diagrams:
  Examples: 2 Easy, 2 Medium, 1 Hard (5 total)
  Result: Good difficulty distribution

Probability:
  Examples: 0 Easy, 2 Medium, 0 Hard (2 total)
  Result: Similar issues as Humanities (but less severe due to math precision)
```

### EduTest Verbal Reasoning (GOOD ✅)
```
Analogical Reasoning:
  Examples: 2 Easy, 2 Medium, 2 Hard (6 total)
  Result: Excellent difficulty distribution
```

---

## 🛠️ The Fix

### Option 1: Add Missing Examples to curriculumData_v2 (RECOMMENDED)

**Add to `/src/data/curriculumData_v2/acer.ts`:**

For EACH of the 8 Humanities sub-skills, add:
- **2-3 Easy (difficulty 1) examples**
- **2-3 Hard (difficulty 3) examples**

**Estimated work:**
- 8 sub-skills × 2 difficulties × 2 examples = **32 new examples**
- Time: 3-4 hours to write quality examples
- **BENEFIT:** Permanently fixes the issue, improves future generations

### Option 2: Regenerate with Single Difficulty (WORKAROUND)

Regenerate sections with forced difficulty:
```typescript
// Easy questions
difficultyStrategy: { type: 'single', difficulty: 1 }

// Medium questions
difficultyStrategy: { type: 'single', difficulty: 2 }

// Hard questions
difficultyStrategy: { type: 'single', difficulty: 3 }
```

**Process:**
1. Delete existing ACER Humanities questions
2. Generate 12 questions at difficulty 1
3. Generate 12 questions at difficulty 2
4. Generate 11 questions at difficulty 3

**Time:** 1-2 hours
**DRAWBACK:** Doesn't fix root cause; same issue will occur if regenerated later

### Option 3: Manual Difficulty Adjustment (QUICK FIX)

Use SQL to manually adjust difficulty of existing questions:
```sql
-- Randomly assign 40% to Medium, 25% to Hard
UPDATE questions_v2
SET difficulty = 2
WHERE product_type = 'ACER Scholarship (Year 7 Entry)'
  AND section_name = 'Humanities'
  AND difficulty = 1
  AND id IN (
    SELECT id FROM questions_v2
    WHERE product_type = 'ACER Scholarship (Year 7 Entry)'
    AND section_name = 'Humanities'
    AND difficulty = 1
    ORDER BY RANDOM()
    LIMIT 15
  );
```

**Time:** 15 minutes
**DRAWBACK:** Doesn't actually change question complexity, just labels

---

## 🎯 Recommended Solution

**Hybrid Approach:**

1. **Immediate (Option 2):** Regenerate ~100-150 questions with controlled difficulty
   - 30-35% using `{ type: 'single', difficulty: 1 }`
   - 40-45% using `{ type: 'single', difficulty: 2 }`
   - 20-25% using `{ type: 'single', difficulty: 3 }`
   - Time: 2-3 hours
   - Gets production-quality distribution NOW

2. **Long-term (Option 1):** Add 32 examples to curriculumData_v2
   - Prevents future occurrences
   - Improves example quality
   - Time: 3-4 hours (can be done over time)

---

## 📝 Lessons Learned

1. **Example Coverage Matters:** V2 engine relies heavily on having examples at ALL difficulty levels
2. **LLM Defaults to Easy:** When uncertain about difficulty, Claude errs toward simpler questions
3. **Audit curriculum data:** Before generating, verify example coverage across difficulties
4. **Single difficulty can be useful:** For edge cases with limited examples, targeted generation works better

---

## ✅ Verification Steps After Fix

1. Check difficulty distribution:
   ```sql
   SELECT difficulty, COUNT(*)
   FROM questions_v2
   WHERE product_type = 'ACER Scholarship (Year 7 Entry)'
   AND section_name = 'Humanities'
   GROUP BY difficulty;
   ```

2. Expected results:
   - Difficulty 1: ~30-35%
   - Difficulty 2: ~40-45%
   - Difficulty 3: ~20-25%

3. Spot check actual question complexity matches assigned difficulty

---

**Status:** Root cause identified ✅
**Fix difficulty:** Moderate (2-3 hours)
**Impact of fix:** High (production-ready quality)
**Prevention:** Add missing examples to curriculum data
