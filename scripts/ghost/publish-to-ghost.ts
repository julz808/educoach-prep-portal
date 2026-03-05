import GhostAdminAPI from '@tryghost/admin-api';
import { config } from 'dotenv';
import path from 'path';
import {
  parseContentFile,
  getAllContentFiles,
  getProductUrl,
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

/**
 * Publish a single article to Ghost as a draft
 */
async function publishArticle(article: ParsedArticle, publishStatus: 'draft' | 'published' = 'draft') {
  try {
    console.log(`\n📝 Publishing: ${article.content.title}`);
    console.log(`   Slug: ${article.slug}`);

    // Replace product URLs with actual URLs
    let htmlContent = article.content.htmlContent;
    if (article.content.productUrl) {
      const actualUrl = getProductUrl(article.content.productUrl);

      // Replace the relative URL
      htmlContent = htmlContent.replace(
        new RegExp(article.content.productUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        actualUrl
      );

      // Also replace old educoach.com.au URLs
      htmlContent = htmlContent.replace(
        /https?:\/\/educoach\.com\.au\/products\/[^\s"')]+/g,
        actualUrl
      );

      // Also replace old educourse.com.au/products URLs
      htmlContent = htmlContent.replace(
        /https?:\/\/educourse\.com\.au\/products\/[^\s"')]+/g,
        actualUrl
      );

      console.log(`   Product URL: ${actualUrl}`);
    }

    // Prepare the post data
    const postData = {
      title: article.content.title,
      slug: article.slug,
      html: htmlContent,
      status: publishStatus,
      meta_title: article.metadata.metaTitle,
      meta_description: article.metadata.metaDescription,
      og_title: article.metadata.metaTitle,
      og_description: article.metadata.metaDescription,
      twitter_title: article.metadata.metaTitle,
      twitter_description: article.metadata.metaDescription,
      tags: article.metadata.tags?.filter(tag => tag && tag.length > 0).map(tag => ({ name: tag })) || [],
      feature_image: article.metadata.featuredImage?.startsWith('http')
        ? article.metadata.featuredImage
        : undefined,
      custom_excerpt: article.metadata.metaDescription,
    };

    // Create the post
    const result = await api.posts.add(postData, { source: 'html' });

    console.log(`   ✅ Success! Post ID: ${result.id}`);
    console.log(`   📊 Status: ${result.status}`);
    console.log(`   🔗 URL: ${result.url}`);

    return result;
  } catch (error: any) {
    console.error(`   ❌ Error publishing ${article.content.title}:`, error.message);
    if (error.context) {
      console.error('   Context:', error.context);
    }
    throw error;
  }
}

/**
 * Publish all articles from a specific category/folder
 */
async function publishCategory(
  categoryPath: string,
  publishStatus: 'draft' | 'published' = 'draft',
  limit?: number,
  skipFirst: boolean = false
) {
  console.log(`\n📂 Processing category: ${path.basename(categoryPath)}`);

  let contentFiles = getAllContentFiles(categoryPath);
  console.log(`   Found ${contentFiles.length} articles`);

  // Skip first article if requested (already manually published)
  if (skipFirst && contentFiles.length > 0) {
    contentFiles = contentFiles.slice(1);
    console.log(`   Skipping first article (already published)`);
    console.log(`   Processing ${contentFiles.length} remaining articles`);
  }

  const filesToProcess = limit ? contentFiles.slice(0, limit) : contentFiles;

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const filePath of filesToProcess) {
    try {
      const article = parseContentFile(filePath);
      if (!article) {
        console.log(`   ⚠️  Skipping ${path.basename(filePath)} (parsing failed)`);
        results.failed++;
        continue;
      }

      await publishArticle(article, publishStatus);
      results.successful++;

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      results.failed++;
      results.errors.push(`${path.basename(filePath)}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Publish all articles from all categories
 */
async function publishAll(publishStatus: 'draft' | 'published' = 'draft', limit?: number, skipFirst: boolean = false) {
  console.log('\n🚀 Starting Ghost Publishing Process');
  console.log(`   Status: ${publishStatus}`);
  console.log(`   Limit: ${limit || 'none (all articles)'}`);
  if (skipFirst) {
    console.log(`   Skipping: First article in each category (already published)`);
  }

  const contentDir = path.join(process.cwd(), 'content', 'blog', 'EduCourse Blog');

  const categories = [
    'ACER',
    'EduTest',
    'NSW Selective',
    'VIC Selective',
    'Year 5 NAPLAN',
    'Year 7 NAPLAN',
  ];

  const totalResults = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const category of categories) {
    const categoryPath = path.join(contentDir, category);

    try {
      const results = await publishCategory(categoryPath, publishStatus, limit, skipFirst);
      totalResults.successful += results.successful;
      totalResults.failed += results.failed;
      totalResults.errors.push(...results.errors);
    } catch (error) {
      console.error(`   ❌ Error processing category ${category}:`, error);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PUBLISHING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${totalResults.successful}`);
  console.log(`❌ Failed: ${totalResults.failed}`);

  if (totalResults.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    totalResults.errors.forEach(error => console.log(`   - ${error}`));
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
        // Test with a single article
        console.log('🧪 Test mode: Publishing first article only\n');
        await publishAll('draft', 1);
        break;

      case 'draft':
        // Publish all as drafts (skip first article)
        await publishAll('draft', undefined, true);
        break;

      case 'draft-all':
        // Publish ALL including first article
        console.log('⚠️  Publishing ALL articles including #1 (usually already published)\n');
        await publishAll('draft', undefined, false);
        break;

      case 'publish':
        // Publish all as published (skip first article)
        console.log('⚠️  WARNING: This will publish articles as LIVE (not drafts)');
        console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await publishAll('published', undefined, true);
        break;

      case 'category':
        // Publish specific category
        const categoryName = args[1];
        const status = (args[2] as 'draft' | 'published') || 'draft';
        if (!categoryName) {
          console.error('❌ Error: Please specify category name');
          console.error('   Example: npm run publish:ghost category "ACER" draft');
          process.exit(1);
        }
        const categoryPath = path.join(
          process.cwd(),
          'content',
          'blog',
          'EduCourse Blog',
          categoryName
        );
        await publishCategory(categoryPath, status);
        break;

      default:
        console.log('📖 Ghost Publishing Tool - Usage:\n');
        console.log('  npm run publish:ghost test           - Test with 1 article per category');
        console.log('  npm run publish:ghost draft          - Publish articles #2+ as drafts (skip #1)');
        console.log('  npm run publish:ghost draft-all      - Publish ALL including #1 as drafts');
        console.log('  npm run publish:ghost publish        - Publish articles #2+ as live (skip #1)');
        console.log('  npm run publish:ghost category "ACER" draft - Publish specific category\n');
        console.log('📝 Note: "draft" command skips the first article in each category');
        console.log('   (assumes you have already manually published article #1)\n');
        console.log('Available categories:');
        console.log('  - ACER (9 articles, will publish 8)');
        console.log('  - EduTest (9 articles, will publish 8)');
        console.log('  - NSW Selective (9 articles, will publish 8)');
        console.log('  - VIC Selective (1 article, will publish 0)');
        console.log('  - Year 5 NAPLAN (1 article, will publish 0)');
        console.log('  - Year 7 NAPLAN (4 articles, will publish 3)\n');
        console.log('  Total: 27 articles will be published (skipping 6 already done)\n');
        break;
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
