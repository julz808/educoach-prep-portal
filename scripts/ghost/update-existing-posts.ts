import GhostAdminAPI from '@tryghost/admin-api';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import {
  parseContentFile,
} from './parse-content';

// Load environment variables
config();

// Initialize Ghost Admin API
const api = new GhostAdminAPI({
  url: process.env.GHOST_API_URL || '',
  key: process.env.GHOST_ADMIN_API_KEY || '',
  version: 'v5.0',
});

// Image to article mapping (same as upload script)
const IMAGE_MAPPINGS = {
  // ACER (images 7-14)
  '7.png': 'ACER/02-acer-test-2026-whats-new-and-changed.txt',
  '8.png': 'ACER/03-how-to-prepare-acer-test-2026.txt',
  '9.png': 'ACER/04-best-acer-test-prep-resources-2026.txt',
  '10.png': 'ACER/05-acer-test-day-strategy-2026.txt',
  '11.png': 'ACER/06-acer-reading-comprehension-2026.txt',
  '12.png': 'ACER/07-acer-mathematics-2026.txt',
  '13.png': 'ACER/08-acer-verbal-reasoning-2026.txt',
  '14.png': 'ACER/09-acer-abstract-reasoning-2026.txt',

  // EduTest (images 15-22)
  '15.png': 'EduTest/02-edutest-changes-2026.txt',
  '16.png': 'EduTest/03-edutest-preparation-plan-2026.txt',
  '17.png': 'EduTest/04-best-edutest-resources-2026.txt',
  '18.png': 'EduTest/05-edutest-test-day-strategy-2026.txt',
  '19.png': 'EduTest/06-edutest-quantitative-reasoning-2026.txt',
  '20.png': 'EduTest/07-edutest-verbal-reasoning-2026.txt',
  '21.png': 'EduTest/08-edutest-writing-tips-2026.txt',
  '22.png': 'EduTest/09-edutest-percentile-rankings-explained.txt',

  // NSW Selective (images 23-30)
  '23.png': 'NSW Selective/02-nsw-selective-changes-2026.txt',
  '24.png': 'NSW Selective/03-nsw-selective-preparation-2026.txt',
  '25.png': 'NSW Selective/04-nsw-selective-resources-2026.txt',
  '26.png': 'NSW Selective/05-nsw-selective-test-day-2026.txt',
  '27.png': 'NSW Selective/06-nsw-selective-reading-2026.txt',
  '28.png': 'NSW Selective/07-nsw-selective-mathematical-reasoning-2026.txt',
  '29.png': 'NSW Selective/08-nsw-selective-thinking-skills-2026.txt',
  '30.png': 'NSW Selective/09-nsw-selective-placement-scores-explained.txt',

  // VIC Selective (images 31-38)
  '31.png': 'VIC Selective/02-vic-selective-changes-2026.txt',
  '32.png': 'VIC Selective/03-vic-selective-preparation-2026.txt',
  '33.png': 'VIC Selective/04-vic-selective-resources-2026.txt',
  '34.png': 'VIC Selective/05-vic-selective-test-day-2026.txt',
  '35.png': 'VIC Selective/06-vic-selective-quantitative-reasoning-2026.txt',
  '36.png': 'VIC Selective/07-vic-selective-reading-2026.txt',
  '37.png': 'VIC Selective/08-vic-selective-verbal-reasoning-2026.txt',
  '38.png': 'VIC Selective/09-vic-selective-writing-2026.txt',

  // Year 5 NAPLAN (images 39-46)
  '39.png': 'Year 5 NAPLAN/02-year-5-naplan-changes-2026.txt',
  '40.png': 'Year 5 NAPLAN/03-year-5-naplan-preparation-2026.txt',
  '41.png': 'Year 5 NAPLAN/04-year-5-naplan-resources-2026.txt',
  '42.png': 'Year 5 NAPLAN/05-year-5-naplan-test-day-2026.txt',
  '43.png': 'Year 5 NAPLAN/06-year-5-naplan-reading-2026.txt',
  '44.png': 'Year 5 NAPLAN/07-year-5-naplan-writing-2026.txt',
  '45.png': 'Year 5 NAPLAN/08-year-5-naplan-language-conventions-2026.txt',
  '46.png': 'Year 5 NAPLAN/09-year-5-naplan-numeracy-2026.txt',

  // Year 7 NAPLAN (images 47-54)
  '47.png': 'Year 7 NAPLAN/02-year-7-naplan-changes-2026.txt',
  '48.png': 'Year 7 NAPLAN/03-year-7-naplan-preparation-2026.txt',
  '49.png': 'Year 7 NAPLAN/04-year-7-naplan-resources-2026.txt',
  '50.png': 'Year 7 NAPLAN/05-year-7-naplan-test-day-2026.txt',
  '51.png': 'Year 7 NAPLAN/06-year-7-naplan-reading-2026.txt',
  '52.png': 'Year 7 NAPLAN/07-year-7-naplan-writing-2026.txt',
  '53.png': 'Year 7 NAPLAN/08-year-7-naplan-language-conventions-2026.txt',
  '54.png': 'Year 7 NAPLAN/09-year-7-naplan-numeracy-2026.txt',
};

