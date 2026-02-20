# Most Problematic Sub-Skills - Priority Fix List

**Generated:** 2026-02-19
**Purpose:** Quick reference for most critical sub-skill issues requiring immediate attention

---

## CRITICAL (P0) - Fix Immediately

### 1. ❌ **ALL WRITING PROMPTS** - System-Level Failure
**Impact:** 18 questions, blocks 3 test types
**Tests Affected:** VIC Writing, NSW Writing, possibly others
**Sub-Skills:**
- Creative Writing (VIC) - 6 failures
- Persuasive Writing (VIC) - 6 failures
- Imaginative/Speculative Writing (NSW) - 6 failures

**Root Cause:** Extended response generation/validation system issue
**Action:**
1. Debug extended_response question generation flow
2. Check database constraints for extended_response type
3. Review validation logic in writingAssessmentService.ts
4. Test with single prompt first

---

### 2. ❌ **Set Theory & Venn Diagrams** (ACER Mathematics)
**Impact:** 30 questions, 100% failure rate
**Failures:** 30/30 (0% success)

**Root Cause:** Requires complex overlapping circle SVG generation
**Action:**
1. Create SVG templates for 2-set and 3-set Venn diagrams
2. Add to curriculumData_v2 examples with working SVG
3. Add set notation rendering helper functions

---

### 3. ❌ **Spatial Reasoning - Reflections & Transformations** (ACER)
**Impact:** 24 questions, 100% failure rate
**Failures:** 24/24 (0% success)

**Root Cause:** Requires SVG generation of geometric transformations
**Action:**
1. Create SVG templates for: reflections (mirror lines), rotations (center point), translations
2. Add coordinate transformation helper functions
3. Add 3-5 worked examples with complete SVG

---

### 4. ❌ **Spatial Reasoning - 3D Visualization** (ACER Mathematics)
**Impact:** 24 questions, 100% failure rate
**Failures:** 24/24 (0% success)

**Root Cause:** Requires complex 3D isometric SVG drawings
**Action:**
1. Create isometric grid SVG templates
2. Add 3D cube/prism drawing helpers
3. Simplify to common 3D shapes (cube, rectangular prism, cylinder)
4. Add orthographic projection examples

---

## HIGH PRIORITY (P1) - Fix This Week

### 5. ❌ **Vocabulary (Standalone)** (VIC Reading Reasoning)
**Impact:** 36 questions, 100% failure rate
**Failures:** 36/36 (0% success)

**Root Cause:** Unclear definition - what makes vocabulary "standalone"?
**Action:**
1. Clarify distinction from vocabulary-in-context (analogies)
2. Review successful vocabulary questions in other tests
3. Add 5+ diverse "standalone" examples to curriculum
4. Consider: synonym/antonym selection, word meaning, word usage

---

### 6. ❌ **Grammar & Punctuation** (VIC Reading Reasoning)
**Impact:** 30 questions, 100% failure rate
**Failures:** 30/30 (0% success)

**Root Cause:** Overlaps with Language Conventions, format unclear
**Action:**
1. Clarify distinction from Language Conventions section
2. Define what makes this "Reading Reasoning" vs "Language"
3. Add examples showing correct format
4. Consider: grammar-in-context vs isolated grammar rules

---

### 7. ❌ **Idioms & Expressions** (VIC Reading Reasoning)
**Impact:** 18 questions, 100% failure rate
**Failures:** 18/18 (0% success)

**Root Cause:** Requires cultural/contextual understanding
**Action:**
1. Create Australian idioms and expressions list
2. Add context-based idiom questions (meaning in passage)
3. Include both common and age-appropriate expressions
4. Add 5+ diverse examples

---

### 8. ❌ **Spelling & Word Usage** (VIC Reading Reasoning)
**Impact:** 12 questions, 100% failure rate
**Failures:** 12/12 (0% success)

**Root Cause:** Similar to Language Conventions, format unclear
**Action:**
1. Clarify format expectations
2. Add examples: commonly confused words, spelling patterns
3. Distinguish from Language Conventions spelling
4. Focus on context-based usage

---

### 9. ⚠️ **Applied Word Problems** (VIC Quantitative)
**Impact:** 22 questions, 31% failure rate
**Failures:** 22/72 (69% success)
**Reattempts:** 82 (very high)

**Root Cause:** Multi-step validation issues
**Action:**
1. Review solution validation for multi-step problems
2. Add intermediate step verification
3. Improve distractor generation for word problems
4. Add 10+ diverse word problem examples

---

### 10. ⚠️ **Pattern Recognition in Paired Numbers** (VIC Quantitative)
**Impact:** 21 questions, 29% failure rate
**Failures:** 21/72 (71% success)
**Reattempts:** 61 (high)

**Root Cause:** Pattern validation too strict
**Action:**
1. Review pattern detection logic
2. Allow more pattern types (not just arithmetic/geometric)
3. Add examples: alternating patterns, combined operations
4. Relax validation constraints

---

