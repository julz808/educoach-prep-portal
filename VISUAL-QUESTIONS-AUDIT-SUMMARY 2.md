# Visual Questions Comprehensive Audit - Executive Summary

**Date:** February 21, 2026
**Audit Scope:** All 344 questions with visual components in questions_v2 table
**Purpose:** Determine which questions can be answered without SVG visuals

---

## Key Findings

### Overall Results

✅ **237 questions (68.9%)** can be answered WITHOUT the SVG visual
❌ **107 questions (31.1%)** REQUIRE visual support based on current question text

**Your hypothesis was CORRECT:** The vast majority of visual questions can be completed without visual aids by using the description in the question text or visual_data.

---

## Detailed Breakdown by Category

### 1. TABLE Questions (119 total)

| Status | Count | Percentage | Description |
|--------|-------|------------|-------------|
| ✅ Can Answer | 89 | 74.8% | Have complete table data in question_text as markdown tables |
| ❌ Need Visual | 31 | 26.1% | Table mentioned but data NOT in text, relies on SVG |

**Action Required:**
- **89 questions:** Convert markdown tables to HTML rendering (text is more accurate than SVG)
- **31 questions:** Add missing table data to question_text OR keep SVG

### 2. GRID/PATTERN Questions (66 total)

| Status | Count | Percentage | Description |
|--------|-------|------------|-------------|
| ✅ Can Answer | 46 | 69.7% | Grid data in text or detailed in visual description |
| ❌ Need Visual | 20 | 30.3% | No grid data in text, vague description |

**Action Required:**
- **46 questions:** Work fine as-is or need minor formatting
- **20 questions:** Add complete grid data to question_text (e.g., "Row 1: 2, 4, 6...")

### 3. GEOMETRY Questions (70 total)

| Status | Count | Percentage | Description |
|--------|-------|------------|-------------|
| ✅ Can Answer | 40 | 57.1% | All measurements provided in question text |
| ❌ Need Visual | 30 | 42.9% | Missing some measurements in text |

**Examples of Complete:**
- "A rectangular box has length 30 cm, width 20 cm, height 15 cm. What is the surface area?"

**Examples Needing Data:**
- "A triangular playground has three angles. Two angles measure 70° and 60°. What is the third?" (Complete - no issue)
- "A triangle is shown. What is the perimeter?" (Incomplete - missing side lengths)

**Action Required:**
- **40 questions:** Work perfectly without visual
- **30 questions:** Add all shape measurements to question_text

### 4. CHART/GRAPH Questions (10 total)

Mixed results - some have data tables in text, others rely on visual interpretation

**Action Required:** Case-by-case review to determine if data can be presented as table

### 5. NUMBER LINE Questions (24 total)

Most can be answered if positions are clearly stated in text:
- ✅ "A number line from 0 to 10. Point at 1/3 and 5/6. What is the distance?"
- ❌ "Study the number line. What number is marked?" (no positions in text)

### 6. DIAGRAM/OTHER Questions (54 total)

Varies by visual description quality - detailed descriptions make questions answerable

---

## Text Table vs HTML Table - Critical Distinction

### What You Currently Have:

**Text/Markdown Tables in question_text:**
```
| Angler | Trout | Salmon | Bass |
|--------|-------|--------|------|
| Jack   | 12    | 8      | 15   |
| Maya   | 10    | 14     | 11   |
```

**How It's Currently Rendered:**
- Plain text with visible pipe characters (`|`)
- Uses `whitespace-pre-line` CSS property
- NO markdown parsing library installed
- Students see the pipes literally

**How It SHOULD Be Rendered:**
- Proper HTML table with rows and columns
- Styled with borders, headers, hover effects
- Professional table appearance

### HTML Tables in visual_svg:

**What It Is:**
- Full HTML markup stored in `visual_svg` field
- Rendered via `SVGRenderer` component using `dangerouslySetInnerHTML`
- Already displays as proper table

**The Problem:**
- Text tables are MORE ACCURATE than SVG tables
- SVG may have rendering issues or hallucinated data
- Text should be source of truth

---

## Three Generated Reports

### 1. REPORT-questions-needing-visual-support.json

**Contains:** All 107 questions that CANNOT be answered without visual support

**Structure:**
```json
{
  "summary": {
    "totalNeedingAttention": 107,
    "byCategory": {
      "tables": 31,
      "grids": 20,
      "geometry": 30,
      "other": 26
    }
  },
  "questionsNeedingFlag": [
    {
      "id": "...",
      "test_type": "...",
      "visual_type": "...",
      "category": "Table",
      "reason": "Table structure mentioned but data not in text",
      "actionNeeded": "ADD: Complete table data to question text OR keep SVG",
      "question_text": "...",
      "visual_description": "...",
      "answer_options": [...],
      "correct_answer": "..."
    }
  ]
}
```

