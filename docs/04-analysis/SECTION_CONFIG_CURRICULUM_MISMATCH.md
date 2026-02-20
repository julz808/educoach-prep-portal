# Section Configuration vs Curriculum Data Mismatch Report

**Test Type:** EduTest Scholarship (Year 7 Entry)
**Generated:** 2026-02-12
**Purpose:** Identify mismatches between sectionConfigurations.ts and actual curriculum data in edutest.ts

---

## Executive Summary

This report compares the sub-skills defined in `sectionConfigurations.ts` against the actual sub-skills that exist in the curriculum data file `edutest.ts` for EduTest Scholarship (Year 7 Entry).

**Critical Issues Found:**
- Verbal Reasoning: 0 matches out of 8 config sub-skills
- Numerical Reasoning: 0 matches out of 4 config sub-skills
- Reading Comprehension: 2 matches out of 6 config sub-skills (33%)
- Mathematics: 0 matches out of 4 config sub-skills

**Overall Status:** SEVERE MISALIGNMENT - Most configurations do not match actual curriculum data

---

## Section 1: Verbal Reasoning

### Configuration Sub-Skills (from sectionConfigurations.ts)
1. Vocabulary & Semantic Knowledge
2. Analogical Reasoning & Relationships
3. Word Classification & Odd One Out
4. Verbal Logic & Critical Reasoning
5. Sentence Completion
6. Language Patterns & Word Relationships
7. Comprehension & Inference
8. Figurative Language & Idioms

### Actual Curriculum Sub-Skills (from edutest.ts)
1. Vocabulary & Semantic Knowledge
2. Analogical Reasoning & Relationships
3. Code Breaking & Pattern Recognition
4. Word Manipulation & Rearrangement
5. Foreign Language Translation Logic
6. Logical Deduction & Conditional Reasoning
7. Sequential Ordering & Position Reasoning
8. Classification & Categorization (Odd One Out)

### Comparison Analysis

#### ✅ MATCHES (2)
- "Vocabulary & Semantic Knowledge" - EXACT MATCH
- "Analogical Reasoning & Relationships" - EXACT MATCH

#### ❌ IN CONFIG BUT NOT IN CURRICULUM (6)
These sub-skills are configured but have NO curriculum data:
1. "Word Classification & Odd One Out" - **Missing from curriculum**
2. "Verbal Logic & Critical Reasoning" - **Missing from curriculum**
3. "Sentence Completion" - **Missing from curriculum**
4. "Language Patterns & Word Relationships" - **Missing from curriculum**
5. "Comprehension & Inference" - **Missing from curriculum**
6. "Figurative Language & Idioms" - **Missing from curriculum**

