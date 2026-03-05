import { parseContentFile } from './parse-content';
import path from 'path';
import fs from 'fs';

// Test the parser with one file
const testFile = path.join(
  process.cwd(),
  'content/blog/EduCourse Blog/ACER/01-complete-guide-acer-scholarship-test-2026.txt'
);

const result = parseContentFile(testFile);

if (result) {
  console.log('Product URL:', result.content.productUrl);
  console.log('\n📍 Button HTML Snippets:\n');

  // Extract button sections from HTML
  const buttonMatches = result.content.htmlContent.match(/<div class="kg-card kg-button-card.*?<\/div>/gs);

  if (buttonMatches) {
    console.log(`Found ${buttonMatches.length} buttons:\n`);
    buttonMatches.forEach((button, i) => {
      console.log(`Button ${i + 1}:`);
      console.log(button);
      console.log('\n---\n');
    });
  } else {
    console.log('No buttons found in HTML');

    // Debug: Check what's in the HTML
    console.log('\nHTML length:', result.content.htmlContent.length);
    console.log('\nSearching for "kg-":', result.content.htmlContent.includes('kg-'));
    console.log('Searching for "button":', result.content.htmlContent.includes('button'));
  }

  // Save to file for inspection
  fs.writeFileSync('/tmp/test-article.html', result.content.htmlContent);
  console.log('\nFull HTML saved to: /tmp/test-article.html');
}
