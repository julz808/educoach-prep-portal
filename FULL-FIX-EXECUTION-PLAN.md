# Full Fix Execution Plan - ALL 344 Visual Questions

**Objective:** Fix ALL visual questions so they can be answered from text alone, with visuals as enhancement only.

**Timeline:** 2-3 weeks intensive work
**Approach:** Systematic, automated where possible, with quality checks

---

## Strategy Overview

### The Fix Categories

| Category | Count | Fix Type | Approach |
|----------|-------|----------|----------|
| **Table Questions** | 89 | Convert to HTML | Automated + Frontend |
| **Table Questions (Missing Data)** | 31 | Add data to text | Semi-automated extraction |
| **Grid Questions** | 46 | Verify/format | Automated validation |
| **Grid Questions (Missing)** | 20 | Add grid data | Automated from description |
| **Geometry (Complete)** | 40 | Verify only | Automated check |
| **Geometry (Missing)** | 30 | Add measurements | Semi-automated |
| **Other (Good)** | 62 | Verify only | Quick review |
| **Other (Needs Fix)** | 26 | Improve descriptions | Manual review |
| **TOTAL** | **344** | - | - |

---

## Phase 1: Frontend - Enable Markdown Table Rendering

**Timeline:** Days 1-2
**Impact:** Fixes 89 questions immediately

### Step 1.1: Install Dependencies

```bash
npm install react-markdown remark-gfm rehype-raw
```

### Step 1.2: Create MarkdownTableRenderer Component

**File:** `src/components/question/MarkdownTableRenderer.tsx`

This component will:
- Parse markdown tables from question text
- Render as beautiful HTML tables
- Style with proper borders, headers, hover effects
- Handle responsive design

### Step 1.3: Update EnhancedTestInterface

**File:** `src/components/EnhancedTestInterface.tsx`

Logic:
- Detect if question text contains markdown table
- If yes: Use MarkdownTableRenderer
- If no: Use existing text formatter
- Don't show SVG if markdown table exists

### Step 1.4: Add Styling

Professional table styling matching your brand (teal/coral colors).

---

## Phase 2: Backend - Database Updates & Scripts

**Timeline:** Days 2-3
**Impact:** Infrastructure for all fixes

### Step 2.1: Database Migration

Add fields to track fixes:
- `text_complete` - boolean (can answer from text alone)
- `fix_applied` - boolean (fix has been applied)
- `fix_type` - enum (table_conversion, data_added, description_improved, etc.)
- `fix_notes` - text (what was changed)
- `render_visual_as` - enum (html_table, svg, text_only, auto)

### Step 2.2: Create Fix Scripts

Multiple scripts for different fix types:
- Extract table data from SVG/description
- Extract grid data from description
- Validate geometry measurements
- Format text properly

---

## Phase 3: Automated Fixes - Tables with Data

**Timeline:** Days 3-4
**Impact:** 89 questions

### What We're Doing

These questions already have complete table data in markdown format. We just need to:
1. Verify data accuracy
2. Mark as `render_visual_as = 'html_table'`
3. Set `text_complete = true`
4. Add fix notes

### Script

```typescript
// Verify and mark table questions as fixed
for each question with markdown table:
  - Parse table from text
  - Verify has 2+ rows with data
  - Compare with SVG if exists (log discrepancies)
  - Update: render_visual_as = 'html_table'
  - Update: text_complete = true
  - Update: fix_applied = true, fix_type = 'table_html_conversion'
```

**Output:** 89 questions ready for HTML rendering

---

## Phase 4: Semi-Automated Fixes - Tables Missing Data

**Timeline:** Days 4-6
**Impact:** 31 questions

### What We're Doing

Extract table data from visual_description or SVG and add to question_text.

### Process

1. **Automated Extraction:**
   - Parse visual_description for table data
   - If description has structured data → convert to markdown table
   - If SVG exists → extract table data from HTML

2. **Manual Review Queue:**
   - Export questions where extraction failed
   - 10-15 questions for manual data entry

3. **Update Database:**
   - Add markdown table to question_text
   - Mark as fixed

### Script Logic

```typescript
for each table question without text data:
  // Try extracting from description
  if (visual_description contains structured data):
    table = parseDescriptionToTable(visual_description)
    question_text = question_text + "\n\n" + table

  // Try extracting from SVG
  else if (visual_svg contains <table>):
    table = extractTableFromSVG(visual_svg)
    markdown = convertHTMLTableToMarkdown(table)
    question_text = question_text + "\n\n" + markdown

  // Flag for manual review
  else:
    addToManualReviewQueue(question)
```

---

## Phase 5: Automated Fixes - Grid Questions

**Timeline:** Days 6-8
**Impact:** 66 questions (46 good + 20 need fix)

