# Number Grid & Series Rendering Implementation

## Overview

Implemented automatic table rendering for multiple test types:

**VIC Selective Entry - General Ability - Quantitative:**
1. **3x3 Grid Tables** - "Number Grids & Matrices" subskill
2. **1-Row Series Tables** - "Number Series & Sequences" subskill

**EduTest Scholarship - Numerical Reasoning:**
3. **Grid Pattern Tables** - "Number Matrices & Grid Patterns" subskill (markdown tables rendered as grids without headers)

## Problem

### Number Grids & Matrices
Questions in the "Number Grids & Matrices" subskill contain 9 numbers that should be displayed in a 3x3 grid/table format, but were being rendered as plain text in a single line:

```
5 10 15 6 12 18 7 14 ?
```

This made the questions difficult to understand as they reference "the square marked by the question mark" and "the grid".

### Number Series & Sequences
Questions in the "Number Series & Sequences" subskill contain a sequence of numbers (typically 5-10) where one is replaced by "?", but were displayed as plain text:

```
2 3 5 9 17 ? 65
```

These would be more visually clear if displayed as a horizontal sequence of boxes.

### EduTest Grid Pattern Questions
Questions in the "Number Matrices & Grid Patterns" subskill use markdown table syntax but should be rendered as **grids without headers** (like VIC selective grids), not as traditional data tables:

```
| 4  | 7  | 28  |
| 5  | 9  | 45  |
| 6  | ?  | 66  |
```

These questions include text like "Study the pattern in the grid" which indicates they should be rendered as visual grids, not tables with column headers.

## Solution

Created an automatic detection and rendering system that transforms number sequences into proper HTML tables.

### Files Created/Modified

1. **`src/utils/gridFormatter.ts`** (NEW)

   **For 3x3 Grids:**
   - `containsNumberGrid()` - Detects if question text contains a 3x3 grid pattern
   - `extractGridData()` - Extracts the 9 numbers from the question text
   - `formatQuestionWithGrid()` - Splits question into before/grid/after parts
   - `renderGridAsTable()` - Generates HTML table markup for the 3x3 grid

   **For Number Series:**
   - `containsNumberSeries()` - Detects if question text contains a number series pattern
   - `extractSeriesData()` - Extracts the sequence of numbers from the question text
   - `formatQuestionWithSeries()` - Splits question into before/series/after parts
   - `renderSeriesAsTable()` - Generates HTML table markup for the 1-row series

2. **`src/utils/tableFormatter.ts`** (MODIFIED)
   - Added `isGridPatternQuestion()` - Detects questions with "study the pattern in the grid" keywords
   - Updated `convertMarkdownTableToHtml()` - Renders grid pattern questions as grids without headers
   - Regular markdown tables still render with headers as before

3. **`src/utils/textFormatting.ts`** (MODIFIED)
   - Added import of grid and series formatting functions
   - Updated `formatQuestionText()` to detect and format both series and grids before other processing
   - Series detection runs first (more specific), then grid detection (more general)
   - Markdown table detection runs first (for EduTest grids)

4. **`src/index.css`** (MODIFIED)
   - Added `.number-grid-table` styles for 3x3 grids
   - Added `.grid-cell` and `.grid-cell-question` styles
   - Added `.number-series-table` styles for 1-row series
   - Added `.series-cell` and `.series-cell-question` styles
   - Responsive sizing for mobile devices on both formats

### How It Works

#### EduTest Grid Pattern Detection & Rendering

1. **Detection**: Checks if the text contains:
   - Markdown table syntax (pipes `|`)
   - Keywords: "study the pattern in the grid", "pattern in the grid", or "grid pattern"

2. **Rendering**:
   - Uses `number-grid-table` class (same as VIC selective grids)
   - No headers - all rows are rendered as body cells
   - Question mark cells get special highlighting
   - All rows treated equally (no header/body distinction)

3. **Distinction from Regular Tables**:
   - Regular tables without grid keywords → Rendered with headers
   - Grid pattern questions → Rendered as visual grids without headers

