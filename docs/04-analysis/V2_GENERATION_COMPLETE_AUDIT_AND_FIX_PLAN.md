# V2 Question Generation - Complete Audit & Fix Implementation Plan

**Generated:** 2026-02-19
**Database:** questions_v2
**Total Questions:** 4,308 (Note: 295 questions are over-generated beyond targets)
**Effective Progress:** 4,013 / 6,676 target (60.1%)
**Questions Still Needed:** 2,663

---

## Executive Summary

### Overall Status
✅ **60.1% Complete** - 4,013 questions generated against 6,676 target
- **Practice Questions:** 3,355 / 5,567 (60.3%)
- **Diagnostic Questions:** 658 / 1,109 (59.3%)
- **Over-Generated:** 295 questions beyond target (some sections at 100%+)

### Test Type Completion Summary

| Test Type | Progress | Status |
|-----------|----------|--------|
| **Year 7 NAPLAN** | 94.2% (870/924) | ⚠️ Nearly Complete |
| **EduTest** | 115.1% (1,146/996) | ✅ OVER-COMPLETE |
| **VIC Selective** | 60.3% (890/1,476) | ⚠️ Moderate Progress |
| **NSW Selective** | 59.6% (397/666) | ⚠️ Moderate Progress |
| **Year 5 NAPLAN** | 44.8% (414/924) | ⚠️ Behind Schedule |
| **ACER** | 17.5% (296/1,690) | ❌ Significantly Behind |

### Critical Issues
1. **10 sections at 0%** - Not started (1,206 questions needed)
2. **12 sections incomplete** - Between 14-99% (1,457 questions needed)
3. **Key failures:** Writing prompts, Visual/Spatial sub-skills, Reading sections

---

## Detailed Breakdown by Test Type

### 1. Year 7 NAPLAN - 94.2% Complete ⚠️

**Status:** Nearly complete, only minor gaps remaining

| Section | Progress | Status | Missing |
|---------|----------|--------|---------|
| Reading | 257/258 (99.6%) | ⚠️ | 1 |
| Numeracy No Calculator | 179/180 (99.4%) | ⚠️ | 1 |
| Numeracy Calculator | 192/210 (91.4%) | ⚠️ | 18 |
| Language Conventions | 236/270 (87.4%) | ⚠️ | 34 |
| Writing | 6/6 (100%) | ✅ | 0 |

**Sub-Skills Generated:**
- Numeracy: All core sub-skills present (Integer Ops, Fractions, Algebra, Measurement, etc.)
- Reading: Comprehensive coverage (Literal, Inferential, Text Structure, Vocabulary)
- Language: All areas covered (Grammar, Spelling, Vocabulary, Punctuation)
- Writing: Narrative Writing complete

**Gaps to Fill:**
- Numeracy Calculator: 18 questions (focus: Advanced Problem Solving sub-skill based on reports)
- Language Conventions: 34 questions (focus: Punctuation & Sentence Boundaries - 14 failures reported)
- Reading/No Calculator: 1 question each (trivial)

**Action:** Low priority - run one final generation pass to fill small gaps

---

### 2. EduTest Scholarship - 115.1% Complete ✅

**Status:** OVER-COMPLETE - Generated more than target

| Section | Progress | Status | Over/Under |
|---------|----------|--------|------------|
| Verbal Reasoning | 278/278 (100%) | ✅ | 0 |
| Reading Comprehension | 270/258 (104.7%) | ✅ | +12 |
| Numerical Reasoning | 248/216 (114.8%) | ✅ | +32 |
| Mathematics | 350/232 (150.9%) | ✅ | +118 |
| **Written Expression** | 0/12 (0%) | ❌ | -12 |

**Sub-Skills - Excellent Coverage:**
- **Verbal Reasoning:** All 8 sub-skills, balanced distribution
  - Foreign Language Translation, Sequential Ordering, Analogies, Code Breaking, Word Manipulation, Logical Deduction, Vocabulary, Classification
- **Mathematics:** All 6 sub-skills well-represented (50-60 questions each)
  - Applied Word Problems, Decimals, Algebra, Geometry, Statistics, Fractions
- **Numerical Reasoning:** Balanced across 4 sub-skills (50-74 questions each)
  - Word Problems, Number Properties, Matrices, Number Series
- **Reading:** All 6 sub-skills present (30-71 questions each)
  - Vocabulary in Context, Grammar, Sentence Transformation, Passage Comprehension, Figurative Language, Punctuation

**Critical Gap:**
- **Written Expression: 0/12 (0%)** - SYSTEM ISSUE with extended_response generation

**Action:**
1. HIGH PRIORITY - Fix extended_response system for Writing
2. Consider removing excess questions if database bloat is a concern (295 over target)

---

### 3. VIC Selective Entry - 60.3% Complete ⚠️

**Status:** Moderate progress, significant gaps remain

| Section | Progress | Status | Missing |
|---------|----------|--------|---------|
| General Ability - Verbal | 305/360 (84.7%) | ⚠️ | 55 |
| General Ability - Quantitative | 239/300 (79.7%) | ⚠️ | 61 |
| Mathematics Reasoning | 282/360 (78.3%) | ⚠️ | 78 |
| **Reading Reasoning** | 64/444 (14.4%) | ❌ | 380 |
| **Writing** | 0/12 (0%) | ❌ | 12 |

**Sub-Skills Analysis:**

