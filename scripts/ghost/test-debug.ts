import { parseContentFile } from './parse-content';
import path from 'path';

const testFile = path.join(
  process.cwd(),
  'content/blog/EduCourse Blog/ACER/01-complete-guide-acer-scholarship-test-2026.txt'
);

const result = parseContentFile(testFile);

if (result) {
  console.log('Product URL:', result.content.productUrl);

  const html = result.content.htmlContent;
  const h2s = html.match(/<h2>.*?<\/h2>/g) || [];
  const buttons = html.match(/padding: 14px 32px/g) || [];

  console.log('\nH2 Count:', h2s.length);
  console.log('Button Count:', buttons.length);
  console.log('\nExpected: 3 buttons (after H2 #2, after H2 #5, at end)');
  console.log('Actual:', buttons.length, 'buttons');

  if (buttons.length < 3) {
    console.log('\n⚠️  MISSING BUTTONS!');
    console.log('\nH2 Sections:');
    h2s.forEach((h2, i) => {
      console.log(`  ${i + 1}. ${h2.replace(/<\/?h2>/g, '')}`);
    });
  }
}
