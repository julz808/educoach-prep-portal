import { parseContentFile } from './parse-content';
import path from 'path';

// Test the parser with one file
const testFile = path.join(
  process.cwd(),
  'content/blog/EduCourse Blog/ACER/01-complete-guide-acer-scholarship-test-2026.txt'
);

console.log('Testing parser with:', testFile);
console.log('='.repeat(60));

const result = parseContentFile(testFile);

if (result) {
  console.log('\n📊 METADATA:');
  console.log('  Meta Title:', result.metadata.metaTitle);
  console.log('  Meta Description:', result.metadata.metaDescription);
  console.log('  Primary Keyword:', result.metadata.primaryKeyword);
  console.log('  Featured Image:', result.metadata.featuredImage);
  console.log('  Tags:', result.metadata.tags);
  console.log('  Target Word Count:', result.metadata.targetWordCount);

  console.log('\n📝 CONTENT:');
  console.log('  Title:', result.content.title);
  console.log('  Product URL:', result.content.productUrl);
  console.log('  HTML Length:', result.content.htmlContent.length, 'chars');
  console.log('  Slug:', result.slug);

  console.log('\n🔍 FIRST 500 CHARS OF HTML:');
  console.log(result.content.htmlContent.substring(0, 500));
} else {
  console.error('❌ Failed to parse file');
}
