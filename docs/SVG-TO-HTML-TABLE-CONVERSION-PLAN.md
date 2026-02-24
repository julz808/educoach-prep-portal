# SVG to HTML Table Conversion Plan

## Executive Summary

This document outlines the comprehensive plan to convert SVG table visualizations to HTML table rendering for questions where the text-based table specification is more accurate than the SVG rendered version.

**Key Findings:**
- **89 questions** have complete table data in text format (markdown tables)
- **31 questions** have table type but data NOT in text (need editing first)
- **Text tables are more accurate** than SVG versions and should be the source of truth

---

## Phase 1: Frontend Rendering Enhancement

### 1.1 Add Markdown Table Parser

**Goal:** Enable proper rendering of markdown tables in question text

**Implementation:**

#### Install Dependencies
```bash
npm install react-markdown remark-gfm rehype-raw
```

**Libraries:**
- `react-markdown` - Markdown parser for React
- `remark-gfm` - GitHub Flavored Markdown plugin (adds table support)
- `rehype-raw` - Allows raw HTML in markdown

#### Create Table Renderer Component

**File:** `src/components/question/MarkdownTableRenderer.tsx`

```tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownTableRendererProps {
  content: string;
  className?: string;
}

export const MarkdownTableRenderer: React.FC<MarkdownTableRendererProps> = ({
  content,
  className = ''
}) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ node, ...props }) => (
            <table
              className="min-w-full border-collapse border-2 border-gray-300 my-4"
              {...props}
            />
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="bg-white" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="border-b border-gray-300" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-gray-300 px-4 py-2 text-gray-600"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
```

#### Add Styling

**File:** `src/index.css` or dedicated CSS file

```css
.markdown-content {
  width: 100%;
  overflow-x: auto;
}

.markdown-content table {
  border-collapse: collapse;
  margin: 1rem 0;
  min-width: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.markdown-content thead {
  background: linear-gradient(135deg, #4ECDC4 0%, #3BABA3 100%);
  color: white;
}

.markdown-content th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.markdown-content td {
  padding: 10px 16px;
  border: 1px solid #E5E7EB;
}

.markdown-content tbody tr:nth-child(even) {
  background-color: #F9FAFB;
}

.markdown-content tbody tr:hover {
  background-color: #F3F4F6;
  transition: background-color 0.2s;
}
```

### 1.2 Update Question Display Component

**File:** `src/components/EnhancedTestInterface.tsx`

**Current code (lines ~493-504):**
```tsx
<h2 className="text-lg font-bold leading-relaxed text-edu-navy mb-6 whitespace-pre-line">
  {formatQuestionText(currentQuestion?.text || '')}
</h2>

{currentQuestion?.visualSvg && (
  <div className="mb-6">
    <SVGRenderer
      svgContent={currentQuestion.visualSvg}
      className="max-w-full rounded-lg border border-gray-200 bg-white p-3"
    />
  </div>
)}
```

**New code:**
```tsx
import { MarkdownTableRenderer } from './question/MarkdownTableRenderer';

// Helper function to detect if text contains markdown table
const hasMarkdownTable = (text: string): boolean => {
  const lines = text.split('\n');
  return lines.some(line => line.includes('|')) &&
         lines.filter(line => line.includes('|')).length >= 2;
};

// In render:
{hasMarkdownTable(currentQuestion?.text || '') ? (
  <div className="mb-6">
    <MarkdownTableRenderer content={currentQuestion?.text || ''} />
  </div>
) : (
  <h2 className="text-lg font-bold leading-relaxed text-edu-navy mb-6 whitespace-pre-line">
    {formatQuestionText(currentQuestion?.text || '')}
  </h2>
)}

{/* Only show SVG if question doesn't have text table */}
{!hasMarkdownTable(currentQuestion?.text || '') && currentQuestion?.visualSvg && (
  <div className="mb-6">
    <SVGRenderer
      svgContent={currentQuestion.visualSvg}
      className="max-w-full rounded-lg border border-gray-200 bg-white p-3"
    />
  </div>
)}
```

### 1.3 Update Text Formatting Utility