#### General Ability - Verbal (84.7% - Good Progress)
- ✅ Analogies: 54 questions (complete)
- ✅ Odd One Out: 53 questions (complete)
- ✅ Vocabulary & Synonyms: 46 questions (good)
- ✅ Word Completion: 40 questions (good)
- ✅ Logical Deduction: 40 questions (good)
- ⚠️ Code & Symbol Substitution: 38 questions (10 failures reported)
- ⚠️ Letter Series & Patterns: 34 questions (20 failures reported - high retry rate)

#### General Ability - Quantitative (79.7%)
- ✅ Number Grids & Matrices: 73 questions (5 failures)
- ✅ Number Series & Sequences: 65 questions (13 failures)
- ⚠️ Pattern Recognition in Paired Numbers: 51 questions (21 failures - high retry)
- ⚠️ Applied Word Problems: 50 questions (22 failures - highest failure rate)

#### Mathematics Reasoning (78.3%)
- ✅ Algebraic Equations: 44 questions (4 failures)
- ✅ Ratios & Proportions: 40 questions (8 failures)
- ✅ Geometry: 39 questions (9 failures)
- ⚠️ Number Operations: 34 questions (8 failures)
- ⚠️ Data Interpretation: 34 questions (8 failures)
- ⚠️ Fractions, Decimals & Percentages: 33 questions (15 failures - worst)
- ⚠️ Time, Money & Measurement: 31 questions (11 failures)
- ⚠️ Word Problems & Logical Reasoning: 27 questions (15 failures - worst)

#### Reading Reasoning (14.4% - MAJOR GAP)
- Vocabulary in Context: 32 questions (good start)
- Sentence Transformation: 24 questions (100% success rate - report shows this worked well)
- ❌ Grammar & Sentence Structure: 4 questions (30 failures reported - 0% original success)
- ❌ Idioms & Figurative Language: 2 questions (18 failures reported)
- ❌ Punctuation & Mechanics: 1 question (12 failures reported)
- ❌ Spelling & Word Choice: 1 question (12 failures reported)
- ❌ **Missing:** Vocabulary (Standalone) - 36 failures, 0 generated

**Gap Analysis:** Reading Reasoning failed badly due to:
1. Vocabulary (Standalone) - 100% failure (36/36 failed)
2. Grammar & Punctuation - 100% failure (30/30 failed)
3. Idioms & Expressions - 100% failure (18/18 failed)
4. Spelling & Word Usage - 100% failure (12/12 failed)

**Total Reading Reasoning failures:** 96 questions (88 still needed after 4+2+1+1=8 generated)

#### Writing (0% - SYSTEM ISSUE)
- ❌ Creative Writing - 6 failures
- ❌ Persuasive Writing - 6 failures

**Actions:**
1. **URGENT:** Fix Reading Reasoning sub-skill definitions (Vocabulary Standalone, Grammar, Idioms, Spelling)
2. **HIGH:** Complete final 55-78 questions for Verbal/Quant/Math sections
3. **CRITICAL:** Fix Writing extended_response system
4. **CRITICAL:** Generate 380 Reading Reasoning questions after fixing sub-skill issues

---

### 4. NSW Selective Entry - 59.6% Complete ⚠️

**Status:** Moderate progress, but 2 major gaps

| Section | Progress | Status | Missing |
|---------|----------|--------|---------|
| Mathematical Reasoning | 185/180 (102.8%) | ✅ | -5 (over) |
| Thinking Skills | 212/180 (117.8%) | ✅ | -32 (over) |
| **Reading** | 0/300 (0%) | ❌ | 300 |
| **Writing** | 0/6 (0%) | ❌ | 6 |

**Sub-Skills Analysis:**

#### Mathematical Reasoning (COMPLETE)
- All 7 sub-skills well-represented (22-30 questions each)
- ✅ Geometry, Data Interpretation, Algebra, Number Operations, Word Problems, Ratios, Fractions

#### Thinking Skills (COMPLETE)
- All 7 sub-skills present (14-36 questions each)
- ✅ Analogies (36), Spatial Reasoning (36), Classification (36), Logical Deduction (33), Pattern Recognition (30), Code Breaking (27), Problem Solving (14)

**Critical Gaps:**
1. **Reading: 0/300 (0%)** - NOT STARTED (largest single gap)
2. **Writing: 0/6 (0%)** - SYSTEM ISSUE (extended_response)

**Actions:**
1. **URGENT:** Generate 300 Reading questions - complete section from scratch
2. **CRITICAL:** Fix Writing extended_response system
3. **OPTIONAL:** Remove 37 excess questions from Math/Thinking if needed

---

### 5. Year 5 NAPLAN - 44.8% Complete ⚠️

**Status:** Behind schedule, significant work needed

| Section | Progress | Status | Missing |
|---------|----------|--------|---------|
| Reading | 222/258 (86.0%) | ⚠️ | 36 |
| Language Conventions | 186/270 (68.9%) | ⚠️ | 84 |
| Writing | 6/6 (100%) | ✅ | 0 |
| **Numeracy Calculator** | 0/210 (0%) | ❌ | 210 |
| **Numeracy No Calculator** | 0/180 (0%) | ❌ | 180 |

**Sub-Skills Analysis:**

#### Reading (86% - Good Progress)
- All 5 sub-skills present (24-78 questions each)
- Literal Comprehension (78), Text Structure (48), Vocabulary (36), Inferential (36), Author's Purpose (24)

#### Language Conventions (68.9% - Moderate)
- All 4 sub-skills present (32-60 questions each)
- Parts of Speech (60), Grammar (51), Spelling (43), Punctuation (32)

