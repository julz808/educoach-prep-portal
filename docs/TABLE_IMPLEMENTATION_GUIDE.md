# Table Implementation Guide for Question Systems

## Overview

This guide explains how to implement automatic markdown table detection and conversion to styled HTML tables in a question/test-taking application.

## Architecture Summary

**Storage Format**: Markdown tables stored as plain text
**Processing**: Runtime conversion from markdown → HTML
**Rendering**: HTML tables with CSS styling via `dangerouslySetInnerHTML`

---

## Implementation Steps

### 1. Create Table Formatter Utility (`src/utils/tableFormatter.ts`)

```typescript
/**
 * Utility functions for detecting and converting markdown-style tables to HTML
 */

/**
 * Detects if text contains a markdown-style table
 * Looks for patterns like:
 * | Header | Header |
 * |--------|--------|
 * | Data   | Data   |
 */
export function containsMarkdownTable(text: string): boolean {
  if (!text) return false;

  // Check for pipe characters and table separator pattern
  const hasPipes = text.includes('|');
  const hasSeparator = /\|[\s-]+\|/.test(text) || text.includes('---|');

  return hasPipes && hasSeparator;
}

/**
 * Converts markdown-style table to HTML table
 */
export function convertMarkdownTableToHtml(text: string): string {
  if (!containsMarkdownTable(text)) {
    return text;
  }

  // Split text into lines
  const lines = text.split('\n');
  let tableLines: string[] = [];
  let beforeTable = '';
  let afterTable = '';
  let inTable = false;
  let tableStartIndex = -1;

  // Find the table section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('|') && !inTable) {
      // Start of table
      inTable = true;
      tableStartIndex = i;
      tableLines.push(line);
    } else if (inTable && line.includes('|')) {
      // Continue table
      tableLines.push(line);
    } else if (inTable && !line.includes('|')) {
      // End of table
      inTable = false;
      // Store text after table
      afterTable = lines.slice(i).join('\n');
      break;
    } else if (!inTable && tableStartIndex === -1) {
      // Before table
      beforeTable += line + '\n';
    }
  }

  if (tableLines.length === 0) {
    return text;
  }

  // Parse the table
  const rows = tableLines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove leading and trailing pipes
      line = line.replace(/^\|/, '').replace(/\|$/, '');
      // Split by pipe
      return line.split('|').map(cell => cell.trim());
    });

  if (rows.length === 0) {
    return text;
  }

  // Identify header separator row (contains --- pattern)
  let headerSeparatorIndex = rows.findIndex(row =>
    row.some(cell => /^[-\s]+$/.test(cell))
  );

  let headerRows: string[][] = [];
  let bodyRows: string[][] = [];

  if (headerSeparatorIndex >= 0) {
    // Has explicit header separator
    headerRows = rows.slice(0, headerSeparatorIndex);
    bodyRows = rows.slice(headerSeparatorIndex + 1);
  } else {
    // No separator, assume first row is header
    headerRows = [rows[0]];
    bodyRows = rows.slice(1);
  }

  // Build HTML table
  let html = '<table class="question-table">\n';

  // Add header
  if (headerRows.length > 0) {
    html += '  <thead>\n';
    headerRows.forEach(row => {
      html += '    <tr>\n';
      row.forEach(cell => {
        html += `      <th>${cell}</th>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </thead>\n';
  }

  // Add body
  if (bodyRows.length > 0) {
    html += '  <tbody>\n';
    bodyRows.forEach(row => {
      html += '    <tr>\n';
      row.forEach(cell => {
        html += `      <td>${cell}</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n';
  }

  html += '</table>';

  // Combine before table + HTML table + after table
  return beforeTable.trim() + '\n\n' + html + '\n\n' + afterTable.trim();
}
```

---

### 2. Integrate with Text Formatting (`src/utils/textFormatting.ts`)

Add table conversion to your existing text formatting function:

```typescript
import { convertMarkdownTableToHtml, containsMarkdownTable } from './tableFormatter';

/**
 * Formats question text by handling spacing, punctuation, structure, and tables
 */
export function formatQuestionText(text: string): string {
  if (!text) return '';

  // Check if text contains a markdown table and convert it to HTML
  if (containsMarkdownTable(text)) {
    return convertMarkdownTableToHtml(text);
  }

  // ... rest of your text formatting logic
  let formatted = text
    .replace(/[ \t]+/g, ' ')
    .trim();

  return formatted;
}
```

---

### 3. Update Component to Render HTML

In your question display component (e.g., `TestInterface.tsx` or `QuestionDisplay.tsx`):

```typescript
import { formatQuestionText } from '@/utils/textFormatting';

// Inside your component JSX:
<div
  className="text-lg font-bold leading-relaxed text-edu-navy mb-6 whitespace-pre-line"
  dangerouslySetInnerHTML={{ __html: formatQuestionText(currentQuestion?.text || '') }}
/>
```

**Important**: Using `dangerouslySetInnerHTML` is safe here because:
- Content comes from your database (trusted source)
- You control what goes into the database
- Tables are generated by your system, not user input

---

### 4. Add CSS Styling

Add these styles to your main CSS file (e.g., `index.css` or `globals.css`):

```css
/* Table formatting for questions */
.question-table {
  @apply w-full border-collapse my-4;
  border: 2px solid #2C3E50;
}

.question-table th {
  @apply bg-edu-navy text-white font-semibold px-4 py-3 text-left;
  border: 1px solid #34495E;
}

.question-table td {
  @apply px-4 py-3 border;
  border-color: #2C3E50;
}

.question-table tbody tr:nth-child(even) {
  @apply bg-gray-50;
}

.question-table tbody tr:hover {
  @apply bg-edu-light-blue/30 transition-colors;
}
```

**Customize the colors** to match your design system:
- Replace `#2C3E50` with your border color
- Replace `bg-edu-navy` with your header background color
- Replace `bg-edu-light-blue/30` with your hover color

---

### 5. Store Tables in Database

When creating questions, store tables in markdown format in your `question_text` field:

```typescript
const questionWithTable = {
  question_text: `A school orchestra recorded the number of instruments played by students in different sections:

| Section | Number of Instruments |
|---|---|
| Strings | 45 |
| Woodwind | 28 |
| Brass | 32 |
| Percussion | 15 |

How many instruments are there in total?`,
  // ... other fields
};
```

---

## Example Usage

### Input (Markdown in database):
```
A florist recorded sales:

| Day | Bouquets Sold |
|---|---|
| Monday | 28 |
| Tuesday | 35 |
| Wednesday | 42 |

How many days had sales of more than 40 bouquets?
```

### Output (Rendered HTML):
```html
A florist recorded sales:

<table class="question-table">
  <thead>
    <tr>
      <th>Day</th>
      <th>Bouquets Sold</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Monday</td>
      <td>28</td>
    </tr>
    <tr>
      <td>Tuesday</td>
      <td>35</td>
    </tr>
    <tr>
      <td>Wednesday</td>
      <td>42</td>
    </tr>
  </tbody>
</table>

How many days had sales of more than 40 bouquets?
```

---

## Testing

### Create a test script (`scripts/test-table-formatting.ts`):

```typescript
import { convertMarkdownTableToHtml } from '../src/utils/tableFormatter';

const testQuestion = `A school orchestra recorded instruments:

| Section | Number of Instruments |
|---|---|
| Strings | 45 |
| Woodwind | 28 |
| Brass | 32 |

What is the total?`;

console.log('Input:');
console.log(testQuestion);
console.log('\nOutput:');
console.log(convertMarkdownTableToHtml(testQuestion));
```

### Find existing tables in database:

```typescript
// Query to find questions with tables
const { data } = await supabase
  .from('questions')
  .select('id, question_text, test_type')
  .like('question_text', '%|%')
  .like('question_text', '%---|%');
```

---

## Key Benefits

1. **Simple to write**: Authors can write tables in plain markdown
2. **No image dependencies**: Tables are text-based, searchable, and accessible
3. **Consistent styling**: All tables automatically styled the same way
4. **Flexible**: Works with questions of any length before/after the table
5. **Performant**: Conversion happens client-side only when needed

---

## Alternative: Visual SVG Field

You can also store pre-rendered HTML tables in a separate `visual_svg` field if you prefer:

```typescript
const questionWithVisual = {
  question_text: "Based on the table below, calculate the total:",
  visual_svg: `<table class="question-table">
    <thead><tr><th>Item</th><th>Value</th></tr></thead>
    <tbody><tr><td>A</td><td>10</td></tr></tbody>
  </table>`
};
```

Then render it separately:
```tsx
{currentQuestion?.visualSvg && (
  <div dangerouslySetInnerHTML={{ __html: currentQuestion.visualSvg }} />
)}
```

---

## Summary

This implementation gives you:
- ✅ Automatic markdown → HTML table conversion
- ✅ Professional, consistent styling
- ✅ Simple authoring experience (just write markdown)
- ✅ No external dependencies
- ✅ Works seamlessly with existing text formatting

The tables are stored as text, converted at runtime, and rendered as styled HTML tables with proper semantic markup and accessibility features.
