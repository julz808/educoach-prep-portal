import fs from 'fs';
import path from 'path';

const BLOG_DIR = '/Users/julz88/Documents/educoach-prep-portal-2/content/blog/EduCourse Blog';

// DEFINITIVE product URLs
const PRODUCT_URLS: Record<string, string> = {
  'ACER': 'https://educourse.com.au/course/acer-scholarship',
  'EduTest': 'https://educourse.com.au/course/edutest-scholarship',
  'NSW Selective': 'https://educourse.com.au/course/nsw-selective',
  'VIC Selective': 'https://educourse.com.au/course/vic-selective',
  'Year 5 NAPLAN': 'https://educourse.com.au/course/year-5-naplan',
  'Year 7 NAPLAN': 'https://educourse.com.au/course/year-7-naplan',
};

function fixProductLinksInArticle(filePath: string, category: string): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  const correctUrl = PRODUCT_URLS[category];

  if (!correctUrl) {
    console.log(`   ⚠️  No product URL found for category: ${category}`);
    return false;
  }

  // Replace ALL instances of wrong URLs with correct one
  const oldPatterns = [
    /https:\/\/educoach\.com\.au\/products\/[a-z0-9-]+/g,
    /https:\/\/educourse\.com\.au\/products\/[a-z0-9-]+/g,
  ];

  let updated = false;
  oldPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, correctUrl);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return updated;
}

function analyzeArticleLinks(filePath: string, category: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

  // Find all product links (both educoach and educourse)
  const linkRegex = /\*\*\[([^\]]+)\]\((https:\/\/(?:educoach|educourse)\.com\.au\/[^\)]+)\)\*\*/g;
  const matches = [...content.matchAll(linkRegex)];

  // Filter to only product links (not insights blog)
  const productLinks = matches.filter(m => !m[2].includes('insights.educourse'));

  console.log(`\n   📄 ${fileName}`);
  console.log(`      Product links found: ${productLinks.length}`);

  if (productLinks.length === 0) {
    console.log(`      ⚠️  NO PRODUCT LINKS - NEEDS ALL 3!`);
  } else if (productLinks.length < 3) {
    console.log(`      ⚠️  MISSING LINKS - Has ${productLinks.length}, needs 3`);
  } else if (productLinks.length > 3) {
    console.log(`      ⚠️  TOO MANY LINKS - Has ${productLinks.length}, should be 3`);
  }

  productLinks.forEach((match, idx) => {
    const linkText = match[1];
    const linkUrl = match[2];
    const isCorrect = linkUrl === PRODUCT_URLS[category];
    console.log(`      ${idx + 1}. [${linkText}] → ${linkUrl} ${isCorrect ? '✅' : '❌ WRONG'}`);
  });
}

async function main() {
  console.log('🔍 COMPREHENSIVE PRODUCT LINK AUDIT\n');
  console.log('Correct URLs:');
  Object.entries(PRODUCT_URLS).forEach(([cat, url]) => {
    console.log(`  ${cat}: ${url}`);
  });
  console.log('\n' + '='.repeat(70));

  const categories = Object.keys(PRODUCT_URLS);

  for (const category of categories) {
    const categoryDir = path.join(BLOG_DIR, category);

    if (!fs.existsSync(categoryDir)) {
      console.log(`\n❌ Directory not found: ${category}`);
      continue;
    }

    console.log(`\n📁 ${category}`);
    console.log('='.repeat(70));

    // Get articles 02-09 (the ones with images)
    const files = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.txt') && /^0[2-9]-/.test(f))
      .sort();

    files.forEach(file => {
      const filePath = path.join(categoryDir, file);

      // First, analyze what links exist
      analyzeArticleLinks(filePath, category);

      // Then fix wrong URLs
      const fixed = fixProductLinksInArticle(filePath, category);
      if (fixed) {
        console.log(`      ✅ Fixed URLs to: ${PRODUCT_URLS[category]}`);
      }
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Audit complete!');
  console.log('\nNEXT STEPS:');
  console.log('1. Review articles with 0, 1, or 2 links');
  console.log('2. Manually add missing product links in appropriate sections');
  console.log('3. Ensure links are at: beginning (~15-20%), middle (~50%), end (~95%)');
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