#### Writing (COMPLETE)
- Narrative Writing: 6 questions

**Critical Gaps:**
1. **Numeracy Calculator: 0/210 (0%)** - NOT STARTED
2. **Numeracy No Calculator: 0/180 (0%)** - NOT STARTED

**Actions:**
1. **URGENT:** Generate 210 Numeracy Calculator questions
2. **URGENT:** Generate 180 Numeracy No Calculator questions
3. **MEDIUM:** Complete 36 Reading questions
4. **MEDIUM:** Complete 84 Language Conventions questions

---

### 6. ACER Scholarship - 17.5% Complete ❌

**Status:** Significantly behind, most sections not started

| Section | Progress | Status | Missing |
|---------|----------|--------|---------|
| Written Expression | 16/12 (133%) | ✅ | -4 (over) |
| Mathematics | 117/210 (55.7%) | ⚠️ | 93 |
| Humanities | 164/570 (28.8%) | ⚠️ | 406 |
| **Abstract Reasoning** | 0/160 (0%) | ❌ | 160 |
| **Reading Comprehension** | 0/258 (0%) | ❌ | 258 |
| **Verbal Reasoning** | 0/150 (0%) | ❌ | 180 |
| **Sciences** | 0/300 (0%) | ❌ | 300 |

**Sub-Skills Analysis:**

#### Written Expression (OVER-COMPLETE)
- Creative & Imaginative: 7 questions
- Persuasive & Argumentative: 9 questions

#### Mathematics (55.7% - Moderate)
- ✅ Geometry - Perimeter & Area: 29 questions (1 failure - 97% success)
- ✅ Probability: 28 questions (2 failures - 93% success)
- ✅ Data Interpretation: 24 questions (0 failures - 100%)
- ✅ Fractions & Number Lines: 21 questions (3 failures - 88%)
- ⚠️ Logic Puzzles & Algebraic Reasoning: 15 questions (9 failures - 63%)
- ❌ **Set Theory & Venn Diagrams: 0 questions** (30 failures - 0% success - REQUIRES SVG)
- ❌ **Spatial Reasoning - Reflections & Transformations: 0 questions** (24 failures - 0% - REQUIRES SVG)
- ❌ **Spatial Reasoning - 3D Visualization: 0 questions** (24 failures - 0% - REQUIRES SVG)

**Root Cause:** 78 questions failed due to missing SVG templates for visual sub-skills

#### Humanities (28.8% - Partial)
- All 8 sub-skills present (9-34 questions each)
- Literal Comprehension (34), Inference (31), Analysis (31), Vocabulary (22), Main Idea (14), Visual Interpretation (12), Sequencing (11), Poetry Analysis (9)
- **Issue:** Generation stopped after practice modes, diagnostic mode failed (0 questions)

**Critical Gaps:**
1. **Abstract Reasoning: 0/160 (0%)** - NOT STARTED (likely requires visual generation)
2. **Reading Comprehension: 0/258 (0%)** - NOT STARTED
3. **Verbal Reasoning: 0/180 (0%)** - NOT STARTED
4. **Sciences: 0/300 (0%)** - NOT STARTED
5. **Mathematics: 93 missing** - Blocked by SVG visual requirements (78 failures)

**Actions:**
1. **P0:** Create SVG templates for Set Theory, Spatial Reasoning (Reflections, 3D)
2. **P1:** Generate Abstract Reasoning (160 questions - check if visual required)
3. **P1:** Generate Reading Comprehension (258 questions)
4. **P1:** Generate Verbal Reasoning (180 questions)
5. **P2:** Generate Sciences (300 questions)
6. **P2:** Complete Mathematics (93 questions) after SVG templates ready
7. **P2:** Complete Humanities diagnostics (95 questions) - investigate why diagnostic mode failed

---

## Critical Issues & Root Causes

### Issue #1: Extended Response (Writing) System Failure

**Impact:** 30 questions across 3 test types (0% success)

**Affected Sections:**
- EduTest Written Expression: 0/12
- NSW Selective Writing: 0/6
- VIC Selective Writing: 0/12

**Evidence from Reports:**
- VIC Writing: 12 failures (Creative Writing: 6, Persuasive Writing: 6) - $0 cost, 0 retries
- NSW Writing: 6 failures (Imaginative/Speculative: 6) - $0 cost, 0 retries
- Report shows: "0 generated, 12/6 failures, 0 reattempts" - suggests immediate rejection

**Root Cause Hypothesis:**
1. Database constraint rejecting extended_response questions
2. Validation logic immediately failing for writing prompts
3. Missing required fields for extended_response type

**Files to Investigate:**
- `src/engines/questionGeneration/v2/validators.ts` - Check extended_response validation
- `src/engines/questionGeneration/supabaseStorage.ts` - Check storage logic
- `supabase/migrations/20260209000000_create_v2_tables.sql` - Check constraints
- `src/services/writingAssessmentService.ts` - Check writing prompt generation

**Fix Plan:**
1. Add debug logging to writing prompt generation
2. Check database RLS policies for extended_response
3. Review validation constraints for answer_options/correct_answer (should be NULL for extended_response)
4. Test with single writing prompt in isolation
5. Re-run generation after fix confirmed

---

### Issue #2: Visual/SVG Generation Failures

**Impact:** 78 ACER Mathematics questions (0% success)

**Failed Sub-Skills:**
- Set Theory & Venn Diagrams: 30 failures
- Spatial Reasoning - Reflections & Transformations: 24 failures
- Spatial Reasoning - 3D Visualization: 24 failures