### What We're Doing

Ensure all grid/pattern questions have complete grid data in text.

### For 46 Questions with Data:

1. Verify grid data is clear and complete
2. Format if needed (e.g., "Row 1: 2, 4, 6" format)
3. Mark as `text_complete = true`

### For 20 Questions Missing Data:

1. Extract grid data from visual_description
2. Format as: "Row 1: [values], Row 2: [values], Row 3: [values]"
3. Add to question_text or description
4. Mark as fixed

### Script Logic

```typescript
for each grid question:
  if (hasGridDataInText(question)):
    // Just verify and format
    formatted = formatGridData(question_text)
    if (formatted !== question_text):
      question_text = formatted
      fix_notes = "Grid data formatted"
    text_complete = true

  else if (hasGridDataInDescription(visual_description)):
    // Extract and add to text
    gridData = extractGridFromDescription(visual_description)
    gridText = formatGridAsText(gridData)
    question_text = question_text + "\n\n" + gridText
    text_complete = true
    fix_applied = true

  else:
    // Manual review needed
    addToManualReviewQueue(question)
```

---

## Phase 6: Semi-Automated Fixes - Geometry Questions

**Timeline:** Days 8-10
**Impact:** 70 questions (40 good + 30 need fix)

### What We're Doing

Ensure all geometry questions have complete measurements in text.

### For 40 Questions with Complete Measurements:

1. Verify measurements are in text
2. Mark as `text_complete = true`
3. No changes needed

### For 30 Questions Missing Measurements:

1. Extract measurements from visual_description
2. Add to question_text in natural language
3. Verify question is answerable

### Script Logic

```typescript
for each geometry question:
  measurements = extractMeasurements(question_text)
  required = getRequiredMeasurements(visual_type)

  if (measurements.length >= required):
    // Already complete
    text_complete = true

  else:
    // Try to extract from description
    missing = extractMeasurementsFromDescription(visual_description)

    if (missing.length > 0):
      // Add to question text
      addMeasurementsToText(question, missing)
      text_complete = true
      fix_applied = true

    else:
      // Manual review
      addToManualReviewQueue(question)
```

### Example Fix

**Before:**
```
A triangular sail on a yacht. What is the area of the sail?
```

**After:**
```
A triangular sail on a yacht has a base of 6 metres and a height of 8 metres. What is the area of the sail?
```

---

## Phase 7: Manual Review - Other Visual Types

**Timeline:** Days 10-12
**Impact:** 88 questions (62 good + 26 need fix)

### For 62 Questions That Are Good:

1. Quick verification
2. Mark as `text_complete = true`
3. Done

### For 26 Questions Needing Improvement:

Manual review required. Categories:
- Chart/graph questions (add data if possible)
- Vague descriptions (improve or keep visual)
- Complex diagrams (enhance description)

### Process

1. Export to spreadsheet/CSV
2. Review each question
3. Either:
   - Improve description
   - Add data to text
   - Mark as "keep_visual" (if visual is necessary)

---

## Phase 8: Database Updates

**Timeline:** Days 12-13
**Impact:** All 344 questions

### Bulk Update Script

```typescript
// Update all fixed questions in database
for each fixed question:
  await supabase
    .from('questions_v2')
    .update({
      question_text: updatedText,
      text_complete: true,
      fix_applied: true,
      fix_type: fixType,
      fix_notes: notes,
      render_visual_as: renderPreference,
      updated_at: new Date().toISOString()
    })
    .eq('id', questionId)
```

### Verification

- Count questions marked as `text_complete = true`
- Should be 344/344
- Generate report of any failures

---

## Phase 9: Quality Assurance

**Timeline:** Days 13-15
**Impact:** Verify all fixes

### Automated Tests

1. **Data Accuracy Test:**
   - For table questions: Verify all numbers match original
   - For grid questions: Verify pattern data is complete
   - For geometry: Verify all measurements present

2. **Rendering Test:**
   - Load each question in test interface
   - Verify text displays correctly
   - Verify markdown tables render as HTML
   - Verify no SVG shows for table questions

3. **Answerability Test:**
   - Can question be answered from text alone?
   - Is all necessary information present?

### Manual Sampling

- Review 20 random questions from each category
- Verify quality of fixes
- Check for any issues

---

## Phase 10: Deployment & Monitoring

**Timeline:** Days 15-16
**Impact:** Push to production

### Deployment Steps

1. Deploy frontend changes (MarkdownTableRenderer)
2. Run database migration
3. Execute bulk update scripts
4. Monitor for issues

### Post-Deployment Monitoring

- Track rendering errors
- Monitor student feedback
- Check for any unanswerable questions
- Quick fix any issues found

