# Passage Requirements Update - Complete Implementation Guide

**Date:** February 19, 2026
**Status:** ✅ COMPLETE

## Problem Statement

The ACER Humanities section in `curriculumData_v2/acer.ts` had example questions that described passages instead of including actual passage content. This was a critical error that would prevent the V2 engine from generating proper passage-based questions.

### Example of the Problem:
```typescript
// ❌ WRONG
question_text: "Passage about sportsmanship discusses its four elements..."

// ✅ CORRECT
question_text: "Read the passage and answer the question.\n\nPassage:\nSportsmanship in modern sports is built upon four essential elements..."
```

---

## Fixes Implemented

### 1. ✅ Fixed ACER Humanities Examples

**File:** `src/data/curriculumData_v2/acer.ts`

All 8 sub-skills in ACER Humanities now have complete passages:

1. **Main Idea & Theme Identification** (2 examples)
   - Sportsmanship passage (181 words)
   - Reading books passage (125 words)

2. **Inference & Interpretation** (2 examples)
   - Sportsmanship passage (reused, 181 words)
   - Dengue fever passage (203 words)

3. **Vocabulary in Context** (2 examples)
   - Dengue fever passage (175 words)
   - Book covers passage (175 words)

4. **Sequencing & Text Organization** (1 example)
   - Books and reading passage (183 words)

5. **Literal Comprehension** (2 examples)
   - Amelia Earhart passages (162 and 176 words)

6. **Analysis & Comparison** (2 examples)
   - Lindbergh and Earhart passage (163 words)
   - Book covers passage (reused, 175 words)

7. **Visual Interpretation** (3 examples)
   - ✅ Already correct (uses images, not text passages)

8. **Poetry Analysis** (3 examples)
   - Full 'Amanda' poem included (24 lines)

### 2. ✅ Verified EduTest Reading Comprehension

**File:** `src/data/curriculumData_v2/edutest.ts`

EduTest Reading Comprehension examples already include full passages:
- Short passages: 40-70 words for vocabulary
- Medium passages: 130-200 words for comprehension
- Long passages: 200+ words for complex inference

✅ **No changes needed** - already correctly implemented.

### 3. ✅ Verified NSW & VIC Selective

**Files:**
- `src/data/curriculumData_v2/nsw-selective.ts`
- `src/data/curriculumData_v2/vic-selective.ts`

Both test types already include full passages in their reading sections.

✅ **No changes needed** - already correctly implemented.

---

## Passage Generation Architecture

### Current V2 Engine Implementation

The V2 engine already has robust passage generation:

**Key Files:**
- `src/engines/questionGeneration/v2/passageGenerator.ts` - Passage generation logic
- `src/engines/questionGeneration/v2/sectionGenerator.ts` - Section-level orchestration
- `src/data/curriculumData_v2/sectionConfigurations.ts` - Passage rules per test

**Key Functions:**
1. `generatePassageV2()` - Generate a single passage
2. `generatePassageWithQuestions()` - Generate passage + questions
3. `generateMultiplePassagesWithQuestions()` - Batch passage generation
4. `generateMiniPassageWithQuestion()` - For skill drills (60-120 words)

### How Passage Requirements Work

The engine uses `sectionConfigurations.ts` to determine passage needs:

```typescript
// Example: ACER Humanities is 100% passage-based
"ACER Scholarship (Year 7 Entry) - Humanities": {
  section_structure: {
    generation_strategy: "passage_based",
    passage_blueprint: {
      total_passages: 7,
      passage_distribution: [
        {
          passage_type: "informational",
          count: 2,
          word_count_range: [400, 600],
          questions_per_passage: 5,
          sub_skills: ["Main Idea & Theme Identification", "Literal Comprehension"]
        },
        // ... more passage specs
      ]
    }
  }
}
```

### Passage Generation Flow

```
1. Script calls sectionGenerator.generateSectionV2()
   ↓
2. Reads sectionConfigurations.ts for passage requirements
   ↓
3. For passage_based sections:
   - Calls generateMultiplePassagesWithQuestions()
   - Generates passages according to passageSpecs
   - Each passage gets linked questions
   ↓
4. For hybrid sections (e.g., VIC Reading):
   - Generates standalone questions
   - Generates passages with questions
   - Interleaves based on strategy
   ↓
5. For balanced sections (e.g., Math):
   - No passages needed
   - Generates standalone questions
```

---

## Passage Requirements by Test Type

### 100% Passage-Based Sections

| Test Type | Section | Total Q | Passages | Q per Passage |
|-----------|---------|---------|----------|---------------|
| **ACER Humanities** | All 35Q | 7 | 4-7 | Uses 8 sub-skills |
| **NSW Selective** | Reading (30Q) | 7 | 3-5 | Uses 6 sub-skills |
| **Year 5 NAPLAN** | Reading (40Q) | 5 | 7-9 | Uses 6 sub-skills |
| **Year 7 NAPLAN** | Reading (50Q) | 7 | 6-8 | Uses 4 sub-skills |

### Hybrid Sections (Some Standalone, Some Passages)

| Test Type | Section | Standalone | Passages | Strategy |
|-----------|---------|------------|----------|----------|
| **EduTest** | Reading Comp (50Q) | 43Q (85%) | 1 passage, 7Q (15%) | `passages_last` |
| **VIC Selective** | Reading (50Q) | 20Q (40%) | 9 passages, 30Q (60%) | `mixed` |

### Standalone Only (No Passages)