**Root Cause:** Missing SVG templates and generation helpers

**Evidence:**
- 100% failure rate suggests systematic issue, not random LLM failures
- These sub-skills marked as `visual_required: true` in curriculum
- LLM cannot reliably generate precise SVG coordinates without templates

**Fix Plan:**
1. **Set Theory & Venn Diagrams:**
   - Create 2-circle and 3-circle Venn diagram SVG templates
   - Add set notation rendering helpers
   - Add 5 complete examples to curriculumData_v2

2. **Spatial Reasoning - Reflections & Transformations:**
   - Create templates for: mirror lines (vertical, horizontal, diagonal)
   - Create templates for: rotations (90°, 180°, 270°) with center point
   - Create templates for: translations (vector arrows)
   - Add grid background SVG
   - Add 5 examples for each transformation type

3. **Spatial Reasoning - 3D Visualization:**
   - Create isometric grid template
   - Create 3D shape templates: cube, rectangular prism, cylinder, triangular prism
   - Add orthographic projection templates (front, side, top views)
   - Simplify to common shapes only
   - Add 5 examples

**Implementation:**
- Create `src/lib/svgTemplates/` directory
- Add template functions: `generateVennDiagram()`, `generateTransformation()`, `generate3DShape()`
- Update `src/engines/questionGeneration/v2/visualGeneration.ts` to use templates
- Add templates to curriculumData_v2 examples

---

### Issue #3: Reading Reasoning Sub-Skill Definition Issues (VIC)

**Impact:** 380 questions missing (86% of section), 96 complete failures

**Failed Sub-Skills (100% failure rate):**
- Vocabulary (Standalone): 36 failures, 0 generated
- Grammar & Punctuation: 30 failures, 0 generated
- Idioms & Expressions: 18 failures, 0 generated
- Spelling & Word Usage: 12 failures, 0 generated

**Successful Sub-Skill (100% success):**
- Sentence Transformation: 24 generated, 0 failures

**Root Cause Analysis:**

The stark contrast between 100% failure and 100% success indicates **taxonomy/definition** issues:

1. **"Vocabulary (Standalone)"** - Unclear distinction from:
   - "Vocabulary & Synonyms/Antonyms" (General Ability - Verbal)
   - "Vocabulary in Context" (other sub-skills)
   - What makes it "standalone"? No context? No synonyms? Definition needed.

2. **"Grammar & Punctuation"** - Overlaps with:
   - "Language Conventions" sections (Year 5/7 NAPLAN)
   - "Grammar & Sentence Correction" (EduTest Reading)
   - Confusion: Why is this in "Reading Reasoning" vs "Language Conventions"?

3. **"Idioms & Expressions"** vs **"Idioms & Figurative Language"**:
   - "Idioms & Expressions" failed (VIC Reading - 18 failures)
   - "Idioms & Figurative Language" succeeded (EduTest Reading - 34 generated)
   - Difference unclear - both should be similar question types

4. **"Spelling & Word Usage"** - Overlaps with:
   - "Spelling" (Year 5 NAPLAN Language - 43 generated)
   - "Spelling & Word Formation" (Year 7 NAPLAN Language - 62 generated)
   - Again, why in Reading vs Language?

**Evidence Supporting Taxonomy Issue:**
- Sentence Transformation had clear examples and succeeded 100%
- Failed sub-skills likely have poor/missing examples in curriculumData_v2
- LLM can't infer correct format without clear differentiation

**Fix Plan:**

1. **Audit curriculumData_v2 for VIC Reading Reasoning:**
   ```bash
   cat src/data/curriculumData_v2/vic-selective-entry.ts | grep -A 50 "Reading Reasoning"
   ```
   - Check number of examples per sub-skill
   - Check quality of examples
   - Check if definitions are clear

2. **Clarify Sub-Skill Definitions:**
   - **Vocabulary (Standalone):** Define as "synonym/antonym selection without passage context" OR "word meaning definition" - differentiate from analogies
   - **Grammar & Punctuation:** Clarify if this is "grammar in reading context" (error identification in sentences) vs isolated grammar rules
   - **Idioms & Expressions:** Align with successful "Idioms & Figurative Language" format, add Australian idioms list
   - **Spelling & Word Usage:** Clarify as "commonly confused words in context" or "spelling patterns in reading"

3. **Add 5+ Quality Examples per Sub-Skill:**
   - Review successful EduTest/NAPLAN examples
   - Adapt format to VIC Reading Reasoning
   - Ensure examples show clear pattern

4. **Test Generation:**
   - Generate 10 questions per sub-skill in isolation
   - Verify success before full generation run

---

### Issue #4: Multi-Step Word Problem Validation Issues

**Impact:** High failure/retry rates reducing efficiency

**Affected Sub-Skills:**
- VIC Applied Word Problems: 50 generated, 22 failures, 82 retries (138% retry rate)
- VIC Pattern Recognition: 51 generated, 21 failures, 61 retries (81% retry rate)
- VIC Word Problems & Logical Reasoning: 27 generated, 15 failures, 47 retries (122% retry rate)
- Year 7 NAPLAN Advanced Problem Solving: 25 generated, 17 failures, 50 retries (136% retry rate)

**Evidence:**
- Questions ARE generating (50-60% success eventually)
- But requiring 50-80+ retries to get there
- High cost: VIC sections average $0.014-0.032 per question (vs $0.006 for simpler questions)