**Use This To:**
- Identify which questions need editing
- Prioritize fixes by category
- Track what action is needed for each question

### 2. REPORT-table-conversion-plan.json

**Contains:** All 89 table questions ready for markdown→HTML conversion

**Structure:**
```json
{
  "summary": {
    "totalTableQuestions": 89,
    "conversionStrategy": "Convert markdown tables to HTML"
  },
  "questions": [
    {
      "id": "...",
      "test_type": "...",
      "tableInfo": {
        "rows": 4,
        "cols": 4,
        "hasData": true
      },
      "question_text": "...",
      "actionPlan": "Parse markdown table and render as HTML"
    }
  ]
}
```

**Use This To:**
- Implement markdown table rendering
- Verify table data accuracy
- Replace SVG rendering with HTML rendering

### 3. REPORT-complete-visual-audit.json

**Contains:** Complete analysis of all 344 visual questions

**Structure:**
```json
{
  "summary": {
    "totalQuestions": 344,
    "canAnswerWithoutVisual": 237,
    "needsVisualSupport": 107,
    "percentageCanAnswer": "68.9"
  },
  "categoryBreakdown": {...},
  "detailedAnalysis": [...]
}
```

**Use This For:**
- High-level overview
- Progress tracking
- Stakeholder reporting

---

## Two Comprehensive Plans Created

### 1. SVG-TO-HTML-TABLE-CONVERSION-PLAN.md

**7-Phase Implementation Plan:**

1. **Phase 1: Frontend Rendering**
   - Install `react-markdown` + `remark-gfm` + `rehype-raw`
   - Create `MarkdownTableRenderer` component
   - Update `EnhancedTestInterface` to detect and render markdown tables
   - Add beautiful table styling

2. **Phase 2: Database Updates**
   - Add `render_visual_as` field to indicate rendering preference
   - Create data quality validation scripts
   - Update questions to prefer text rendering

3. **Phase 3: Migration Strategy**
   - Feature flags for gradual rollout
   - A/B testing
   - Rollback plan if issues detected

4. **Phase 4: Content Quality**
   - Fix 31 questions without text tables
   - Extract data from SVG/descriptions
   - Add to question_text

5. **Phase 5: Testing & Validation**
   - Automated unit tests
   - Visual regression testing
   - Manual QA checklist

6. **Phase 6: Performance**
   - Lazy loading to minimize bundle size
   - Rendering optimization
   - Memoization

7. **Phase 7: Documentation**
   - Developer guides
   - Content team guidelines

**Timeline:** 5-7 weeks
**Estimated Effort:** 3-4 weeks dev + 1-2 weeks testing + 1 week rollout

### 2. QUESTION-FLAGGING-SYSTEM-PLAN.md

**7-Part Flagging System:**

1. **Part 1: Database Schema**
   - Add flag fields to questions_v2 table
   - Create question_issues_log table for tracking
   - Support resolution workflow

2. **Part 2: Bulk Flagging Script**
   - Automatically flag all 107 questions from audit
   - Categorize by issue type
   - Create issue log entries

3. **Part 3: Admin Interface**
   - Build `FlaggedQuestionsManager` component
   - Filter by status, issue type, test type
   - Review and resolve questions

4. **Part 4: API Endpoints**
   - Bulk status updates
   - Export functionality
   - Edge functions for operations

5. **Part 5: Reporting**
   - Progress tracking
   - Analytics by issue type
   - Resolution rate monitoring

6. **Part 6: Workflow**
   - Step-by-step resolution process
   - Three paths: Add Data, Keep Visual, Remove Question
   - Verification and QA steps

7. **Part 7: Automation**
   - Weekly quality checks
   - Continuous monitoring
   - Automated issue detection

**Timeline:** 6-8 weeks for complete resolution
**Estimated Effort:** 2 weeks setup + 4-6 weeks resolution

---

## Immediate Action Items

### Priority 1: Enable Markdown Table Rendering (Week 1-2)

This will fix 89 questions immediately and improve user experience.

**Steps:**
1. Install dependencies: `npm install react-markdown remark-gfm rehype-raw`
2. Create `MarkdownTableRenderer.tsx` component
3. Update `EnhancedTestInterface.tsx` to use it
4. Add table styling CSS
5. Test with 5-10 sample questions
6. Deploy to production

**Impact:** 89 questions (25.9% of all visual questions) will render properly

### Priority 2: Flag Remaining Questions (Week 2-3)

Systematically identify and flag questions that need attention.

**Steps:**
1. Run database migration to add flag fields
2. Execute bulk flagging script on 107 questions
3. Verify flags are correct
4. Generate reports for content team

**Impact:** Clear visibility into what needs fixing