## MEDIUM PRIORITY (P2) - Improve Next Sprint

### 11. ⚠️ **Letter Series & Patterns** (VIC Verbal)
**Impact:** 20 questions, 37% failure rate
**Failures:** 20/54 (63% success)
**Reattempts:** 64 (very high)

**Root Cause:** Alphabetic pattern rules too complex
**Action:**
1. Simplify pattern types (skip by n, reverse, alternating)
2. Add clear pattern rule descriptions
3. Improve validation to accept valid variations

---

### 12. ⚠️ **Word Problems & Logical Reasoning** (VIC Mathematics)
**Impact:** 15 questions, 36% failure rate
**Failures:** 15/42 (64% success)
**Reattempts:** 47 (high)

**Root Cause:** Logical reasoning validation complex
**Action:**
1. Break into sub-types: deduction, elimination, constraint satisfaction
2. Add structured templates for each logic type
3. Improve multi-step solution validation

---

### 13. ⚠️ **Advanced Problem Solving & Multi-Step Calculations** (Year 7 NAPLAN)
**Impact:** 17 questions, 40% failure rate
**Failures:** 17/42 (60% success)
**Reattempts:** 50 (very high)

**Root Cause:** Calculator-specific validation issues
**Action:**
1. Review calculator vs non-calculator problem requirements
2. Ensure solution validation handles calculator-appropriate complexity
3. Add more multi-step calculation examples

---

### 14. ⚠️ **Logic Puzzles & Algebraic Reasoning** (ACER Mathematics)
**Impact:** 9 questions, 37% failure rate
**Failures:** 9/24 (63% success)
**Reattempts:** 24

**Root Cause:** Logical constraints difficult to validate
**Action:**
1. Create structured templates: sudoku-style, grid logic, algebra puzzles
2. Add constraint validation helpers
3. Provide 5+ worked examples for each puzzle type

---

### 15. ⚠️ **Fractions, Decimals & Percentages** (VIC Mathematics)
**Impact:** 15 questions, 31% failure rate
**Failures:** 15/48 (69% success)

**Action:**
1. Add more diverse examples covering all three types
2. Include conversion problems between types
3. Add real-world application examples

---

### 16. ⚠️ **Punctuation & Sentence Boundaries** (Year 7 NAPLAN)
**Impact:** 14 questions, 21% failure rate
**Failures:** 14/66 (79% success)
**Reattempts:** 74 (very high)

**Action:**
1. Review punctuation validation logic
2. Ensure Australian English conventions
3. Add examples: commas, semicolons, dashes, quotation marks

---

## Summary Statistics

| Priority | Sub-Skills | Total Failures | Avg Success Rate | Total Impact |
|----------|-----------|----------------|------------------|--------------|
| P0 (Critical) | 4 | 96 | 0% | 96 questions blocked |
| P1 (High) | 6 | 144 | 35% | 144+ questions with issues |
| P2 (Medium) | 6 | 90 | 70% | 90 questions + high retry costs |
| **TOTAL** | **16** | **330** | **43%** | **330+ questions affected** |

---

## Quick Win Opportunities

### Easiest Fixes (High Impact, Low Effort)

1. **Vocabulary (Standalone)** - Just needs clear definition + 5 examples
2. **Idioms & Expressions** - Create Australian idioms list + examples
3. **Spelling & Word Usage** - Clarify format + add examples
4. **Grammar & Punctuation** - Distinguish from Language Conventions

**Impact:** Unlocks 96 questions with ~4 hours of curriculum work

### Medium Effort, High Impact

1. **Writing Prompts** - Debug system issue
2. **Set Theory & Venn Diagrams** - Create SVG templates
3. **Spatial Reasoning** - Create transformation templates

**Impact:** Unlocks 78 questions with ~8-12 hours of development

---

## Investigation Required

### Sub-Skills Needing Deeper Analysis

1. **ACER Humanities (Diagnostic Mode)** - Why did generation stop?
2. **EduTest Mathematics Diagnostic** - Only 6 questions generated
3. **NSW/Year 5 NAPLAN** - Most sections barely started

---

## Next Actions

### This Week
1. [ ] Fix extended_response system for writing prompts
2. [ ] Create SVG templates for Set Theory, Spatial Reasoning
3. [ ] Clarify vocabulary sub-skill taxonomy
4. [ ] Add 5+ examples to all P0/P1 sub-skills

### Next Week
1. [ ] Improve word problem validation logic
2. [ ] Fix pattern recognition validation
3. [ ] Complete missing test sections (NSW, Year 5 NAPLAN)
4. [ ] Re-run generation for fixed sub-skills

### Week 3
1. [ ] Optimize P2 sub-skills
2. [ ] Reduce retry rates across all sub-skills
3. [ ] Complete all sections to 80%+ target

---

**Key Insight:**
The top 10 problematic sub-skills represent only **16% of all sub-skills** but account for **~330 question failures** (likely 15-20% of total generation attempts). Fixing these will dramatically improve overall success rate.