**Root Cause Hypothesis:**
1. Solution validation checking exact numeric match without rounding tolerance
2. Multi-step problems have intermediate steps not validated separately
3. Distractor validation rejecting valid incorrect answers
4. Word problem constraints too strict (Australian context, specific units, etc.)

**Fix Plan:**
1. **Review Validation Logic:**
   - Check `src/engines/questionGeneration/v2/validators.ts`
   - Add logging for validation failures
   - Identify which validation step is rejecting most questions

2. **Relax Constraints:**
   - Allow numeric rounding (±0.01 for decimals, ±0.5 for fractions)
   - Accept multiple valid answer formats (e.g., "1/2" = "0.5" = "50%")
   - Relax distractor uniqueness requirements slightly

3. **Improve Prompting:**
   - Add more worked examples showing solution validation format
   - Specify acceptable answer formats explicitly
   - Request simpler intermediate steps

4. **Target:** Reduce retry rate from 80-130% to <20%

---

### Issue #5: Pattern-Based Sub-Skills High Retry Rate

**Impact:** Efficiency reduction, increased costs

**Affected:**
- Letter Series & Patterns (VIC): 34 generated, 20 failures, 64 retries (127% retry rate)
- Code & Symbol Substitution (VIC): 38 generated, 10 failures, 36 retries (79% retry rate)

**Root Cause:**
- Alphabetic pattern validation very strict
- Symbol patterns may have multiple valid interpretations
- LLM generating creative patterns that validation doesn't recognize

**Fix Plan:**
1. Review pattern validation in validators.ts
2. Allow more pattern types (skip-by-n, reverse, alternating, combined)
3. Add clear pattern rule descriptions to curriculum examples
4. Consider: relaxing validation to check "is this pattern consistent?" vs "is this THE pattern we expected?"

---

### Issue #6: Sections Not Started (0%)

**Impact:** 1,206 questions (18% of total target)

**10 Sections at 0%:**
1. ACER Abstract Reasoning: 160 questions
2. ACER Reading Comprehension: 258 questions
3. ACER Verbal Reasoning: 180 questions
4. ACER Sciences: 300 questions
5. EduTest Written Expression: 12 questions (extended_response issue)
6. NSW Selective Reading: 300 questions
7. NSW Selective Writing: 6 questions (extended_response issue)
8. VIC Selective Writing: 12 questions (extended_response issue)
9. Year 5 NAPLAN Numeracy Calculator: 210 questions
10. Year 5 NAPLAN Numeracy No Calculator: 180 questions

**Root Causes:**
- Extended response system issue: 30 questions
- Visual/SVG requirements: Likely affects ACER Abstract Reasoning
- Sections simply not run yet: Most others

**Action:** High-priority generation queue after fixing critical issues

---

## Detailed Fix Implementation Plan

### Phase 1: Critical System Fixes (Week 1)

#### P0-1: Fix Extended Response System (EduTest/NSW/VIC Writing)
**Impact:** Unblocks 30 questions

**Tasks:**
1. [ ] Debug writing prompt generation
   - Add logging to `src/engines/questionGeneration/v2/generators/writingGenerator.ts`
   - Test single prompt generation in isolation
   - Check error messages/stack traces

2. [ ] Review database constraints
   - Check `questions_v2` table definition
   - Verify `answer_options` and `correct_answer` can be NULL for extended_response
   - Check RLS policies don't block extended_response

3. [ ] Review validation logic
   - Check `validators.ts` for extended_response handling
   - Ensure validation allows NULL for answer fields
   - Verify storage logic in `supabaseStorage.ts`

4. [ ] Test fix
   - Generate 1 writing prompt for each test type
   - Verify successful storage
   - Check prompt quality

5. [ ] Full generation
   - EduTest Written Expression: 12 questions
   - NSW Writing: 6 questions
   - VIC Writing: 12 questions

**Success Criteria:** 30 writing prompts generated and stored successfully

---

#### P0-2: Create SVG Templates for Visual Sub-Skills
**Impact:** Unblocks 78 ACER Mathematics questions + potentially ACER Abstract Reasoning

**Tasks:**

1. [ ] **Set Theory & Venn Diagrams** (30 questions)
   - Create `src/lib/svgTemplates/vennDiagram.ts`
   - Implement `generateTwoSetVenn(labelA, labelB, onlyA, both, onlyB)`
   - Implement `generateThreeSetVenn(labelA, labelB, labelC, regions)`
   - Create 5 complete example questions in curriculumData_v2
   - Test generation of 10 questions
   - Full generation: 30 questions

2. [ ] **Spatial Reasoning - Reflections & Transformations** (24 questions)
   - Create `src/lib/svgTemplates/transformations.ts`
   - Implement templates:
     - `generateReflection(shape, mirrorLine)` - vertical, horizontal, diagonal
     - `generateRotation(shape, angle, center)` - 90°, 180°, 270°
     - `generateTranslation(shape, vector)` - with arrow
   - Create grid background template
   - Create 5 examples per type (15 total) in curriculumData_v2
   - Test generation
   - Full generation: 24 questions

3. [ ] **Spatial Reasoning - 3D Visualization** (24 questions)
   - Create `src/lib/svgTemplates/3dShapes.ts`
   - Create isometric grid template
   - Implement shape templates:
     - `generateCube(width, x, y)` - isometric view
     - `generatePrism(length, width, height, x, y)` - rectangular prism
     - `generateCylinder(radius, height, x, y)` - isometric view
   - Implement orthographic views:
     - `generateOrthographicViews(shape)` - front, side, top
   - Create 5 examples in curriculumData_v2
   - Test generation
   - Full generation: 24 questions

