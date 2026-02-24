# Example Coverage Audit - Quick Summary

**Audit Date:** 2026-02-22
**Auditor:** Automated Script

---

## Overall Results

| Test Product | Sub-Skills | Difficulty Levels | Coverage | Status |
|--------------|------------|------------------|----------|---------|
| **ACER Scholarship** | 18 | 1, 2, 3 | 61% | ❌ 21 missing |
| **EduTest Scholarship** | 26 | 1, 2, 3 | 93% | ❌ 5 missing |
| **NSW Selective Schools** | 25 | 2 only | 100% | ✅ Complete |
| **VIC Selective Schools** | 31 | 2 only | 100% | ✅ Complete |

---

## Critical Findings

### 🚨 ACER Scholarship - 39% Gap (21 missing examples)

**Mathematics** - 4 sub-skills affected:
- Probability: Missing Level 1, 3
- Geometry - Perimeter & Area: Missing Level 1
- Fractions & Number Lines: Missing Level 1, 3
- Data Interpretation: Missing Level 1, 3

**Humanities** - 6 sub-skills affected:
- Main Idea & Theme: Missing Level 1, 3
- Vocabulary in Context: Missing Level 1, 3
- Sequencing: Missing Level 2
- Analysis & Comparison: Missing Level 3
- Visual Interpretation: Missing Level 1, 3
- Poetry Analysis: Missing Level 3

**Written Expression** - 2 sub-skills affected:
- Persuasive Writing: Missing Level 2
- Creative Writing: Missing Level 2

### ⚠️ EduTest Scholarship - 7% Gap (5 missing examples)

All missing examples are **Level 3 (hardest)** only:

**Verbal Reasoning** - 3 sub-skills:
- Code Breaking & Pattern Recognition
- Word Manipulation & Rearrangement
- Foreign Language Translation Logic

**Written Expression** - 2 sub-skills:
- Creative Writing
- Persuasive Writing

---

## Why This Matters

Complete example coverage is **critical for LLM calibration** during question generation:

1. **Difficulty Calibration:** LLM learns what "easy", "medium", and "hard" means for each sub-skill
2. **Pattern Learning:** Examples teach expected question format and complexity at each level
3. **Quality Consistency:** Missing examples lead to inconsistent difficulty progressions
4. **Distractor Quality:** Examples show how wrong answers should be crafted at each level

---

## Priority Actions

### Priority 1: ACER Scholarship (Critical)
- **Impact:** High - 39% of examples missing
- **Effort:** 2-3 hours to create 21 examples
- **Risk:** LLM will generate inconsistent difficulty, especially at Level 1 (easy) and Level 3 (hard)

### Priority 2: EduTest Scholarship (Moderate)
- **Impact:** Moderate - Only Level 3 affected
- **Effort:** 30-45 minutes to create 5 examples
- **Risk:** LLM may struggle with hardest questions in Verbal Reasoning and Written Expression

---

## How to Re-run Audit

```bash
cd /Users/julz88/Documents/educoach-prep-portal-2
npx tsx scripts/audit/audit-example-coverage.ts
```

---

## Full Details

See: `EXAMPLE-COVERAGE-AUDIT-REPORT.md` for complete coverage matrix and technical details.