**File:** `src/utils/textFormatting.ts`

Add a new function to preserve markdown formatting:

```tsx
export function formatQuestionWithMarkdown(text: string): string {
  // Preserve markdown tables but clean up other formatting
  if (text.includes('|') && text.split('\n').filter(l => l.includes('|')).length >= 2) {
    // Return as-is for markdown rendering
    return text.trim();
  }

  // Otherwise use existing formatting
  return formatQuestionText(text);
}
```

---

## Phase 2: Database Updates

### 2.1 Add Flag Field for Visual Rendering Preference

**Migration:** `supabase/migrations/YYYYMMDD_add_visual_rendering_preference.sql`

```sql
-- Add field to indicate rendering preference
ALTER TABLE questions_v2
ADD COLUMN IF NOT EXISTS render_visual_as TEXT DEFAULT NULL;

-- Options: 'html_table', 'svg', 'text_only', NULL (auto-detect)
ALTER TABLE questions_v2
ADD CONSTRAINT render_visual_as_check
CHECK (render_visual_as IS NULL OR render_visual_as IN ('html_table', 'svg', 'text_only'));

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_questions_v2_render_visual
ON questions_v2(render_visual_as)
WHERE render_visual_as IS NOT NULL;

-- Update questions with text tables to prefer text rendering
UPDATE questions_v2
SET render_visual_as = 'html_table'
WHERE has_visual = true
  AND visual_type IN ('table', 'text_table', 'grid')
  AND question_text LIKE '%|%'
  AND (SELECT COUNT(*) FROM regexp_split_to_table(question_text, '\n') WHERE regexp_split_to_table LIKE '%|%') >= 2;

-- Add comment
COMMENT ON COLUMN questions_v2.render_visual_as IS
'Preferred rendering method: html_table (render from text), svg (use visual_svg), text_only (no visual)';
```

### 2.2 Create Data Quality Check Script

**File:** `scripts/data-quality/verify-table-questions.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyTableQuestions() {
  // Get all questions with tables
  const { data: questions } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('has_visual', true)
    .or('visual_type.eq.table,visual_type.eq.text_table');

  console.log(`\nVerifying ${questions?.length} table questions...\n`);

  const issues: any[] = [];

  for (const q of questions || []) {
    // Check if text has table
    const hasTextTable = q.question_text.includes('|');
    const textLines = q.question_text.split('\n');
    const tableRows = textLines.filter((l: string) => l.includes('|')).length;

    // Check if SVG exists
    const hasSVG = !!q.visual_svg;

    if (!hasTextTable && !hasSVG) {
      issues.push({
        id: q.id,
        issue: 'NO_TABLE_DATA',
        message: 'Question has table type but no text table or SVG'
      });
    } else if (!hasTextTable && hasSVG) {
      issues.push({
        id: q.id,
        issue: 'SVG_ONLY',
        message: 'Only has SVG, should add text table to question_text'
      });
    }
  }

  console.log(`Issues found: ${issues.length}\n`);
  issues.forEach(issue => {
    console.log(`[${issue.id}] ${issue.issue}: ${issue.message}`);
  });
}

verifyTableQuestions();
```

---

## Phase 3: Migration Strategy

### 3.1 Gradual Rollout Plan

**Step 1: Add Feature Flag**
```typescript
// src/config/features.ts
export const FEATURES = {
  RENDER_MARKDOWN_TABLES: true, // Enable markdown table rendering
  PREFER_TEXT_OVER_SVG: true,   // Prefer text tables over SVG
  SHOW_SVG_FALLBACK: true       // Show SVG if text parsing fails
};
```

**Step 2: A/B Test Implementation**
- Enable markdown rendering for 10% of users
- Monitor rendering issues and performance
- Collect user feedback on table readability

**Step 3: Full Rollout**
- Enable for 100% of users after successful testing
- Remove SVG rendering for questions with text tables
- Keep SVG as fallback for questions without text tables

### 3.2 Rollback Plan

If issues are detected:
1. Disable feature flag: `RENDER_MARKDOWN_TABLES = false`
2. Revert to SVG rendering for all table questions
3. Fix issues in staging environment
4. Re-enable after fixes