**Files to Create:**
- `src/lib/svgTemplates/index.ts` (exports)
- `src/lib/svgTemplates/vennDiagram.ts`
- `src/lib/svgTemplates/transformations.ts`
- `src/lib/svgTemplates/3dShapes.ts`
- `src/lib/svgTemplates/helpers.ts` (common utilities)

**Success Criteria:** 78 visual questions generated with proper SVG rendering

---

### Phase 2: Sub-Skill Definition Fixes (Week 1-2)

#### P1-1: Fix VIC Reading Reasoning Sub-Skill Taxonomy
**Impact:** Unblocks 380 questions (96 failed + 284 not attempted)

**Tasks:**

1. [ ] **Audit Current Curriculum Data**
   ```bash
   # Review VIC Reading Reasoning curriculum
   npx tsx scripts/audit/audit-curriculum-config-alignment.ts \
     --test="VIC Selective Entry (Year 9 Entry)" \
     --section="Reading Reasoning"
   ```
   - Document current sub-skill definitions
   - Count examples per sub-skill
   - Identify missing/poor examples

2. [ ] **Clarify Vocabulary (Standalone) - 36 failures**
   - Define as: "Synonym/antonym identification without passage" OR "Word definition selection"
   - Differentiate from: "Vocabulary in Context" (passage-based), "Vocabulary & Synonyms" (analogies)
   - Add 5-7 clear examples showing:
     - Standalone word: "Meticulous" means: A) Careless B) Precise C) Quick D) Loud
     - NOT analogies, NOT passage-based
   - Test generation: 10 questions
   - Full generation after validation

3. [ ] **Clarify Grammar & Punctuation - 30 failures**
   - Define as: "Identify grammatical or punctuation errors in sentences" (error identification, not rules)
   - Differentiate from: "Language Conventions" (isolated rules) by showing errors in context
   - Format: "Which sentence contains an error?" with 4 options
   - Add 5-7 examples covering:
     - Subject-verb agreement errors
     - Comma splice errors
     - Apostrophe misuse
     - Run-on sentences
   - Test generation: 10 questions

4. [ ] **Clarify Idioms & Expressions - 18 failures**
   - Cross-reference successful "Idioms & Figurative Language" (EduTest - 34 generated)
   - Use same format: "What does [idiom] mean in this context?"
   - Create Australian idioms list (20-30 common idioms)
   - Add 5-7 examples
   - Test generation: 10 questions

5. [ ] **Clarify Spelling & Word Usage - 12 failures**
   - Define as: "Identify commonly confused words or spelling errors in context"
   - Examples: their/there/they're, affect/effect, principle/principal
   - Add 5-7 examples
   - Test generation: 10 questions

6. [ ] **Maintain Successful Sub-Skill: Sentence Transformation**
   - Already working (24 generated, 0 failures)
   - No changes needed
   - Use as reference for what works

7. [ ] **Full Generation**
   - After validation, run full generation: 380 questions
   - Monitor sub-skill distribution
   - Verify failure rate <10%

**Success Criteria:**
- Clear definitions documented
- 5+ examples per sub-skill
- Test generation >80% success rate
- 380 questions generated

---

#### P1-2: Improve Multi-Step Word Problem Validation
**Impact:** Reduce retry rates from 80-130% to <20%, reduce costs

**Tasks:**

1. [ ] **Add Validation Logging**
   - Modify `src/engines/questionGeneration/v2/validators.ts`
   - Log which validation step fails for each rejected question
   - Collect data over 50-100 generation attempts
   - Identify most common failure points

2. [ ] **Relax Numeric Validation**
   - Allow rounding tolerance: ±0.01 for decimals, ±0.5 for whole numbers
   - Accept multiple formats: "0.5" = "1/2" = "50%" = "0.50"
   - Accept with/without units: "5 cm" = "5cm" = "5"

3. [ ] **Improve Solution Validation**
   - Add intermediate step validation for multi-step problems
   - Verify calculation steps, not just final answer
   - Allow alternate solution paths if they reach same answer

4. [ ] **Relax Distractor Validation**
   - Allow distractors that are "close but wrong" not just "mathematically distinct"
   - Accept common student errors as valid distractors
   - Reduce uniqueness strictness slightly

5. [ ] **Test & Measure**
   - Generate 50 Applied Word Problems
   - Measure retry rate
   - Target: <20% retry rate (was 80-130%)
   - Verify question quality maintained

**Success Criteria:**
- Retry rate reduced from 80-130% to <20%
- Cost per question reduced by ~30-40%
- Question quality maintained (no invalid questions passing)

---

### Phase 3: Complete Missing Sections (Week 2-3)

#### P2-1: Generate NSW Selective Reading (300 questions)
**Impact:** Largest single missing section

**Tasks:**
1. [ ] Review curriculumData_v2 for NSW Reading
2. [ ] Verify all sub-skills have examples
3. [ ] Run generation for all modes:
   ```bash
   npx tsx scripts/generation/generate-section-all-modes.ts \
     --test="NSW Selective Entry (Year 7 Entry)" \
     --section="Reading" \
     --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
   ```
4. [ ] Monitor progress, check for failures
5. [ ] Verify 300 questions generated

---

#### P2-2: Generate ACER Missing Sections

**Priority Order:**
1. **Reading Comprehension** (258 questions) - Standard passages, should work well
2. **Verbal Reasoning** (180 questions) - Similar to EduTest/NSW (which succeeded)
3. **Sciences** (300 questions) - Humanities-like, passages
4. **Abstract Reasoning** (160 questions) - May require visual; assess after SVG templates ready