#### Number Series Detection & Rendering

1. **Detection**: Checks if the text contains:
   - Series-related keywords ("series", "sequence", "pattern", "missing number", "following:")
   - A sequence of 4+ numbers with exactly one "?"

2. **Extraction**: Extracts all numbers and the "?" from the series line

3. **Formatting**:
   - Splits text into: text before series, series data, text after series
   - Generates HTML table with one row containing all values

4. **Rendering**:
   - Each number in its own cell (70x70px, 50x50px on mobile)
   - The cell containing "?" gets special highlighting

#### 3x3 Grid Detection & Rendering

1. **Detection**: Checks if the text contains:
   - Grid-related keywords ("grid", "square marked", "matrix", etc.)
   - Either:
     - 9 numbers in a single line (e.g., "5 10 15 6 12 18 7 14 ?")
     - 3 lines with 3 numbers each (multi-line format)

2. **Extraction**: Extracts the 9 values from either format:
   - **Single-line format**: Uses regex to extract consecutive numbers
   - **Multi-line format**: Identifies lines with 3 numbers and extracts them row by row

3. **Formatting**:
   - Splits text into: text before grid, grid data, text after grid
   - Converts flat array into 3x3 array structure
   - Generates HTML table with proper styling classes

4. **Rendering**:
   - Each cell is styled consistently (80x80px, 60x60px on mobile)
   - The cell containing "?" gets special highlighting with:
     - Different background color (primary/10 opacity)
     - Thicker border (3px vs 2px)
     - Dashed inner border for emphasis
     - Larger, bolder font

### Example Transformations

#### EduTest Grid Pattern (Markdown Table → Grid without Headers)

**Input:**
```
Study the pattern in the grid below. What number should replace the question mark?

| 4  | 7  | 28  |
| 5  | 9  | 45  |
| 6  | ?  | 66  |
```

**Output:**
```html
Study the pattern in the grid below. What number should replace the question mark?

<table class="number-grid-table">
  <tr>
    <td class="grid-cell">4</td>
    <td class="grid-cell">7</td>
    <td class="grid-cell">28</td>
  </tr>
  <tr>
    <td class="grid-cell">5</td>
    <td class="grid-cell">9</td>
    <td class="grid-cell">45</td>
  </tr>
  <tr>
    <td class="grid-cell">6</td>
    <td class="grid-cell grid-cell-question">?</td>
    <td class="grid-cell">66</td>
  </tr>
</table>
```

**Note:** Regular markdown tables (without grid keywords) still render with headers as expected.

#### Number Series

**Input:**
```
Find the missing number in the following series:

2 3 5 9 17 ? 65
```

**Output:**
```html
Find the missing number in the following series:

<table class="number-series-table">
  <tr>
    <td class="series-cell">2</td>
    <td class="series-cell">3</td>
    <td class="series-cell">5</td>
    <td class="series-cell">9</td>
    <td class="series-cell">17</td>
    <td class="series-cell series-cell-question">?</td>
    <td class="series-cell">65</td>
  </tr>
</table>
```

**Visual Result:**
```
Find the missing number in the following series:

┌────┬────┬────┬────┬────┬────┬────┐
│ 2  │ 3  │ 5  │ 9  │ 17 │ ?  │ 65 │
└────┴────┴────┴────┴────┴────┴────┘
                           ↑
                     Highlighted
```

#### 3x3 Grid

**Input (Multi-line format - most common in database):**
```
The numbers in the grid go together in a certain way. Which number should be in the square marked by the question mark?

8    12    16
10   15    20
12   18    ?
```

**Input (Single-line format - also supported):**
```
The numbers in the grid go together in a certain way.
Which number should be in the square marked by the question mark?
5 10 15 6 12 18 7 14 ?
```