---

## Phase 4: Content Quality Improvements

### 4.1 Fix Questions Without Text Tables (31 questions)

**Process:**

1. **Export list of questions needing text data**
   ```bash
   # Already generated: REPORT-questions-needing-visual-support.json
   # Filter for table type questions
   ```

2. **For each question:**
   - Extract table data from SVG or visual_description
   - Add markdown table to question_text
   - Verify data accuracy
   - Update database

3. **Validation:**
   - All numbers must match between SVG and text
   - Table structure must be clear and readable
   - Headers must be properly labeled

### 4.2 Bulk Update Script

**File:** `scripts/migration/add-text-tables.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addTextTablesToQuestions() {
  // Load questions that need text tables
  const report = JSON.parse(
    fs.readFileSync('REPORT-questions-needing-visual-support.json', 'utf-8')
  );

  const tableQuestions = report.questionsNeedingFlag.filter(
    (q: any) => q.category === 'Table'
  );

  console.log(`\nProcessing ${tableQuestions.length} table questions...\n`);

  for (const q of tableQuestions) {
    // Extract table data from visual_description
    const description = q.visual_description || '';

    // TODO: Parse description and create markdown table
    // This requires manual review or AI assistance to ensure accuracy

    console.log(`Question ${q.id}: Manual review needed`);
  }

  // For now, flag these for manual review
  const questionIds = tableQuestions.map((q: any) => q.id);

  await supabase
    .from('questions_v2')
    .update({
      render_visual_as: 'svg', // Keep using SVG until text is added
      // Add a note field or comment
    })
    .in('id', questionIds);

  console.log('\n✅ Questions flagged for manual review');
}

addTextTablesToQuestions();
```

---

## Phase 5: Testing & Validation

### 5.1 Automated Tests

**File:** `src/components/question/__tests__/MarkdownTableRenderer.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { MarkdownTableRenderer } from '../MarkdownTableRenderer';

describe('MarkdownTableRenderer', () => {
  it('renders simple table correctly', () => {
    const markdown = `
| Name | Age |
|------|-----|
| John | 25  |
| Jane | 23  |
    `;

    render(<MarkdownTableRenderer content={markdown} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('handles complex tables with multiple columns', () => {
    const markdown = `
| Angler | Trout | Salmon | Bass |
|--------|-------|--------|------|
| Jack   | 12    | 8      | 15   |
| Maya   | 10    | 14     | 11   |
| Ryan   | 16    | 9      | 13   |
    `;

    render(<MarkdownTableRenderer content={markdown} />);

    // Check headers
    expect(screen.getByText('Angler')).toBeInTheDocument();
    expect(screen.getByText('Trout')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('Jack')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('preserves numerical data accuracy', () => {
    const markdown = `
| Item | Quantity |
|------|----------|
| A    | 145      |
| B    | 98       |
| C    | 112      |
    `;

    render(<MarkdownTableRenderer content={markdown} />);

    expect(screen.getByText('145')).toBeInTheDocument();
    expect(screen.getByText('98')).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();
  });
});
```

### 5.2 Manual Testing Checklist

- [ ] Table renders correctly on desktop (1920x1080)
- [ ] Table renders correctly on tablet (768x1024)
- [ ] Table renders correctly on mobile (375x667)
- [ ] Table scrolls horizontally if too wide
- [ ] Numbers align properly in cells
- [ ] Headers are visually distinct
- [ ] Table borders are consistent
- [ ] Hover states work on rows
- [ ] Print view displays table correctly
- [ ] Screen readers can navigate table

### 5.3 Visual Regression Testing

Use Percy or similar tool to capture screenshots:
- Before: SVG table rendering
- After: HTML table rendering
- Compare side-by-side for 10 sample questions

---

## Phase 6: Performance Optimization

### 6.1 Bundle Size Impact

**Before:**
- No markdown parser: 0 KB

**After:**
- react-markdown: ~50 KB
- remark-gfm: ~10 KB
- rehype-raw: ~5 KB
- **Total added: ~65 KB gzipped**