**Tasks for each:**
1. [ ] Audit curriculumData_v2 sub-skills and examples
2. [ ] Run test generation (10 questions per sub-skill)
3. [ ] Full generation if test succeeds
4. [ ] Monitor failures, iterate if needed

**Abstract Reasoning Special Handling:**
- Check if requires visual SVG (likely yes)
- If yes, depends on SVG templates from P0-2
- May need additional templates beyond Set Theory/Spatial

---

#### P2-3: Generate Year 5 NAPLAN Numeracy (390 questions)

**Tasks:**
1. [ ] Numeracy Calculator (210 questions)
   - Review Year 7 NAPLAN calculator questions as reference
   - Adjust difficulty for Year 5 level
   - Generate all modes

2. [ ] Numeracy No Calculator (180 questions)
   - Review Year 7 NAPLAN no-calculator questions
   - Adjust difficulty
   - Generate all modes

3. [ ] Verify sub-skill coverage matches Year 7 pattern

---

#### P2-4: Complete Partial Sections (Fill Gaps)

**Small Gaps (<50 questions):**
1. [ ] Year 7 NAPLAN Numeracy Calculator: 18 questions
2. [ ] Year 7 NAPLAN Language Conventions: 34 questions
3. [ ] Year 5 NAPLAN Reading: 36 questions
4. [ ] Year 5 NAPLAN Language Conventions: 84 questions
5. [ ] VIC General Ability - Verbal: 55 questions
6. [ ] VIC General Ability - Quantitative: 61 questions
7. [ ] VIC Mathematics Reasoning: 78 questions

**Medium Gaps (50-100 questions):**
8. [ ] ACER Mathematics: 93 questions (after SVG templates)

**Large Gaps (>100 questions):**
9. [ ] ACER Humanities: 406 questions
   - Investigate why diagnostic mode failed
   - Complete practice modes to 100%
   - Re-run diagnostic mode

---

### Phase 4: Optimization & Quality (Week 3-4)

#### P3-1: Reduce Pattern-Based Sub-Skill Retry Rates

**Tasks:**
1. [ ] Review validation for:
   - Letter Series & Patterns
   - Code & Symbol Substitution
   - Pattern Recognition in Paired Numbers

2. [ ] Relax pattern validation constraints
3. [ ] Add more diverse pattern types to examples
4. [ ] Test and measure retry rate reduction

---

#### P3-2: Quality Audit & Validation

**Tasks:**
1. [ ] Run comprehensive quality check on all 6,676 questions
2. [ ] Check for duplicates across modes
3. [ ] Verify sub-skill distribution
4. [ ] Sample 50 questions per test type for manual review
5. [ ] Fix any quality issues found

---

#### P3-3: Clean Up Over-Generated Questions (Optional)

**Over-Generated Sections:**
- EduTest Mathematics: +118 questions (350/232)
- EduTest Numerical Reasoning: +32 questions (248/216)
- EduTest Reading: +12 questions (270/258)
- NSW Mathematical Reasoning: -5 questions (185/180)
- NSW Thinking Skills: -32 questions (212/180)
- ACER Written Expression: -4 questions (16/12)

**Total Over:** 295 questions

**Options:**
1. Keep all (total: 6,971 questions)
2. Delete excess to meet targets exactly (total: 6,676 questions)
3. Mark excess as "bonus" questions for harder difficulty modes

**Recommendation:** Keep all - provides variety and backup questions

---

## Success Metrics & Tracking

### Generation Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Total Questions** | 4,013 | 6,676 | 60.1% |
| Practice Questions | 3,355 | 5,567 | 60.3% |
| Diagnostic Questions | 658 | 1,109 | 59.3% |
| Questions Needed | 2,663 | 0 | 39.9% to go |

### Phase Targets

| Phase | Questions to Generate | Cumulative Total | % Complete |
|-------|----------------------|------------------|------------|
| **Current** | 0 | 4,013 | 60.1% |
| **Phase 1** | +108 (SVG + Writing) | 4,121 | 61.7% |
| **Phase 2** | +1,266 (Sub-skill fixes + NSW) | 5,387 | 80.7% |
| **Phase 3** | +1,289 (ACER + Y5 NAPLAN) | 6,676 | 100.0% |
| **Phase 4** | Quality checks only | 6,676 | 100.0% |

### Quality Metrics

Target quality standards:
- [ ] Sub-skill success rate: >90% (currently varies 0-100%)
- [ ] Retry rate: <20% (currently 20-130%)
- [ ] Duplicate rate: <1%
- [ ] Manual quality sample: >85% acceptable
- [ ] Cost per question: <$0.015 (currently $0.006-$0.032)

### Section Completion Tracking

**0% Complete (Must Start):** 10 sections, 1,206 questions
- Priority: NSW Reading (300), ACER Sciences (300), Y5 Numeracy (390)

**1-50% Complete (Behind):** 2 sections, 786 questions
- VIC Reading Reasoning (380 missing)
- ACER Humanities (406 missing)

**51-90% Complete (On Track):** 10 sections, 671 questions
- Multiple small gaps across tests

**91-99% Complete (Nearly Done):** 3 sections, 53 questions
- Year 7 NAPLAN sections

**100%+ Complete (Over-Generated):** 9 sections, -295 questions
- EduTest, NSW Math/Thinking, Year 5/7 Writing

---

## Timeline & Resource Estimate