#### ⚠️ IN CURRICULUM BUT NOT IN CONFIG (6)
These sub-skills have curriculum data but are NOT in the configuration:
1. "Code Breaking & Pattern Recognition" - **Not in config**
2. "Word Manipulation & Rearrangement" - **Not in config**
3. "Foreign Language Translation Logic" - **Not in config**
4. "Logical Deduction & Conditional Reasoning" - **Not in config**
5. "Sequential Ordering & Position Reasoning" - **Not in config**
6. "Classification & Categorization (Odd One Out)" - **Not in config** (Note: Similar to config #3 but different name)

#### 🔧 POTENTIAL NAME MISMATCHES
- Config: "Word Classification & Odd One Out" → Curriculum: "Classification & Categorization (Odd One Out)"
- Config: "Verbal Logic & Critical Reasoning" → Curriculum: "Logical Deduction & Conditional Reasoning" (possibly related)

---

## Section 2: Numerical Reasoning

### Configuration Sub-Skills (from sectionConfigurations.ts)
1. Number Patterns & Sequences
2. Numerical Relationships & Analogies
3. Quantitative Reasoning
4. Data Interpretation & Analysis

### Actual Curriculum Sub-Skills (from edutest.ts)
1. Number Series & Pattern Recognition
2. Word Problems & Applied Reasoning
3. Number Matrices & Grid Patterns
4. Number Properties & Operations

### Comparison Analysis

#### ✅ MATCHES (0)
**NONE** - No exact matches found!

#### ❌ IN CONFIG BUT NOT IN CURRICULUM (4)
These sub-skills are configured but have NO curriculum data:
1. "Number Patterns & Sequences" - **Missing from curriculum**
2. "Numerical Relationships & Analogies" - **Missing from curriculum**
3. "Quantitative Reasoning" - **Missing from curriculum**
4. "Data Interpretation & Analysis" - **Missing from curriculum**

#### ⚠️ IN CURRICULUM BUT NOT IN CONFIG (4)
These sub-skills have curriculum data but are NOT in the configuration:
1. "Number Series & Pattern Recognition" - **Not in config**
2. "Word Problems & Applied Reasoning" - **Not in config**
3. "Number Matrices & Grid Patterns" - **Not in config**
4. "Number Properties & Operations" - **Not in config**

#### 🔧 POTENTIAL NAME MISMATCHES
- Config: "Number Patterns & Sequences" → Curriculum: "Number Series & Pattern Recognition" (very similar concept)
- Config: "Quantitative Reasoning" → Curriculum: "Word Problems & Applied Reasoning" (possibly related)

---

## Section 3: Reading Comprehension

### Configuration Sub-Skills (from sectionConfigurations.ts)
**NOTE:** This section uses a hybrid strategy with both standalone and passage-based questions.

#### Standalone Sub-Skills:
1. Sentence Transformation
2. Grammar & Punctuation
3. Vocabulary in Context
4. Figurative Language & Idioms
5. Language Conventions

#### Passage-Based Sub-Skills:
6. Passage Comprehension & Inference

### Actual Curriculum Sub-Skills (from edutest.ts)
1. Vocabulary in Context
2. Passage Comprehension & Inference
3. Grammar & Sentence Correction
4. Punctuation & Capitalization
5. Sentence Transformation
6. Figurative Language & Idioms

### Comparison Analysis

#### ✅ MATCHES (4)
- "Vocabulary in Context" - EXACT MATCH
- "Passage Comprehension & Inference" - EXACT MATCH
- "Sentence Transformation" - EXACT MATCH
- "Figurative Language & Idioms" - EXACT MATCH

#### ❌ IN CONFIG BUT NOT IN CURRICULUM (2)
These sub-skills are configured but have NO curriculum data:
1. "Grammar & Punctuation" - **Missing from curriculum** (Note: Similar to "Grammar & Sentence Correction" and "Punctuation & Capitalization")
2. "Language Conventions" - **Missing from curriculum**

#### ⚠️ IN CURRICULUM BUT NOT IN CONFIG (2)
These sub-skills have curriculum data but are NOT in the configuration:
1. "Grammar & Sentence Correction" - **Not in config**
2. "Punctuation & Capitalization" - **Not in config**

#### 🔧 POTENTIAL NAME MISMATCHES
- Config: "Grammar & Punctuation" → Curriculum has TWO separate sub-skills:
  - "Grammar & Sentence Correction"
  - "Punctuation & Capitalization"
  - **Action Required:** Config combines two curriculum sub-skills into one

---

## Section 4: Mathematics

### Configuration Sub-Skills (from sectionConfigurations.ts)
1. Number & Algebra
2. Measurement & Geometry
3. Statistics & Probability
4. Problem Solving & Reasoning

### Actual Curriculum Sub-Skills (from edutest.ts)
1. Fractions & Mixed Numbers
2. Decimals & Decimal Operations
3. Algebra & Equation Solving
4. Geometry & Spatial Reasoning
5. Statistics & Data Interpretation
6. Applied Word Problems

### Comparison Analysis

#### ✅ MATCHES (0)
**NONE** - No exact matches found!

#### ❌ IN CONFIG BUT NOT IN CURRICULUM (4)
These sub-skills are configured but have NO curriculum data:
1. "Number & Algebra" - **Missing from curriculum**
2. "Measurement & Geometry" - **Missing from curriculum**
3. "Statistics & Probability" - **Missing from curriculum**
4. "Problem Solving & Reasoning" - **Missing from curriculum**

#### ⚠️ IN CURRICULUM BUT NOT IN CONFIG (6)
These sub-skills have curriculum data but are NOT in the configuration:
1. "Fractions & Mixed Numbers" - **Not in config**
2. "Decimals & Decimal Operations" - **Not in config**
3. "Algebra & Equation Solving" - **Not in config**
4. "Geometry & Spatial Reasoning" - **Not in config**
5. "Statistics & Data Interpretation" - **Not in config**
6. "Applied Word Problems" - **Not in config**

#### 🔧 POTENTIAL NAME MISMATCHES
**Config uses broad categories, curriculum uses specific sub-skills:**
- Config: "Number & Algebra" → Curriculum has:
  - "Fractions & Mixed Numbers"
  - "Decimals & Decimal Operations"
  - "Algebra & Equation Solving"
- Config: "Measurement & Geometry" → Curriculum: "Geometry & Spatial Reasoning"
- Config: "Statistics & Probability" → Curriculum: "Statistics & Data Interpretation"
- Config: "Problem Solving & Reasoning" → Curriculum: "Applied Word Problems"

---

## Summary of Issues by Section

| Section | Total Config Sub-Skills | Exact Matches | Config Missing | Curriculum Extras | Match Rate |
|---------|------------------------|---------------|----------------|-------------------|------------|
| **Verbal Reasoning** | 8 | 2 | 6 | 6 | 25% |
| **Numerical Reasoning** | 4 | 0 | 4 | 4 | 0% |
| **Reading Comprehension** | 6 | 4 | 2 | 2 | 67% |
| **Mathematics** | 4 | 0 | 4 | 6 | 0% |
| **TOTAL** | 22 | 6 | 16 | 18 | 27% |

---

## Recommended Actions

### PRIORITY 1: Update Section Configurations (CRITICAL)

**File to Update:** `src/data/curriculumData_v2/sectionConfigurations.ts`

#### 1. Verbal Reasoning - Replace sub_skills array:
```typescript
sub_skills: [
  "Vocabulary & Semantic Knowledge",
  "Analogical Reasoning & Relationships",
  "Code Breaking & Pattern Recognition",
  "Word Manipulation & Rearrangement",
  "Foreign Language Translation Logic",
  "Logical Deduction & Conditional Reasoning",
  "Sequential Ordering & Position Reasoning",
  "Classification & Categorization (Odd One Out)"
],
```

#### 2. Numerical Reasoning - Replace sub_skills array:
```typescript
sub_skills: [
  "Number Series & Pattern Recognition",
  "Word Problems & Applied Reasoning",
  "Number Matrices & Grid Patterns",
  "Number Properties & Operations"
],
```

#### 3. Reading Comprehension - Update standalone_distribution:
```typescript
standalone_distribution: [
  { sub_skill: "Sentence Transformation", count: 8 },
  { sub_skill: "Grammar & Sentence Correction", count: 8 },
  { sub_skill: "Punctuation & Capitalization", count: 7 },
  { sub_skill: "Vocabulary in Context", count: 12 },
  { sub_skill: "Figurative Language & Idioms", count: 8 }
],
```

**Remove:**
- "Grammar & Punctuation" (replaced by two separate sub-skills)
- "Language Conventions" (not in curriculum)

#### 4. Mathematics - Replace sub_skills array:
```typescript
sub_skills: [
  "Fractions & Mixed Numbers",
  "Decimals & Decimal Operations",
  "Algebra & Equation Solving",
  "Geometry & Spatial Reasoning",
  "Statistics & Data Interpretation",
  "Applied Word Problems"
],
```

**Update:** `total_questions: 60` and `distribution_strategy: "even"` will give 10 questions per sub-skill (60 ÷ 6 = 10)

---

## Testing After Fixes

After updating the configuration file, verify:

1. **Check generation scripts** - Ensure they can find all sub-skills
2. **Test question generation** - Generate a small batch from each section
3. **Verify distribution** - Confirm questions are generated for all sub-skills
4. **Check database queries** - Ensure curriculum lookups succeed

---

## Notes

- **Root Cause:** Configurations were created with generic/standardized sub-skill names, but curriculum data uses specific, detailed sub-skill names
- **Impact:** Current configuration would fail to generate questions because sub-skill names don't match the curriculum database
- **Prevention:** Always extract sub-skill names directly from curriculum data when creating configurations

---

## Files Referenced

- **Configuration File:** `/Users/julz88/Documents/educoach-prep-portal-2/src/data/curriculumData_v2/sectionConfigurations.ts`
- **Curriculum Data:** `/Users/julz88/Documents/educoach-prep-portal-2/src/data/curriculumData_v2/edutest.ts`
