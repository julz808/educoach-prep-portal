# Example Coverage Audit Report

**Date:** 2026-02-22
**Purpose:** Verify complete example coverage for all sub-skill × difficulty level combinations across all test products

---

## Executive Summary

This audit examined 4 test products containing 100 total sub-skills to ensure each has at least 1 example for every difficulty level in its range.

**Results:**
- ✅ **2 products (50%)** have 100% coverage
- ❌ **2 products (50%)** have incomplete coverage

**Critical Finding:** NSW and VIC Selective Schools use only difficulty level 2, while ACER and EduTest use levels 1-3. This is intentional based on test design.

---

## Detailed Results

### 1. ACER Scholarship (Year 7 Entry)

**Status:** ❌ Incomplete (61% coverage)

**Configuration:**
- Total Sub-Skills: 18
- Difficulty Levels Used: 1, 2, 3
- Expected Examples: 54 (18 sub-skills × 3 difficulties)
- Actual Examples: 33
- Missing Examples: 21

**Missing Coverage (12 sub-skills affected):**

#### Mathematics Section

| Sub-Skill | Missing Difficulties |
|-----------|---------------------|
| Probability | Level 1, Level 3 |
| Geometry - Perimeter & Area | Level 1 |
| Fractions & Number Lines | Level 1, Level 3 |
| Data Interpretation & Applied Mathematics | Level 1, Level 3 |

#### Humanities Section

| Sub-Skill | Missing Difficulties |
|-----------|---------------------|
| Main Idea & Theme Identification | Level 1, Level 3 |
| Vocabulary in Context | Level 1, Level 3 |
| Sequencing & Text Organization | Level 2 |
| Analysis & Comparison | Level 3 |
| Visual Interpretation | Level 1, Level 3 |
| Poetry Analysis | Level 3 |

#### Written Expression Section

| Sub-Skill | Missing Difficulties |
|-----------|---------------------|
| Persuasive & Argumentative Writing | Level 2 |
| Creative & Imaginative Writing | Level 2 |

**Impact:** Moderate-High. LLM will lack calibration examples for 39% of required difficulty levels. This may result in:
- Inconsistent difficulty progression
- Under-calibrated easy (level 1) questions
- Under-calibrated hard (level 3) questions
- Written Expression completely missing middle difficulty examples

---

### 2. EduTest Scholarship

**Status:** ❌ Incomplete (93% coverage)

**Configuration:**
- Total Sub-Skills: 26
- Difficulty Levels Used: 1, 2, 3
- Expected Examples: 78 (26 sub-skills × 3 difficulties)
- Actual Examples: 73
- Missing Examples: 5

**Missing Coverage (5 sub-skills affected):**

#### Verbal Reasoning Section

| Sub-Skill | Missing Difficulties |
|-----------|---------------------|
| Code Breaking & Pattern Recognition | Level 3 |
| Word Manipulation & Rearrangement | Level 3 |
| Foreign Language Translation Logic | Level 3 |

#### Written Expression Section

| Sub-Skill | Missing Difficulties |
|-----------|---------------------|
| Creative & Imaginative Writing | Level 3 |
| Persuasive & Argumentative Writing | Level 3 |

**Impact:** Low-Moderate. All missing examples are at difficulty level 3 (hardest). LLM will lack calibration for:
- Most challenging verbal reasoning patterns
- Advanced creative writing expectations
- Complex argumentative essay standards

---

### 3. NSW Selective Schools

**Status:** ✅ 100% Complete

**Configuration:**
- Total Sub-Skills: 25
- Difficulty Levels Used: 2 (only)
- Expected Examples: 25 (25 sub-skills × 1 difficulty)
- Actual Examples: 25
- Missing Examples: 0

**Notes:**
- NSW Selective uses only difficulty level 2 (medium)
- This is intentional - test does not vary difficulty levels within drills
- All sub-skills have required examples
- Perfect coverage for intended difficulty range

---

### 4. VIC Selective Schools

**Status:** ✅ 100% Complete

**Configuration:**
- Total Sub-Skills: 31
- Difficulty Levels Used: 2 (only)
- Expected Examples: 31 (31 sub-skills × 1 difficulty)
- Actual Examples: 31
- Missing Examples: 0

**Notes:**
- VIC Selective uses only difficulty level 2 (medium)
- This is intentional - test does not vary difficulty levels within drills
- All sub-skills have required examples
- Perfect coverage for intended difficulty range

---

## Priority Recommendations

### Critical Priority: ACER Scholarship

**Issue:** Only 61% coverage - missing 21 examples across 12 sub-skills

**Actions Required:**
1. Add Level 1 examples (easier) for:
   - Probability
   - Geometry - Perimeter & Area
   - Fractions & Number Lines
   - Data Interpretation & Applied Mathematics
   - Main Idea & Theme Identification
   - Vocabulary in Context
   - Visual Interpretation