**Output:**
```html
The numbers in the grid go together in a certain way.
Which number should be in the square marked by the question mark?

<table class="number-grid-table">
  <tr>
    <td class="grid-cell">5</td>
    <td class="grid-cell">10</td>
    <td class="grid-cell">15</td>
  </tr>
  <tr>
    <td class="grid-cell">6</td>
    <td class="grid-cell">12</td>
    <td class="grid-cell">18</td>
  </tr>
  <tr>
    <td class="grid-cell">7</td>
    <td class="grid-cell">14</td>
    <td class="grid-cell grid-cell-question">?</td>
  </tr>
</table>
```

### Visual Design

#### Number Series Table

```
┌────┬────┬────┬────┬────┬────┬────┐
│ 2  │ 3  │ 5  │ 9  │ 17 │╔══╗│ 65 │
│    │    │    │    │    │║?║│    │
│    │    │    │    │    │╚══╝│    │
└────┴────┴────┴────┴────┴────┴────┘
```

**Styling Details:**
- **Table**: White background, rounded corners (8px), shadow for depth
- **Regular cells**: 70x70px (50x50px on mobile), 1.5rem font, 2px gray borders
- **First/last cells**: Rounded corners on outer edges
- **Question mark cell**:
  - Highlighted background with primary color tint (edu-teal/10)
  - Bold primary-colored text (2rem)
  - Thicker primary-colored border (3px)
  - Dashed inner border (2px) for emphasis

#### 3x3 Grid Table

```
┌─────────┬─────────┬─────────┐
│    5    │   10    │   15    │
├─────────┼─────────┼─────────┤
│    6    │   12    │   18    │
├─────────┼─────────┼─────────┤
│    7    │   14    │ ╔═══╗   │
│         │         │ ║ ? ║   │ ← Highlighted cell
│         │         │ ╚═══╝   │
└─────────┴─────────┴─────────┘
```

**Styling Details:**
- **Table**: White background, rounded corners (8px), shadow for depth
- **Regular cells**: 80x80px (60x60px on mobile), 1.5rem font, 2px gray borders
- **Question mark cell**:
  - Highlighted background with primary color tint (edu-teal/10)
  - Bold primary-colored text (2rem)
  - Thicker primary-colored border (3px)
  - Dashed inner border (2px) for additional emphasis
  - Slightly larger font size for visibility

## Integration

Both grid and series formatting are automatically applied to all questions rendered through:
- `EnhancedTestInterface.tsx` (practice tests, drills, review mode)
- Any other component using `formatQuestionText()` utility

No changes needed to existing components - detection and rendering happen transparently in the text formatting pipeline.

## Testing

Tested with sample questions matching both patterns:

**Number Series:**
- ✅ Detects series patterns with keywords ("series", "sequence", "following:")
- ✅ Extracts 4-10 numbers including exactly one "?"
- ✅ Generates proper 1-row HTML table markup
- ✅ Applies correct CSS classes
- ✅ Works with series at end of question or after colon

**3x3 Grid:**
- ✅ Detects 3x3 grid patterns correctly (both formats)
- ✅ Handles single-line format (9 numbers in sequence)
- ✅ Handles multi-line format (3 rows of 3 numbers each)
- ✅ Extracts all 9 numbers including "?"
- ✅ Generates proper HTML table markup
- ✅ Applies correct CSS classes
- ✅ Works with varying amounts of whitespace between numbers

**General:**
- ✅ No conflicts between series and grid detection
- ✅ Builds without errors
- ✅ Responsive styling works on mobile

## Future Considerations

1. **Variable grid sizes**: 3x3 grid detection is currently hardcoded. Could be extended to support 2x2, 4x4, etc.
2. **Different patterns**: Could support grids/series with letters, symbols, or mixed content
3. **Multiple patterns**: Currently handles one pattern per question - could be extended for questions with multiple grids/series
4. **Variable series lengths**: Currently supports 4-10 numbers. Could be made more flexible if needed

## Deployment

No database migration or data changes required. The implementation works with existing question data - it simply reformats the display at render time.

Changes are ready for production deployment.