- All Math sections
- All Thinking Skills / General Ability sections
- EduTest Verbal Reasoning
- EduTest Numerical Reasoning

---

## Schema: passage_requirements Field

The `types.ts` schema includes an optional `passage_requirements` field for sub-skills:

```typescript
export interface SubSkillExampleData {
  description: string;
  visual_required: boolean;
  // ... other fields ...

  // NEW: Passage requirements for reading/comprehension sub-skills
  passage_requirements?: {
    passage_required: boolean;
    passage_dependency: "none" | "optional" | "always";
    passage_config?: {
      length: "micro" | "short" | "medium" | "long";
      word_count_range: [number, number];
      passage_types: ("narrative" | "informational" | "persuasive" | "poetry" | "visual")[];
      questions_per_passage: number | [number, number];
    };
    generation_workflow: "standalone" | "passage_first" | "hybrid";
  };
}
```

### Status: ⚠️ NOT YET POPULATED

The schema exists but is not yet populated in any curriculumData_v2 files. This is **optional enhancement** - the current architecture using `sectionConfigurations.ts` is sufficient.

### Should We Populate passage_requirements?

**Recommendation:** No, not needed currently.

**Reason:**
- `sectionConfigurations.ts` already defines all passage needs at the section level
- The V2 engine works perfectly with the current architecture
- Adding passage_requirements to each sub-skill would be redundant
- If we need more granular control in the future, we can add it then

---

## Generation Scripts

All generation scripts in `scripts/generation/` use the V2 engine:

**Key Scripts:**
- `generate-all-remaining-acer-scholarship-v2.ts`
- `generate-all-remaining-nsw-selective-v2.ts`
- `generate-all-remaining-vic-selective-v2.ts`
- `generate-all-remaining-edutest-v2.ts`
- `generate-all-remaining-year5-naplan-v2.ts`
- `generate-all-remaining-year7-naplan-v2.ts`

All scripts:
1. Read test configuration from `sectionConfigurations.ts`
2. Call `sectionGenerator.generateSectionV2()`
3. Engine automatically handles passages based on `generation_strategy`
4. Store questions + passages in database

✅ **No script changes needed** - they already use the V2 engine correctly.

---

## Validation & Testing

### Manual Validation Checks

1. ✅ All ACER Humanities examples have full passages
2. ✅ EduTest Reading Comprehension has full passages
3. ✅ NSW Selective Reading has full passages
4. ✅ VIC Selective Reading has full passages
5. ✅ V2 engine passage generator exists and works
6. ✅ sectionConfigurations.ts defines all passage requirements
7. ✅ Generation scripts use V2 engine

### How to Test

```bash
# Generate a single section to test
npm run tsx scripts/generation/generate-test.ts

# The script will:
# 1. Read sectionConfigurations.ts
# 2. Generate passages if needed
# 3. Generate questions linked to passages
# 4. Store everything in database
```

---

## Migration Notes

### If You Generate Questions

**Before running generation scripts:**

1. ✅ Passages in curriculum examples are now correct
2. ✅ V2 engine reads from examples for style
3. ✅ Section configs define passage distribution
4. ✅ All ready to generate

**The engine will:**
- Generate passages matching the style in examples
- Link questions to passages via `passage_id`
- Store passages in `passages_v2` table
- Store questions in `questions_v2` table with `passage_id` foreign key

---

## Summary

### What Was Fixed
1. ✅ ACER Humanities: All 8 sub-skills now have complete passages in examples
2. ✅ Verified other test types already correct
3. ✅ Documented passage generation architecture
4. ✅ Confirmed V2 engine already handles passages correctly

### What Was NOT Needed
1. ❌ EduTest changes (already correct)
2. ❌ NSW/VIC changes (already correct)
3. ❌ V2 engine changes (already works)
4. ❌ Generation script changes (already work)
5. ❌ Populating `passage_requirements` field (redundant with sectionConfigurations.ts)

### Current Status
**✅ READY FOR PRODUCTION**

The V2 engine is fully functional and ready to generate passage-based questions for all test types. The curriculum data now provides proper passage examples that the engine can learn from.

---

## Next Steps (Optional Enhancements)

### 1. Add Passage Examples to More Sub-Skills
Currently ACER Humanities has 2-3 examples per sub-skill. Could add more variety.

### 2. Populate passage_requirements Field
If we need finer control over passage generation at the sub-skill level, we could populate the optional `passage_requirements` field.

### 3. Add More Passage Type Variety
Could add more passage types to sectionConfigurations.ts:
- "multimodal" (text + diagrams)
- "dialogue" (conversation format)
- "technical" (instructions, procedures)

### 4. Passage Reuse Across Questions
Currently each passage gets 4-7 questions. Could implement passage reuse across test modes to save generation costs.

---

## References

**Key Files:**
- `src/data/curriculumData_v2/acer.ts` - Fixed examples
- `src/data/curriculumData_v2/types.ts` - Schema definition
- `src/data/curriculumData_v2/sectionConfigurations.ts` - Passage rules
- `src/engines/questionGeneration/v2/passageGenerator.ts` - Passage generation
- `src/engines/questionGeneration/v2/sectionGenerator.ts` - Section orchestration

**Documentation:**
- `docs/V2_ENGINE_COMPLETE_GUIDE.md` - V2 engine architecture
- `docs/GENERATION_SCRIPTS_REFERENCE.md` - How to run generation scripts
- `docs/TEST_CONFIGURATIONS_SUMMARY.md` - Test structure reference
