import { parseContentFile } from './ghost/parse-content';
import fs from 'fs';

const testFile = '/Users/julz88/Documents/educoach-prep-portal-2/content/blog/EduCourse Blog/Year 7 NAPLAN/09-year-7-naplan-numeracy-2026.txt';

const result = parseContentFile(testFile);

if (result) {
  console.log('Title:', result.content.title);
  console.log('\nProduct URL extracted:', result.content.productUrl || 'NOT FOUND');
  console.log('\nSearching for product links in HTML...\n');

  const html = result.content.htmlContent;
  const linkMatches = html.match(/educourse\.com\.au\/course\/[a-z0-9-]+/g);

  if (linkMatches) {
    console.log(`Found ${linkMatches.length} product link(s):`);
    linkMatches.forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link}`);
    });
  } else {
    console.log('NO PRODUCT LINKS FOUND IN HTML');
  }

  // Show button cards
  const buttonMatches = html.match(/kg-btn/g);
  console.log(`\nButton cards found: ${buttonMatches ? buttonMatches.length : 0}`);

  // Save HTML to file for inspection
  fs.writeFileSync('/tmp/test-html-output.html', html);
  console.log('\nFull HTML saved to: /tmp/test-html-output.html');

  // Show first few button elements
  const buttonDiv = html.match(/<div class="kg-card[^>]+>[\s\S]*?<\/div>/g);
  if (buttonDiv && buttonDiv.length > 0) {
    console.log('\nFirst button HTML:');
    console.log(buttonDiv[0]);
  }
}