---

## Execution Scripts

### Master Script - Fix All Questions

**File:** `scripts/fix-all-visual-questions/master-fix.ts`

```typescript
import { fixTableQuestions } from './fix-tables';
import { fixGridQuestions } from './fix-grids';
import { fixGeometryQuestions } from './fix-geometry';
import { verifyOtherQuestions } from './verify-other';

async function masterFix() {
  console.log('🚀 Starting Full Visual Questions Fix\n');

  // Phase 1: Tables with data (automated)
  console.log('📊 Phase 1: Fixing table questions...');
  const tableResults = await fixTableQuestions();
  console.log(`✅ Fixed ${tableResults.fixed} table questions\n`);

  // Phase 2: Grids (automated)
  console.log('🎯 Phase 2: Fixing grid questions...');
  const gridResults = await fixGridQuestions();
  console.log(`✅ Fixed ${gridResults.fixed} grid questions\n`);

  // Phase 3: Geometry (semi-automated)
  console.log('📐 Phase 3: Fixing geometry questions...');
  const geometryResults = await fixGeometryQuestions();
  console.log(`✅ Fixed ${geometryResults.fixed} geometry questions\n`);

  // Phase 4: Other (verification)
  console.log('🔍 Phase 4: Verifying other questions...');
  const otherResults = await verifyOtherQuestions();
  console.log(`✅ Verified ${otherResults.verified} other questions\n`);

  // Summary
  const totalFixed =
    tableResults.fixed +
    gridResults.fixed +
    geometryResults.fixed;
  const totalVerified = otherResults.verified;
  const needsManualReview =
    tableResults.manualReview +
    gridResults.manualReview +
    geometryResults.manualReview +
    otherResults.manualReview;

  console.log('\n📊 FINAL SUMMARY\n');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Questions Fixed: ${totalFixed}`);
  console.log(`✅ Questions Verified: ${totalVerified}`);
  console.log(`⚠️  Manual Review Needed: ${needsManualReview}`);
  console.log(`📈 Total Processed: ${totalFixed + totalVerified}`);
  console.log(`🎯 Target: 344`);
  console.log('═══════════════════════════════════════\n');

  // Generate reports
  await generateFixReports({
    tableResults,
    gridResults,
    geometryResults,
    otherResults
  });

  console.log('✅ Fix process complete!');
  console.log('📄 Reports saved to: fix-results/\n');
}

masterFix().catch(console.error);
```

---

## Success Criteria

### Must Have (100% Required)

- [ ] All 344 questions can be answered from text alone
- [ ] Markdown tables render as HTML (89 questions)
- [ ] No data loss or inaccuracies
- [ ] Database updated with all fixes
- [ ] Quality assurance tests pass

### Should Have (Target 95%+)

- [ ] Automated fixes for 90%+ of questions
- [ ] Manual review only for complex cases
- [ ] Clear fix notes for all changes
- [ ] Rollback plan if issues found

### Nice to Have

- [ ] Improved visual descriptions even when not required
- [ ] Consistent formatting across all questions
- [ ] Documentation of fix patterns for future questions

---

## Risk Mitigation

### Risk 1: Data Accuracy
**Mitigation:**
- Automated comparison with original SVG
- Manual spot checks
- Keep SVG as backup initially

### Risk 2: Breaking Questions
**Mitigation:**
- Test each fix before committing
- Backup database before bulk updates
- Gradual rollout (tables first, then others)

### Risk 3: Time Overrun
**Mitigation:**
- Automate as much as possible
- Parallelize work where feasible
- Start with high-priority test types

---

## Timeline Summary

| Phase | Days | Description |
|-------|------|-------------|
| 1 | 1-2 | Frontend - Markdown rendering |
| 2 | 2-3 | Backend - Database & scripts |
| 3 | 3-4 | Fix tables with data (89) |
| 4 | 4-6 | Fix tables missing data (31) |
| 5 | 6-8 | Fix grids (66) |
| 6 | 8-10 | Fix geometry (70) |
| 7 | 10-12 | Manual review other (88) |
| 8 | 12-13 | Database bulk updates |
| 9 | 13-15 | Quality assurance |
| 10 | 15-16 | Deployment & monitoring |

**Total: 16 days (2-3 weeks intensive work)**

---

## Next Steps

1. **Review & Approve** this plan
2. **Start Phase 1** - Frontend implementation
3. **Parallel work** - Start building fix scripts while frontend is in progress
4. **Daily check-ins** - Track progress against timeline
5. **Adjust as needed** - Pivot if automation rates are different than expected

---

## Let's Begin! 🚀

Ready to start implementation?

**First Task:** Install dependencies and create MarkdownTableRenderer component.

Shall I begin?