### Week 1: Critical Fixes
- **P0-1:** Extended response system (2-3 days)
- **P0-2:** SVG templates (3-4 days)
- **P1-1 Start:** VIC Reading taxonomy audit (1-2 days)

**Deliverable:** 108 questions (Writing + SVG-blocked)

---

### Week 2: Sub-Skill Fixes & High-Value Generation
- **P1-1 Complete:** VIC Reading fixes (2 days)
- **P1-2:** Word problem validation (1 day)
- **P2-1:** NSW Reading generation (1 day)
- **P2-2 Start:** ACER sections (2-3 days)

**Deliverable:** +1,266 questions (cumulative: 80.7%)

---

### Week 3: Complete ACER & Year 5 NAPLAN
- **P2-2 Complete:** ACER sections (3 days)
- **P2-3:** Year 5 NAPLAN Numeracy (2 days)
- **P2-4:** Fill small gaps (1 day)

**Deliverable:** +1,289 questions (cumulative: 100%)

---

### Week 4: Quality & Optimization
- **P3-1:** Retry rate optimization (2 days)
- **P3-2:** Quality audit (2 days)
- **P3-3:** Cleanup decisions (1 day)

**Deliverable:** Quality validated, optimizations complete

---

## Cost Estimates

### Current Costs
- Average cost per question: $0.006 - $0.032
- Total spent (estimated): ~$50-80 for 4,013 questions

### Remaining Costs (2,663 questions)
- Conservative estimate (high cost): $0.020/question × 2,663 = **~$53**
- Optimistic estimate (post-optimization): $0.010/question × 2,663 = **~$27**
- Expected: **$35-45**

### Total Project Cost Estimate
- Current + Remaining: **$85-125 total**
- Well within acceptable range for 6,676 high-quality questions

---

## Risk Assessment & Mitigation

### High Risk

1. **Extended Response Fix May Reveal Deeper Issues**
   - Risk: Writing system fix uncovers database/architecture problems
   - Mitigation: Allocate extra time, have fallback plan (manual writing prompt creation)
   - Impact: 30 questions

2. **SVG Template Quality Issues**
   - Risk: Templates don't match curriculum expectations, questions rejected
   - Mitigation: Test with 10 questions before full generation, iterate templates
   - Impact: 78 questions

3. **VIC Reading Reasoning Definition Ambiguity**
   - Risk: After clarification, LLM still can't generate due to lack of clear patterns
   - Mitigation: Provide 7-10 examples per sub-skill (more than usual), test first
   - Impact: 380 questions (largest single risk)

### Medium Risk

4. **ACER Abstract Reasoning Requires New Visual Types**
   - Risk: Abstract reasoning needs different SVG patterns than Set Theory/Spatial
   - Mitigation: Audit sub-skills first, create new templates if needed
   - Impact: 160 questions

5. **Time Overruns Due to Debugging**
   - Risk: System issues take longer to fix than estimated
   - Mitigation: Parallelize work (fix one issue while generating other sections)
   - Impact: Schedule delay

### Low Risk

6. **Generation API Rate Limits**
   - Risk: Anthropic API rate limits slow generation
   - Mitigation: Already handled in current scripts with retry logic
   - Impact: Minor delays

7. **Quality Issues Discovered Late**
   - Risk: Phase 4 audit finds systemic quality problems
   - Mitigation: Continuous quality sampling throughout phases 1-3
   - Impact: Rework needed

---

## Monitoring & Reporting

### Daily Progress Tracking
- Questions generated today
- Cumulative total
- % complete
- Failures by sub-skill
- Cost tracking

### Weekly Milestones
- Week 1: 61.7% complete (target)
- Week 2: 80.7% complete (target)
- Week 3: 100.0% complete (target)
- Week 4: Quality validated

### Success Criteria
- [ ] All 6,676 target questions generated
- [ ] <10 sections with <95% target
- [ ] Retry rate <20% for all sub-skills
- [ ] Quality sample >85% acceptable
- [ ] Total cost <$130

---

## Appendix: Quick Reference

### Generation Commands

**Single Section:**
```bash
npx tsx scripts/generation/generate-section-all-modes.ts \
  --test="[TEST_TYPE]" \
  --section="[SECTION_NAME]" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

**Check Status:**
```bash
npx tsx scripts/audit/comprehensive-v2-audit.ts
```

**Verify Specific Section:**
```bash
npx tsx scripts/generation/post-generation-check.ts \
  --test="[TEST_TYPE]" \
  --section="[SECTION_NAME]"
```

### Priority Queue (Ordered)

1. ⚠️ Fix extended_response (Writing) - 30 questions
2. ⚠️ Create SVG templates - 78 questions
3. ⚠️ Fix VIC Reading taxonomy - 380 questions
4. 📝 Generate NSW Reading - 300 questions
5. 📝 Generate ACER Reading Comprehension - 258 questions
6. 📝 Generate ACER Verbal Reasoning - 180 questions
7. 📝 Generate ACER Sciences - 300 questions
8. 📝 Generate Year 5 Numeracy Calculator - 210 questions
9. 📝 Generate Year 5 Numeracy No Calculator - 180 questions
10. 📝 Generate ACER Abstract Reasoning - 160 questions (check visual requirements)
11. 📝 Complete ACER Humanities diagnostics - 95 questions
12. 📝 Complete ACER Mathematics - 93 questions
13. ✅ Fill all gaps <50 questions

---

**Document Version:** 1.0
**Last Updated:** 2026-02-19
**Status:** Ready for Implementation
