import fs from 'fs';
import path from 'path';

const BLOG_DIR = '/Users/julz88/Documents/educoach-prep-portal-2/content/blog/EduCourse Blog';

// Correct product links mapping
const PRODUCT_LINKS = {
  'ACER': 'https://educourse.com.au/course/acer-scholarship',
  'EduTest': 'https://educourse.com.au/course/edutest-scholarship',
  'NSW Selective': 'https://educourse.com.au/course/nsw-selective',
  'VIC Selective': 'https://educourse.com.au/course/vic-selective',
  'Year 5 NAPLAN': 'https://educourse.com.au/course/year-5-naplan',
  'Year 7 NAPLAN': 'https://educourse.com.au/course/year-7-naplan',
};

// Old incorrect links to replace
const OLD_LINKS = [
  /https:\/\/educoach\.com\.au\/products\/acer-scholarship/g,
  /https:\/\/educoach\.com\.au\/products\/edutest-scholarship/g,
  /https:\/\/educoach\.com\.au\/products\/nsw-selective/g,
  /https:\/\/educoach\.com\.au\/products\/vic-selective/g,
  /https:\/\/educoach\.com\.au\/products\/year-5-naplan/g,
  /https:\/\/educoach\.com\.au\/products\/year-7-naplan/g,
];

function updateProductLinks(category: string, correctLink: string) {
  const categoryDir = path.join(BLOG_DIR, category);

  if (!fs.existsSync(categoryDir)) {
    console.log(`⚠️  Directory not found: ${category}`);
    return;
  }

  const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.txt'));

  console.log(`\n📁 Processing ${category} (${files.length} files)`);

  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(categoryDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace old /products/ links with new /course/ links
    const oldContent = content;
    content = content.replace(/https:\/\/educoach\.com\.au\/products\/(acer-scholarship|edutest-scholarship|nsw-selective|vic-selective|year-5-naplan|year-7-naplan)/g, correctLink);

    if (content !== oldContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`   ✅ Updated: ${file}`);
      updatedCount++;
    }
  });

  console.log(`   📊 Updated ${updatedCount} files in ${category}`);
}

async function main() {
  console.log('🔧 Fixing Product Links in All Blog Articles');
  console.log('============================================\n');

  console.log('Correct links:');
  Object.entries(PRODUCT_LINKS).forEach(([cat, link]) => {
    console.log(`  ${cat}: ${link}`);
  });

  let totalUpdated = 0;

  for (const [category, correctLink] of Object.entries(PRODUCT_LINKS)) {
    updateProductLinks(category, correctLink);
  }

  console.log('\n============================================');
  console.log('✅ All product links have been updated!');
  console.log('============================================\n');
}

main().catch(console.error);
