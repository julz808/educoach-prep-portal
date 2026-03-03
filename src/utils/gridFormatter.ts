/**
 * Grid Formatter Utility
 * Detects and formats number grids and sequences in question text
 */

/**
 * Detects if a question contains a number series/sequence pattern
 * Looks for 4-10 numbers in a row with one being a question mark
 */
export function containsNumberSeries(text: string): boolean {
  // Pattern: Multiple numbers with one or more being a question mark
  const seriesPattern = /\b(\d+|\?)\s+(\d+|\?)\s+(\d+|\?)\s+(\d+|\?)/;

  // Check if text contains series-related keywords
  const hasSeriesKeywords = /series|sequence|pattern|following.*:|missing number/i.test(text);
  const hasNumberSequence = seriesPattern.test(text);
  const hasQuestionMark = text.includes('?');

  return hasSeriesKeywords && hasNumberSequence && hasQuestionMark;
}

/**
 * Detects if a question contains a 3x3 grid pattern
 * Looks for 9 numbers (separated by spaces or newlines) that should be displayed as a grid
 */
export function containsNumberGrid(text: string): boolean {
  // Check if text contains grid-related keywords
  const hasGridKeywords = /grid|square marked|matrix|3x3|rows? and columns?/i.test(text);

  if (!hasGridKeywords) {
    return false;
  }

  // Pattern 1: Nine numbers in sequence on one line (e.g., "5 10 15 6 12 18 7 14 ?")
  const singleLinePattern = /\b(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+|\?)/;
  if (singleLinePattern.test(text)) {
    return true;
  }

  // Pattern 2: Three lines with 3 numbers each (multi-line grid format)
  const lines = text.split('\n');
  const gridLinePattern = /^(\d+|\?)\s+(\d+|\?)\s+(\d+|\?)$/;
  let gridLineCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (gridLinePattern.test(trimmedLine)) {
      gridLineCount++;
    }
  }

  // Should have exactly 3 lines with 3 numbers each
  return gridLineCount === 3;
}

/**
 * Extracts 3x3 grid data from question text
 * Returns an array of 9 values (numbers or "?")
 */
export function extractGridData(text: string): string[] | null {
  // Pattern 1: Numbers on one line (e.g., "5 10 15 6 12 18 7 14 ?")
  const singleLinePattern = /\b(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+|\?)/;
  const singleLineMatch = text.match(singleLinePattern);

  if (singleLineMatch) {
    return singleLineMatch.slice(1, 10);
  }

  // Pattern 2: Numbers on separate lines (3 rows of 3 numbers each)
  // Extract all numbers and question marks from the text after detecting it's a grid question
  const numbers: string[] = [];
  const lines = text.split('\n');

  // Find the section with the grid (typically after the question text)
  let inGridSection = false;
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this line contains 2-3 numbers/question marks separated by spaces
    const gridLinePattern = /^(\d+|\?)\s+(\d+|\?)\s+(\d+|\?)$/;
    const match = trimmedLine.match(gridLinePattern);

    if (match) {
      inGridSection = true;
      // Extract the numbers from this row
      numbers.push(match[1], match[2], match[3]);
    } else if (inGridSection) {
      // We've left the grid section
      break;
    }
  }

  // Valid grid should have exactly 9 numbers
  if (numbers.length === 9) {
    return numbers;
  }

  return null;
}

/**
 * Formats question text by replacing grid numbers with a table
 * Returns object with:
 * - textBeforeGrid: Text before the grid
 * - gridData: Array of 9 values for the 3x3 grid
 * - textAfterGrid: Text after the grid
 */
export interface FormattedGridQuestion {
  textBeforeGrid: string;
  gridData: string[][];  // 3x3 array
  textAfterGrid: string;
}

