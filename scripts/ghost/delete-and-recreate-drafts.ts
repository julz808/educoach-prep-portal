import GhostAdminAPI from '@tryghost/admin-api';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Ghost Admin API
const api = new GhostAdminAPI({
  url: process.env.GHOST_API_URL || '',
  key: process.env.GHOST_ADMIN_API_KEY || '',
  version: 'v5.0',
});

async function deleteAllPublishedPosts() {
  console.log('🗑️  Deleting all published posts...\n');

  try {
    // Get all published posts
    const posts = await api.posts.browse({
      limit: 'all',
      filter: 'status:published',
    });

    console.log(`Found ${posts.length} published posts to delete\n`);

    let deleted = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        console.log(`   Deleting: ${post.title}`);
        await api.posts.delete({ id: post.id });
        deleted++;
        console.log(`   ✅ Deleted`);
      } catch (error: any) {
        failed++;
        console.log(`   ❌ Failed: ${error.message}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Deleted: ${deleted}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60) + '\n');

    return { deleted, failed };
  } catch (error: any) {
    console.error('❌ Error deleting posts:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔧 Delete All Published Posts');
  console.log('==============================\n');

  // Check for required environment variables
  if (!process.env.GHOST_API_URL || !process.env.GHOST_ADMIN_API_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   GHOST_API_URL');
    console.error('   GHOST_ADMIN_API_KEY');
    process.exit(1);
  }

  await deleteAllPublishedPosts();
}

main().catch(console.error);