/**
 * Find existing post by slug
 */
async function findPostBySlug(slug: string): Promise<any | null> {
  try {
    const posts = await api.posts.browse({
      filter: `slug:${slug}`,
      limit: 1,
    });
    return posts && posts.length > 0 ? posts[0] : null;
  } catch (error) {
    console.error(`   ⚠️  Error finding post with slug ${slug}:`, error);
    return null;
  }
}

/**
 * Update existing Ghost post
 */
async function updateGhostPost(
  articlePath: string,
  imageUrl: string,
  publishStatus: 'draft' | 'published' = 'draft'
): Promise<any> {
  try {
    const article = parseContentFile(articlePath);

    console.log(`   🔍 Looking for existing post: ${article.content.title}`);

    // Find existing post by slug
    const existingPost = await findPostBySlug(article.slug);

    if (!existingPost) {
      console.log(`   ⚠️  Post not found in Ghost, skipping...`);
      return null;
    }

    console.log(`   📝 Found post (ID: ${existingPost.id}), updating...`);

    const postData: any = {
      id: existingPost.id, // ID must be in the data object
      title: article.content.title,
      slug: article.slug,
      html: article.content.htmlContent,
      status: publishStatus,
      meta_title: article.metadata.metaTitle,
      meta_description: article.metadata.metaDescription,
      feature_image: imageUrl,
      tags: article.metadata.tags?.filter(tag => tag && tag.length > 0).map(tag => ({ name: tag })) || [],
      custom_excerpt: article.metadata.metaDescription,
      updated_at: existingPost.updated_at, // Required for updates
    };

    // Update the post
    const result = await api.posts.edit(postData, { source: 'html' });

    console.log(`   ✅ Updated in Ghost!`);
    console.log(`   🔗 URL: ${result.url}`);

    return result;
  } catch (error: any) {
    console.error(`   ❌ Error updating Ghost post:`, error.message);
    throw error;
  }
}

/**
 * Update all existing posts
 */
async function updateAllPosts(publishStatus: 'draft' | 'published' = 'draft') {
  console.log('\n🔄 Updating Existing Ghost Posts with Corrected Links');
  console.log(`   Status: ${publishStatus}`);
  console.log(`   Total posts: ${Object.keys(IMAGE_MAPPINGS).length}\n`);

  const contentDir = path.join(process.cwd(), 'content', 'blog', 'EduCourse Blog');

  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const [imageName, articleRelativePath] of Object.entries(IMAGE_MAPPINGS)) {
    const articlePath = path.join(contentDir, articleRelativePath);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${articleRelativePath}`);
    console.log('='.repeat(60));

    try {
      // Check if article exists
      if (!fs.existsSync(articlePath)) {
        throw new Error(`Article not found: ${articlePath}`);
      }

      // Read the featured image URL from the article
      const content = fs.readFileSync(articlePath, 'utf-8');
      const imageUrlMatch = content.match(/FEATURED IMAGE:\s*\n?(https:\/\/[^\n]+)/);

      if (!imageUrlMatch) {
        console.log(`   ⚠️  No featured image URL found, skipping...`);
        results.skipped++;
        continue;
      }

      const imageUrl = imageUrlMatch[1].trim();

      // Update the post in Ghost
      const result = await updateGhostPost(articlePath, imageUrl, publishStatus);

      if (result) {
        results.successful++;
      } else {
        results.skipped++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      results.failed++;
      results.errors.push(`${articleRelativePath}: ${error.message}`);
      console.error(`\n❌ Failed to process ${articleRelativePath}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${results.successful}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const publishStatus = args[0] === 'published' ? 'published' : 'draft';

  // Check for required environment variables
  if (!process.env.GHOST_API_URL || !process.env.GHOST_ADMIN_API_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   GHOST_API_URL');
    console.error('   GHOST_ADMIN_API_KEY');
    process.exit(1);
  }

  console.log('🔧 Ghost Post Update Tool');
  console.log('========================\n');
  console.log(`Target status: ${publishStatus}\n`);

  await updateAllPosts(publishStatus);
}

main().catch(console.error);
