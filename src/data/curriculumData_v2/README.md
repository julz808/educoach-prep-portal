# Curriculum Data V2 - Modular Structure

**Created:** February 3, 2026
**Purpose:** Pattern-based question generation with authentic example questions

## 📁 File Structure

```
curriculumData_v2/
├── README.md                 # This file
├── types.ts                  # Shared TypeScript interfaces + TEST_STRUCTURES
├── index.ts                  # Barrel export (imports all modules)
├── edutest.ts                # ✅ COMPLETE - EduTest Scholarship (123KB)
├── acer.ts                   # 📝 Placeholder - ACER Scholarship
├── nsw-selective.ts          # 📝 Placeholder - NSW Selective Entry
├── vic-selective.ts          # 📝 Placeholder - VIC Selective Entry
├── naplan-year5.ts           # 📝 Placeholder - Year 5 NAPLAN
└── naplan-year7.ts           # 📝 Placeholder - Year 7 NAPLAN
```

## ✅ Population Status

| Test Type | Status | Sections | Sub-Skills | Examples | File Size |
|-----------|--------|----------|------------|----------|-----------|
| **EduTest** | ✅ Complete | 4 | 22 | 103 | 123 KB |
| **ACER** | ✅ Complete | 3 | 18 | 40 | 57 KB |
| NSW Selective | 📝 Placeholder | 4 | 0 | 0 | 1.8 KB |
| VIC Selective | 📝 Placeholder | 5 | 0 | 0 | 2.0 KB |
| Year 5 NAPLAN | 📝 Placeholder | 5 | 0 | 0 | 1.9 KB |
| Year 7 NAPLAN | 📝 Placeholder | 5 | 0 | 0 | 1.9 KB |

## 📖 Usage Guide

### Import Everything (Simple)
```typescript
import { SUB_SKILL_EXAMPLES, TEST_STRUCTURES } from '@/data/curriculumData_v2';

// Access any test type
const edutest = SUB_SKILL_EXAMPLES['EduTest Scholarship (Year 7 Entry) - Verbal Reasoning'];
```

### Import Specific Test Type (Recommended)
```typescript
import { EDUTEST_SUB_SKILLS } from '@/data/curriculumData_v2/edutest';
import { TEST_STRUCTURES } from '@/data/curriculumData_v2';

// Only loads EduTest data (smaller bundle)
const verbalReasoning = EDUTEST_SUB_SKILLS['EduTest Scholarship (Year 7 Entry) - Verbal Reasoning'];
```

### Import Only Types
```typescript
import type { SubSkillExample, SubSkillPattern } from '@/data/curriculumData_v2';

// Type-only imports (zero runtime cost)
function processExample(example: SubSkillExample) { /* ... */ }
```

## 🎯 EduTest Scholarship - Complete Breakdown

### Verbal Reasoning (8 sub-skills, 41 examples)
1. Vocabulary & Semantic Knowledge (9 examples)
2. Analogical Reasoning & Relationships (9 examples)
3. Code Breaking & Pattern Recognition (3 examples)
4. Word Manipulation & Rearrangement (2 examples)
5. Foreign Language Translation Logic (3 examples)
6. Logical Deduction & Conditional Reasoning (5 examples)
7. Sequential Ordering & Position Reasoning (4 examples)
8. Classification & Categorization (6 examples)

### Numerical Reasoning (4 sub-skills, 23 examples)
1. Number Series & Pattern Recognition (6 examples)
2. Number Matrices & Grid Patterns (3 examples)
3. Word Problems & Applied Reasoning (7 examples)
4. Number Properties & Operations (7 examples)

### Reading Comprehension (6 sub-skills, 24 examples)
**Note:** 70% Language Conventions, 30% Traditional Comprehension
1. Vocabulary in Context (3 examples)
2. Passage-Based Comprehension (3 examples)
3. Grammar & Sentence Correction (3 examples)
4. Punctuation & Capitalization (3 examples)
5. Sentence Transformation (3 examples)
6. Figurative Language & Idioms (3 examples)

### Mathematics (4 sub-skills, 15 examples)
1. Fractions & Mixed Numbers (4 examples)
2. Decimals & Decimal Operations (4 examples)
3. Algebra & Equation Solving (3 examples)
4. Geometry & Spatial Reasoning (4 examples)

## 🚀 Next Steps - Populating Remaining Tests

For each test type, follow this process:

### 1. Analyze Sample Questions
- Read all sample PDFs for a test section
- Categorize questions by pattern/skill type
- Identify 4-8 distinct sub-skills

### 2. Extract Examples
- Select 3+ representative examples per sub-skill
- Include examples across difficulty levels (1, 2, 3)
- Copy questions EXACTLY from samples (no modification)
- Include full passages where applicable

### 3. Document Patterns
For each sub-skill, document:
- `description`: What skill is being tested
- `question_format`: Format template
- `examples`: Array of example questions
- `pattern.format_template`: Question generation template
- `pattern.key_characteristics`: Defining features
- `pattern.distractor_strategies`: How wrong answers are created
- `pattern.difficulty_progression`: How difficulty scales

### 4. File Organization
Each test type file should have:
- Import statement for types
- JSDoc comment describing the test
- Export const with SubSkillExamplesDatabase type
- Section comments separating each test section
- Closing `as const;` statement

## 🔧 Benefits of Modular Structure

✅ **Maintainable** - Each file is 2-3K lines instead of 16K+
✅ **Fast Navigation** - Jump directly to test you're working on
✅ **Parallel Development** - Multiple people can work simultaneously
✅ **Performance** - Import only what you need
✅ **Git-Friendly** - Fewer merge conflicts
✅ **IDE-Friendly** - Editors handle smaller files better

## 📝 Migration Notes

The original `curriculumData_v2.ts` (single file, 3,239 lines) remains in place. Once all test types are populated in the modular structure, it can be deprecated and removed.

**Current:** Both structures exist
**Future:** Remove old single-file version once migration is complete