**Mitigation:**
- Lazy load markdown renderer only when needed
- Code split by route if only used in test interface

```tsx
// Lazy load the markdown renderer
const MarkdownTableRenderer = React.lazy(
  () => import('./question/MarkdownTableRenderer')
);

// Use with Suspense
{hasMarkdownTable(question.text) && (
  <Suspense fallback={<div>Loading table...</div>}>
    <MarkdownTableRenderer content={question.text} />
  </Suspense>
)}
```

### 6.2 Rendering Performance

**Optimization strategies:**
- Memoize markdown rendering with `React.memo`
- Cache parsed markdown content
- Use virtual scrolling for very large tables (if needed)

```tsx
export const MarkdownTableRenderer = React.memo<MarkdownTableRendererProps>(
  ({ content, className }) => {
    const renderedContent = React.useMemo(
      () => {
        // Parse and render markdown
        return content;
      },
      [content]
    );

    return (
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown {...props}>
          {renderedContent}
        </ReactMarkdown>
      </div>
    );
  }
);
```

---

## Phase 7: Documentation & Training

### 7.1 Developer Documentation

**File:** `docs/MARKDOWN-TABLE-RENDERING.md`

Topics:
- How to add markdown tables to questions
- Markdown table syntax reference
- Testing checklist for new table questions
- Troubleshooting common issues

### 7.2 Content Team Guidelines

**File:** `docs/CONTENT-TEAM-TABLE-GUIDELINES.md`

Topics:
- When to use text tables vs SVG
- Markdown table formatting standards
- Data accuracy requirements
- Quality assurance checklist

---

## Success Metrics

### Key Performance Indicators

1. **Rendering Accuracy**
   - Target: 100% of text tables render correctly
   - Measure: Visual regression tests pass rate

2. **Data Accuracy**
   - Target: 100% data match between text and display
   - Measure: Automated data validation pass rate

3. **Performance**
   - Target: No degradation in page load time
   - Measure: Lighthouse performance score ≥ 90

4. **User Experience**
   - Target: Improved readability over SVG
   - Measure: User feedback surveys

5. **Maintenance**
   - Target: Easier to update table data
   - Measure: Time to update question reduced by 50%

---

## Timeline

### Week 1-2: Foundation
- [ ] Install dependencies
- [ ] Create MarkdownTableRenderer component
- [ ] Add styling
- [ ] Write unit tests

### Week 3: Integration
- [ ] Update EnhancedTestInterface
- [ ] Add feature flags
- [ ] Test on staging environment

### Week 4: Migration
- [ ] Add database field
- [ ] Run migration script
- [ ] Update 89 questions with text tables

### Week 5: Quality Assurance
- [ ] Manual review of 31 questions needing text data
- [ ] Add missing table data to question_text
- [ ] Visual regression testing

### Week 6: Rollout
- [ ] Deploy to 10% of users
- [ ] Monitor for issues
- [ ] Full rollout if successful

---

## Risk Mitigation

### Risk 1: Rendering Issues
**Mitigation:**
- Keep SVG as fallback
- Feature flag for quick disable
- Extensive testing before rollout

### Risk 2: Data Inaccuracy
**Mitigation:**
- Automated validation scripts
- Manual review of all conversions
- A/B testing to compare with SVG

### Risk 3: Performance Impact
**Mitigation:**
- Lazy loading
- Code splitting
- Performance monitoring

### Risk 4: User Confusion
**Mitigation:**
- Gradual rollout
- User feedback collection
- Documentation and support

---

## Conclusion

This plan provides a comprehensive approach to converting SVG tables to HTML rendering, leveraging the more accurate text-based table specifications in question_text. The phased approach allows for careful testing and validation at each step, minimizing risk while improving question quality and maintainability.

**Next Steps:**
1. Review and approve plan
2. Prioritize phases
3. Assign resources
4. Begin implementation

**Estimated Effort:**
- Development: 3-4 weeks
- Testing: 1-2 weeks
- Rollout: 1 week
- **Total: 5-7 weeks**