2. Add Level 3 examples (harder) for:
   - Probability
   - Fractions & Number Lines
   - Data Interpretation & Applied Mathematics
   - Main Idea & Theme Identification
   - Vocabulary in Context
   - Analysis & Comparison
   - Visual Interpretation
   - Poetry Analysis

3. Add Level 2 examples for:
   - Sequencing & Text Organization
   - Persuasive & Argumentative Writing
   - Creative & Imaginative Writing

**Estimated Effort:** 2-3 hours to create 21 high-quality examples

---

### Moderate Priority: EduTest Scholarship

**Issue:** 93% coverage - missing 5 Level 3 examples

**Actions Required:**
1. Add Level 3 (hardest) examples for:
   - Code Breaking & Pattern Recognition
   - Word Manipulation & Rearrangement
   - Foreign Language Translation Logic
   - Creative & Imaginative Writing
   - Persuasive & Argumentative Writing

**Estimated Effort:** 30-45 minutes to create 5 advanced examples

---

## Technical Notes

### Why Example Coverage Matters

Complete example coverage is critical for LLM calibration during question generation because:

1. **Difficulty Calibration:** The LLM uses examples to understand what constitutes "easy", "medium", and "hard" questions for each sub-skill.

2. **Pattern Learning:** Examples teach the LLM the expected question format, structure, and complexity at each difficulty level.

3. **Quality Consistency:** Without examples at all difficulty levels, the LLM may:
   - Generate inconsistent difficulty progressions
   - Create questions that don't match the test's style at certain difficulties
   - Struggle to differentiate between adjacent difficulty levels

4. **Distractor Quality:** Examples show how distractors (wrong answers) should be crafted at each difficulty level.

### Difficulty Level Definitions

- **Level 1 (Easy):** Basic concept application, single-step problems, explicit information
- **Level 2 (Medium):** Multi-step reasoning, inference required, moderate complexity
- **Level 3 (Hard):** Complex multi-step problems, abstract reasoning, synthesis of multiple concepts

### Why NSW/VIC Use Only Level 2

NSW and VIC Selective Schools tests are designed with:
- Consistent difficulty throughout each section
- No progressive difficulty ramping within drills
- All questions at "medium" difficulty appropriate for Year 5-6 students
- This is an intentional design choice, not a gap

---

## Verification Script

The audit was performed using:
```
/Users/julz88/Documents/educoach-prep-portal-2/scripts/audit/audit-example-coverage.ts
```

To re-run the audit:
```bash
npx tsx scripts/audit/audit-example-coverage.ts
```

---

## Appendix: Complete Coverage Matrix

### ACER Scholarship (Year 7 Entry) - Mathematics

| Sub-Skill | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| Set Theory & Venn Diagrams | ✅ (2) | ✅ (2) | ✅ (1) |
| Probability | ❌ | ✅ (2) | ❌ |
| Geometry - Perimeter & Area | ❌ | ✅ (2) | ✅ (1) |
| Spatial Reasoning - Reflections & Transformations | ✅ (2) | ✅ (2) | ✅ (1) |
| Spatial Reasoning - 3D Visualization | ✅ (2) | ✅ (2) | ✅ (2) |
| Fractions & Number Lines | ❌ | ✅ (2) | ❌ |
| Logic Puzzles & Algebraic Reasoning | N/A | ✅ (1) | ✅ (2) |
| Data Interpretation & Applied Mathematics | ❌ | ✅ (4) | ❌ |

### ACER Scholarship (Year 7 Entry) - Humanities

| Sub-Skill | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| Main Idea & Theme Identification | ❌ | ✅ (2) | ❌ |
| Inference & Interpretation | N/A | ✅ (1) | ✅ (1) |
| Vocabulary in Context | ❌ | ✅ (2) | ❌ |
| Sequencing & Text Organization | N/A | ❌ | ✅ (1) |
| Literal Comprehension | ✅ (1) | ✅ (1) | N/A |
| Analysis & Comparison | N/A | ✅ (2) | ❌ |
| Visual Interpretation | ❌ | ✅ (3) | ❌ |
| Poetry Analysis | N/A | ✅ (3) | ❌ |

### ACER Scholarship (Year 7 Entry) - Written Expression

| Sub-Skill | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|
| Persuasive & Argumentative Writing | N/A | ❌ | ✅ (1) |
| Creative & Imaginative Writing | N/A | ❌ | ✅ (1) |

### EduTest Scholarship - Coverage Summary

| Section | Level 1 | Level 2 | Level 3 | Missing |
|---------|---------|---------|---------|---------|
| Mathematics | 100% | 100% | 100% | 0 |
| Non-Verbal Reasoning | 100% | 100% | 100% | 0 |
| Verbal Reasoning | 100% | 100% | 70% | 3 |
| Reading Comprehension | 100% | 100% | 100% | 0 |
| Written Expression | 100% | 100% | 0% | 2 |

---

*End of Report*
