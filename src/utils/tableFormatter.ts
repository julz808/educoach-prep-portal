/**
 * Utility functions for detecting and converting markdown-style tables to HTML
 */

/**
 * Detects if text contains a grid pattern question (should be rendered as a grid, not a table with headers)
 */
export function isGridPatternQuestion(text: string): boolean {
  // Check for grid pattern keywords that indicate this should be rendered as a grid without headers
  return /study the pattern in the grid|pattern in the grid|grid pattern/i.test(text);
}

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

  // Check if this is a grid pattern question
  const isGridPattern = isGridPatternQuestion(text);

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

  // For grid pattern questions, render as a grid without headers (like VIC selective)
  if (isGridPattern) {
    // Filter out separator rows (rows with only dashes/spaces)
    const dataRows = rows.filter(row =>
      !row.every(cell => /^[-\s]*$/.test(cell))
    );

    let html = '<table class="number-grid-table">\n';

    // Render all rows as body cells (no headers)
    dataRows.forEach(row => {
      html += '  <tr>\n';
      row.forEach(cell => {
        // Highlight cells with question mark
        const isQuestionMark = cell === '?';
        const className = isQuestionMark ? 'grid-cell grid-cell-question' : 'grid-cell';
        html += `    <td class="${className}">${cell}</td>\n`;
      });
      html += '  </tr>\n';
    });

    html += '</table>';

    // Combine before table + HTML table + after table
    return beforeTable.trim() + '\n\n' + html + '\n\n' + afterTable.trim();
  }

  // For regular tables, use the standard table format with headers
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

/**
 * Process question text to convert any markdown tables to HTML
 */
export function processQuestionTextWithTables(text: string): {
  hasTable: boolean;
  processedText: string;
  tableHtml?: string;
} {
  if (!text) {
    return { hasTable: false, processedText: text };
  }

  const hasTable = containsMarkdownTable(text);

  if (!hasTable) {
    return { hasTable: false, processedText: text };
  }

  // Convert markdown table to HTML
  const htmlOutput = convertMarkdownTableToHtml(text);

  // Extract the table HTML
  const tableMatch = htmlOutput.match(/<table[\s\S]*?<\/table>/);
  const tableHtml = tableMatch ? tableMatch[0] : undefined;

  // Get text without the table
  const textWithoutTable = htmlOutput.replace(/<table[\s\S]*?<\/table>/, '[TABLE]').trim();

  return {
    hasTable: true,
    processedText: textWithoutTable,
    tableHtml
  };
}