### Priority 3: Build Admin Interface (Week 3-4)

Enable efficient resolution of flagged questions.

**Steps:**
1. Create FlaggedQuestionsManager component
2. Add to admin panel route
3. Test workflow with 5-10 questions
4. Train content team

**Impact:** Systematic resolution process in place

### Priority 4: Resolve Flagged Questions (Week 4-10)

Work through the 107 flagged questions systematically.

**Steps:**
1. Start with high-priority test types (scholarship/selective)
2. Focus on quick wins (table data additions)
3. 10-15 questions per week target
4. Quality check each fix

**Impact:** Eliminate visual dependency issues

---

## Recommendations

### Recommended Approach: **Hybrid Strategy**

1. **Enable markdown table rendering** (89 questions fixed immediately)
2. **Keep SVG visuals but don't rely on them** (students can answer from text)
3. **Systematically improve 107 flagged questions** over 6-8 weeks
4. **Don't disable visuals completely** - they enhance learning even if not required

### Why Not Disable All Visuals?

1. **You'd lose 107 questions** that are currently unanswerable without visuals
2. **Visuals enhance learning** even when not strictly necessary
3. **Better to fix than remove** - improves content quality long-term
4. **Student experience** - visuals make questions more engaging

### Long-Term Quality Strategy

1. **Validate all new visual questions** before adding to database
2. **Require text-based data** for all table/grid questions
3. **Include all measurements** in geometry questions
4. **Detailed descriptions** in visual_data for all diagram questions
5. **Quality gates** in generation pipeline

---

## Success Metrics

### Short-Term (3 months)
- ✅ Markdown table rendering deployed
- ✅ 90% of flagged questions resolved
- ✅ <5% of questions require visual support
- ✅ Zero student reports of unanswerable questions

### Long-Term (6 months)
- ✅ All new questions are text-complete (can answer without visual)
- ✅ Visuals are enhancement only, not requirement
- ✅ Admin dashboard shows <10 pending flags
- ✅ Automated quality checks prevent new issues

---

## Files Generated

### Analysis Scripts
- ✅ `scripts/analysis/comprehensive-visual-audit.ts`
- ✅ `scripts/viewer/analyze-visual-dependency.ts`
- ✅ `scripts/viewer/check-visual-stats.ts`
- ✅ `scripts/viewer/detailed-question-analysis.ts`

### Reports (JSON)
- ✅ `REPORT-questions-needing-visual-support.json` (107 questions)
- ✅ `REPORT-table-conversion-plan.json` (89 questions)
- ✅ `REPORT-complete-visual-audit.json` (344 questions)
- ✅ `visual-dependency-report.json`
- ✅ `detailed-question-analysis.json`

### Documentation
- ✅ `docs/SVG-TO-HTML-TABLE-CONVERSION-PLAN.md`
- ✅ `docs/QUESTION-FLAGGING-SYSTEM-PLAN.md`
- ✅ `VISUAL-QUESTIONS-AUDIT-SUMMARY.md` (this file)

### Viewer Tool
- ✅ `scripts/viewer/view-visual-questions.ts`
- ✅ Running at: http://localhost:3456

---

## Next Steps

1. **Review this summary** and the detailed plans
2. **Prioritize implementation** - recommend starting with table rendering
3. **Allocate resources** - developer time + content team time
4. **Set timeline** - suggest 8-10 weeks for complete implementation
5. **Begin Phase 1** - markdown table rendering is quick win

---

## Questions to Consider

1. **Do you want to disable SVG visuals for the 237 questions that don't need them?**
   - Recommendation: No, keep as enhancement but ensure text is sufficient

2. **What's your timeline for resolving the 107 flagged questions?**
   - Recommendation: 8-10 weeks with dedicated content team resources

3. **Should we implement the admin interface or handle flagged questions manually?**
   - Recommendation: Build admin interface for efficiency and tracking

4. **Priority order for test types?** (if you want to fix some tests first)
   - Recommendation: Start with scholarship tests (higher stakes)

---

## Conclusion

This comprehensive audit confirms your hypothesis: **the vast majority (68.9%) of visual questions can be answered without the SVG visual** based on the information in the question text or visual descriptions.

The main issues are:
1. **31 table questions** need data added to text
2. **20 grid questions** need pattern data added to text
3. **30 geometry questions** need measurements added to text
4. **26 other questions** need improved descriptions or data

**None of these require disabling visuals completely.** Instead, they require systematic content improvements to make the text self-sufficient while keeping visuals as helpful enhancements.

The two detailed plans provide complete roadmaps for:
1. Converting text tables to beautiful HTML rendering
2. Flagging, tracking, and systematically resolving all visual dependency issues

**Ready to proceed?** Let me know which phase you'd like to start with!