export function formatQuestionWithGrid(text: string): FormattedGridQuestion | null {
  if (!containsNumberGrid(text)) {
    return null;
  }

  const gridData = extractGridData(text);
  if (!gridData) {
    return null;
  }

  // Convert flat array to 3x3 grid first
  const grid3x3: string[][] = [
    [gridData[0], gridData[1], gridData[2]],
    [gridData[3], gridData[4], gridData[5]],
    [gridData[6], gridData[7], gridData[8]]
  ];

  // Try to find the grid section in the text
  // Pattern 1: Single line format
  const singleLinePattern = new RegExp(gridData.map(v => v.replace('?', '\\?')).join('\\s+'));
  let singleLineMatch = text.match(singleLinePattern);

  if (singleLineMatch) {
    const gridStartIndex = singleLineMatch.index!;
    const gridEndIndex = gridStartIndex + singleLineMatch[0].length;

    return {
      textBeforeGrid: text.substring(0, gridStartIndex).trim(),
      gridData: grid3x3,
      textAfterGrid: text.substring(gridEndIndex).trim()
    };
  }

  // Pattern 2: Multi-line format - find first and last line with grid numbers
  const lines = text.split('\n');
  let firstGridLineIndex = -1;
  let lastGridLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const gridLinePattern = /^(\d+|\?)\s+(\d+|\?)\s+(\d+|\?)$/;

    if (gridLinePattern.test(line)) {
      if (firstGridLineIndex === -1) {
        firstGridLineIndex = i;
      }
      lastGridLineIndex = i;
    }
  }

  if (firstGridLineIndex !== -1 && lastGridLineIndex !== -1) {
    // Found the grid lines
    const textBeforeGrid = lines.slice(0, firstGridLineIndex).join('\n').trim();
    const textAfterGrid = lines.slice(lastGridLineIndex + 1).join('\n').trim();

    return {
      textBeforeGrid,
      gridData: grid3x3,
      textAfterGrid
    };
  }

  // Fallback: couldn't find the grid position, just return the data
  return {
    textBeforeGrid: text.trim(),
    gridData: grid3x3,
    textAfterGrid: ''
  };
}

/**
 * Extracts number series data from question text
 * Returns an array of values (numbers or "?")
 */
export function extractSeriesData(text: string): string[] | null {
  // Extract all numbers and question marks that are part of the series
  // Look for a sequence of numbers/question marks after common patterns
  const patterns = [
    // Pattern 1: After "series:", "following:", etc. with newline
    /(?:series|sequence|pattern|following).*?:\s*\n+\s*((?:(?:\d+|\?)\s+)+(?:\d+|\?))/i,
    // Pattern 2: Last line of text (most common for series questions)
    /\n\s*((?:(?:\d+|\?)\s+){3,}(?:\d+|\?))\s*$/,
    // Pattern 3: After colon on same line
    /(?:series|sequence|pattern|following).*?:\s+((?:(?:\d+|\?)\s+){3,}(?:\d+|\?))/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Extract all numbers and question marks from the matched group
      const seriesText = match[1];
      const values = seriesText.trim().split(/\s+/).filter(v => v.match(/^\d+$|^\?$/));

      // Valid series should have at least 4 values and should contain exactly one "?"
      const questionMarkCount = values.filter(v => v === '?').length;
      if (values.length >= 4 && questionMarkCount === 1) {
        return values;
      }
    }
  }

  return null;
}

/**
 * Formats question text by replacing series with a table
 */
export interface FormattedSeriesQuestion {
  textBeforeSeries: string;
  seriesData: string[];
  textAfterSeries: string;
}

export function formatQuestionWithSeries(text: string): FormattedSeriesQuestion | null {
  if (!containsNumberSeries(text)) {
    return null;
  }

  const seriesData = extractSeriesData(text);
  if (!seriesData) {
    return null;
  }

  // Find where the series appears in the text
  const seriesPattern = new RegExp(seriesData.map(v => v.replace('?', '\\?')).join('\\s+'));
  const match = text.match(seriesPattern);

  if (!match) {
    return null;
  }

  const seriesStartIndex = match.index!;
  const seriesEndIndex = seriesStartIndex + match[0].length;

  // Split text into before, series, and after
  const textBeforeSeries = text.substring(0, seriesStartIndex).trim();
  const textAfterSeries = text.substring(seriesEndIndex).trim();

  return {
    textBeforeSeries,
    seriesData,
    textAfterSeries
  };
}

/**
 * Renders a number series as an HTML table (single row)
 */
export function renderSeriesAsTable(series: string[]): string {
  let html = '<table class="number-series-table"><tr>';

  for (const value of series) {
    // Highlight the cell with "?"
    const isQuestionMark = value === '?';
    const className = isQuestionMark ? 'series-cell series-cell-question' : 'series-cell';
    html += `<td class="${className}">${value}</td>`;
  }

  html += '</tr></table>';
  return html;
}

/**
 * Renders a 3x3 grid as an HTML table string
 */
export function renderGridAsTable(grid: string[][]): string {
  let html = '<table class="number-grid-table">';

  for (const row of grid) {
    html += '<tr>';
    for (const cell of row) {
      // Highlight the cell with "?"
      const isQuestionMark = cell === '?';
      const className = isQuestionMark ? 'grid-cell grid-cell-question' : 'grid-cell';
      html += `<td class="${className}">${cell}</td>`;
    }
    html += '</tr>';
  }

  html += '</table>';
  return html;
}
