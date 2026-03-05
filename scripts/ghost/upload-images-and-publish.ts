import GhostAdminAPI from '@tryghost/admin-api';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import {
  parseContentFile,
  getAllContentFiles,
  ParsedArticle,
} from './parse-content';

// Load environment variables
config();

// Initialize Ghost Admin API
const api = new GhostAdminAPI({
  url: process.env.GHOST_API_URL || '',
  key: process.env.GHOST_ADMIN_API_KEY || '',
  version: 'v5.0',
});

// Image to article mapping based on actual filenames
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
 * Upload an image to Ghost and return the URL
 */
async function uploadImage(imagePath: string): Promise<string> {
  try {
    console.log(`   📤 Uploading image: ${path.basename(imagePath)}`);

    // Upload to Ghost - pass the file path directly
    const result: any = await api.images.upload({
      file: imagePath,
    });

    // Extract the URL string from the result
    const imageUrl = typeof result === 'string' ? result : result.url || result;

    console.log(`   ✅ Image uploaded: ${imageUrl}`);
    return imageUrl;
  } catch (error: any) {
    console.error(`   ❌ Error uploading image:`, error.message);
    throw error;
  }
}

/**
 * Update the article file with the Ghost image URL
 */
function updateArticleFile(articlePath: string, imageUrl: string): void {
  try {
    let content = fs.readFileSync(articlePath, 'utf-8');

    // Find the FEATURED IMAGE line and replace PLACEHOLDER with actual URL
    const featuredImageRegex = /FEATURED IMAGE:\s*PLACEHOLDER_[^\n]+/;
    content = content.replace(featuredImageRegex, `FEATURED IMAGE:\n${imageUrl}`);

    // Write back to file
    fs.writeFileSync(articlePath, content, 'utf-8');
    console.log(`   ✅ Updated article file with image URL`);
  } catch (error: any) {
    console.error(`   ❌ Error updating article file:`, error.message);
    throw error;
  }
}

/**
 * Publish article to Ghost with the featured image
 */
async function publishArticleToGhost(
  articlePath: string,
  imageUrl: string,
  publishStatus: 'draft' | 'published' = 'draft'
): Promise<any> {
  try {
    const article = parseContentFile(articlePath);
    if (!article) {
      throw new Error('Failed to parse article');
    }

    console.log(`   📝 Publishing to Ghost: ${article.content.title}`);

    // Prepare post data with the uploaded image
    const postData: any = {
      title: article.content.title,
      slug: article.slug,
      html: article.content.htmlContent,
      status: publishStatus,
      meta_title: article.metadata.metaTitle,
      meta_description: article.metadata.metaDescription,
      feature_image: imageUrl,
      tags: article.metadata.tags?.filter(tag => tag && tag.length > 0).map(tag => ({ name: tag })) || [],
      custom_excerpt: article.metadata.metaDescription,
    };

    // Create or update the post
    const result = await api.posts.add(postData, { source: 'html' });

    console.log(`   ✅ Published to Ghost! Post ID: ${result.id}`);
    console.log(`   🔗 URL: ${result.url}`);

    return result;
  } catch (error: any) {
    console.error(`   ❌ Error publishing to Ghost:`, error.message);
    throw error;
  }
}

/**
 * Process all images and publish articles
 */
async function processAllImages(publishStatus: 'draft' | 'published' = 'draft') {
  console.log('\n🚀 Starting Image Upload and Publishing Process');
  console.log(`   Status: ${publishStatus}`);
  console.log(`   Total images: ${Object.keys(IMAGE_MAPPINGS).length}\n`);

  const imagesDir = path.join(process.cwd(), 'content', 'Blog Images');
  const contentDir = path.join(process.cwd(), 'content', 'blog', 'EduCourse Blog');

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const [imageName, articleRelativePath] of Object.entries(IMAGE_MAPPINGS)) {
    const imagePath = path.join(imagesDir, imageName);
    const articlePath = path.join(contentDir, articleRelativePath);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${imageName} → ${articleRelativePath}`);
    console.log('='.repeat(60));

    try {
      // Check if image exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image not found: ${imagePath}`);
      }

      // Check if article exists
      if (!fs.existsSync(articlePath)) {
        throw new Error(`Article not found: ${articlePath}`);
      }

      // Step 1: Upload image to Ghost
      const imageUrl = await uploadImage(imagePath);

      // Step 2: Update the article file with the image URL
      updateArticleFile(articlePath, imageUrl);

      // Step 3: Publish the article to Ghost
      await publishArticleToGhost(articlePath, imageUrl, publishStatus);

      results.successful++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      results.failed++;
      results.errors.push(`${imageName}: ${error.message}`);
      console.error(`\n❌ Failed to process ${imageName}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PROCESSING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.successful}`);
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
  const command = args[0];

  // Check for required environment variables
  if (!process.env.GHOST_API_URL || !process.env.GHOST_ADMIN_API_KEY) {
    console.error('❌ Error: Missing Ghost API credentials');
    console.error('   Please set GHOST_API_URL and GHOST_ADMIN_API_KEY in your .env file');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'test':
        // Test with first image only
        console.log('🧪 Test mode: Processing first image only\n');
        const firstImage = Object.keys(IMAGE_MAPPINGS)[0];
        const firstArticle = IMAGE_MAPPINGS[firstImage as keyof typeof IMAGE_MAPPINGS];

        const testImagesDir = path.join(process.cwd(), 'content', 'Blog Images');
        const testContentDir = path.join(process.cwd(), 'content', 'blog', 'EduCourse Blog');
        const testImagePath = path.join(testImagesDir, firstImage);
        const testArticlePath = path.join(testContentDir, firstArticle);

        console.log(`Testing with: ${firstImage} → ${firstArticle}\n`);

        const imageUrl = await uploadImage(testImagePath);
        updateArticleFile(testArticlePath, imageUrl);
        await publishArticleToGhost(testArticlePath, imageUrl, 'draft');

        console.log('\n✅ Test completed successfully!');
        break;

      case 'draft':
        // Process all images and publish as drafts
        await processAllImages('draft');
        break;

      case 'publish':
        // Process all images and publish as live
        console.log('⚠️  WARNING: This will publish articles as LIVE (not drafts)');
        console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await processAllImages('published');
        break;

      default:
        console.log('📖 Image Upload and Publishing Tool - Usage:\n');
        console.log('  npm run upload-images test      - Test with first image only');
        console.log('  npm run upload-images draft     - Upload all images and publish as drafts');
        console.log('  npm run upload-images publish   - Upload all images and publish as live\n');
        console.log('📝 This will:');
        console.log('   1. Upload each image to Ghost');
        console.log('   2. Update the local article file with the Ghost image URL');
        console.log('   3. Publish/update the article in Ghost with the featured image\n');
        console.log(`📊 Total images to process: ${Object.keys(IMAGE_MAPPINGS).length}`);
        console.log('   - ACER: 8 images (articles 2-9)');
        console.log('   - EduTest: 8 images (articles 2-9)');
        console.log('   - NSW Selective: 8 images (articles 2-9)');
        console.log('   - VIC Selective: 8 images (articles 2-9)');
        console.log('   - Year 5 NAPLAN: 8 images (articles 2-9)');
        console.log('   - Year 7 NAPLAN: 8 images (articles 2-9)\n');
        break;
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
