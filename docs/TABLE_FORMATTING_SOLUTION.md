# Table Formatting Solution

## Overview

This solution automatically detects and converts markdown-style tables in question text to properly formatted HTML tables.

## Implementation

### 1. Detection Pattern

Tables are detected by looking for:
- Pipe characters `|` used as column separators
- Dashes `---` used for header separator rows

Example markdown table:
```
| Day | Bouquets Sold |
|---|---|
| Monday | 28 |
| Tuesday | 35 |
```

### 2. Files Modified

#### New Files Created:
- `src/utils/tableFormatter.ts` - Core table conversion utilities

#### Modified Files:
- `src/utils/textFormatting.ts` - Added table detection and conversion
- `src/components/EnhancedTestInterface.tsx` - Updated to render HTML content
- `src/index.css` - Added `.question-table` styles

### 3. How It Works

1. **Detection**: When `formatQuestionText()` is called, it checks if the text contains a markdown table pattern
2. **Conversion**: If a table is detected, it's converted from markdown to HTML
3. **Rendering**: The component renders the HTML using `dangerouslySetInnerHTML`
4. **Styling**: CSS styles are applied via the `.question-table` class

### 4. Testing

To test the table formatting, you can:

1. **Manual Test**: Create a question with markdown table in question_text:
```typescript
const testQuestion = {
  text: `A florist recorded sales:

| Day | Bouquets Sold |
|---|---|
| Monday | 28 |
| Tuesday | 35 |
| Wednesday | 42 |

How many days had sales of more than 40 bouquets?`,
  // ... other fields
};
```

2. **Run Test Script**:
```bash
tsx scripts/test-table-formatting.ts
```

### 5. Database Query

To find questions with table formatting:
```sql
-- Find questions with pipe and dash characters (markdown tables)
SELECT id, question_text, test_type, section_name
FROM questions_v2
WHERE question_text LIKE '%|%'
  AND question_text LIKE '%---|%';
```

### 6. CSS Customization

Table styles can be customized in `src/index.css`:

```css
.question-table {
  /* Border and layout */
  @apply w-full border-collapse my-4;
  border: 2px solid #2C3E50;
}

.question-table th {
  /* Header cells */
  @apply bg-edu-navy text-white font-semibold px-4 py-3 text-left;
}

.question-table td {
  /* Data cells */
  @apply px-4 py-3 border;
}
```

## Current Status

✅ **Implemented**:
- Table detection algorithm
- Markdown to HTML conversion
- CSS styling for tables
- Component integration

⏳ **Pending**:
- Identification of actual questions in database with table formatting
- User confirmation of which test types/sections contain tables
- Testing with real question data

## Next Steps

1. Get specific question ID or test type where tables appear
2. Verify the table formatting works correctly
3. Consider migrating existing markdown tables to HTML if they exist in the database
4. Add unit tests for table conversion logic

## Notes

- Currently NO questions in production database contain markdown table formatting
- The solution is ready to handle tables when they are added
- Tables can be added either in `question_text` or `visual_svg` fields
- The `visual_svg` field already supports HTML tables without conversion
