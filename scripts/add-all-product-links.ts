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

// Product names for link text
const PRODUCT_NAMES: Record<string, string> = {
  'ACER': 'ACER Test',
  'EduTest': 'EduTest',
  'NSW Selective': 'NSW Selective',
  'VIC Selective': 'VIC Selective',
  'Year 5 NAPLAN': 'Year 5 NAPLAN',
  'Year 7 NAPLAN': 'Year 7 NAPLAN',
};

function fixArticleLinks(filePath: string, category: string): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  const correctUrl = PRODUCT_URLS[category];
  const productName = PRODUCT_NAMES[category];
  let updated = false;

  // Step 1: Replace ALL wrong URLs with correct one
  const wrongPatterns = [
    /https:\/\/educoach\.com\.au\/products\/[a-z0-9-]+/g,
    /https:\/\/educourse\.com\.au\/products\/[a-z0-9-]+/g,
    /https:\/\/educourse\.com\.au\/course\/vic-selective-entry-year-9-entry/g,
    /https:\/\/educourse\.com\.au\/course\/acer-test/g,
    /https:\/\/educourse\.com\.au\/course\/edutest/g,
  ];

  wrongPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, correctUrl);
      updated = true;
    }
  });

  // Step 2: Count existing product links
  const linkRegex = /\*\*\[([^\]]+)\]\((https:\/\/educourse\.com\.au\/course\/[^\)]+)\)\*\*/g;
  const existingLinks = [...content.matchAll(linkRegex)].filter(m => m[2] === correctUrl);

  if (existingLinks.length === 0) {
    // NO LINKS - Add all 3
    content = addThreeLinks(content, productName, correctUrl);
    updated = true;
    console.log(`      ➕ Added 3 new links`);
  } else if (existingLinks.length < 3) {
    // MISSING LINKS - Add the 3rd one at the beginning
    content = addBeginningLink(content, productName, correctUrl);
    updated = true;
    console.log(`      ➕ Added missing beginning link (had ${existingLinks.length}, now 3)`);
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return updated;
}

function addBeginningLink(content: string, productName: string, url: string): string {
  // Find the first H2 section (after introduction)
  const h2Match = content.match(/\n\nH2: ([^\n]+)/);

  if (h2Match) {
    const h2Index = content.indexOf(h2Match[0]);

    // Insert link before this H2
    const linkBlock = `\n\n---\n\n**[Start ${productName} Preparation →](${url})**\n\n---\n`;

    content = content.slice(0, h2Index) + linkBlock + content.slice(h2Index);
  }

  return content;
}

function addThreeLinks(content: string, productName: string, url: string): string {
  // Find first H2 (for beginning link - around 15-20%)
  const firstH2Match = content.match(/\n\nH2: ([^\n]+)/);

  // Find MID-ARTICLE marker or middle H2 (for middle link - around 50%)
  const midArticleMatch = content.match(/---\n\nMID-ARTICLE PRODUCT LINK:/);

  // Find CALL TO ACTION (for end link - around 95%)
  const ctaMatch = content.match(/\n\nCALL TO ACTION:/);

  // 1. Add beginning link (before first H2)
  if (firstH2Match) {
    const h2Index = content.indexOf(firstH2Match[0]);
    const beginLink = `\n\n---\n\n**[Start ${productName} Preparation →](${url})**\n\n---\n`;
    content = content.slice(0, h2Index) + beginLink + content.slice(h2Index);
  }

  // 2. Add or replace middle link
  if (midArticleMatch) {
    // Replace the MID-ARTICLE section
    const midStart = content.indexOf('MID-ARTICLE PRODUCT LINK:');
    const midEnd = content.indexOf('---', midStart + 30);

    if (midEnd > midStart) {
      const newMidSection = `MID-ARTICLE PRODUCT LINK:\n\n**[Practice with ${productName} →](${url})**\n\n`;
      content = content.slice(0, midStart) + newMidSection + content.slice(midEnd);
    }
  }

  // 3. Add or replace end link (in CALL TO ACTION section)
  if (ctaMatch) {
    // Find the existing CTA content
    const ctaStart = content.indexOf('CALL TO ACTION:');
    const ctaEnd = content.indexOf('---\nEND OF ARTICLE', ctaStart);

    if (ctaEnd > ctaStart) {
      // Extract the CTA text (everything between CALL TO ACTION and the link)
      const ctaContent = content.slice(ctaStart, ctaEnd);

      // Add link at the end of CTA
      const newCtaSection = ctaContent + `\n**[Get Complete ${productName} Preparation →](${url})**\n\n`;
      content = content.slice(0, ctaStart) + newCtaSection + content.slice(ctaEnd);
    }
  }

  return content;
}

async function main() {
  console.log('🔧 FIXING ALL PRODUCT LINKS\n');
  console.log('Adding 3 links to every article with correct URLs:\n');
  Object.entries(PRODUCT_URLS).forEach(([cat, url]) => {
    console.log(`  ${cat}: ${url}`);
  });
  console.log('\n' + '='.repeat(70) + '\n');

  const categories = Object.keys(PRODUCT_URLS);
  let totalUpdated = 0;

  for (const category of categories) {
    const categoryDir = path.join(BLOG_DIR, category);

    if (!fs.existsSync(categoryDir)) {
      console.log(`\n❌ Directory not found: ${category}`);
      continue;
    }

    console.log(`📁 ${category}`);

    // Get articles 02-09
    const files = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.txt') && /^0[2-9]-/.test(f))
      .sort();

    let categoryUpdated = 0;

    files.forEach(file => {
      const filePath = path.join(categoryDir, file);
      console.log(`   📄 ${file}`);

      const updated = fixArticleLinks(filePath, category);
      if (updated) {
        categoryUpdated++;
        totalUpdated++;
        console.log(`      ✅ Updated`);
      } else {
        console.log(`      ⏭️  Already correct`);
      }
    });

    console.log(`   📊 Updated ${categoryUpdated}/${files.length} files\n`);
  }

  console.log('='.repeat(70));
  console.log(`✅ Complete! Updated ${totalUpdated} articles`);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
