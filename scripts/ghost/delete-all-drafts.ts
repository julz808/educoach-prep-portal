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

/**
 * Delete all draft posts from Ghost
 */
async function deleteAllDrafts() {
  try {
    console.log('🗑️  Fetching all draft posts...\n');

    // Fetch all drafts
    const posts = await api.posts.browse({
      filter: 'status:draft',
      limit: 'all',
    });

    if (!posts || posts.length === 0) {
      console.log('✅ No draft posts found. Nothing to delete.\n');
      return;
    }

    console.log(`📋 Found ${posts.length} draft posts to delete:\n`);

    // List all drafts
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.title || 'Untitled'} (ID: ${post.id})`);
    });

    console.log('\n⚠️  WARNING: This will permanently delete all drafts!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Deleting drafts...\n');

    // Delete each post
    for (const post of posts) {
      try {
        await api.posts.delete({ id: post.id });
        console.log(`   ✅ Deleted: ${post.title || 'Untitled'}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to delete "${post.title}": ${error.message}`);
      }
    }

    console.log('\n✅ All drafts deleted successfully!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Check for required environment variables
if (!process.env.GHOST_API_URL || !process.env.GHOST_ADMIN_API_KEY) {
  console.error('❌ Error: Missing Ghost API credentials');
  console.error('   Please set GHOST_API_URL and GHOST_ADMIN_API_KEY in your .env file');
  process.exit(1);
}

// Run the script
deleteAllDrafts();
