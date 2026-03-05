import GhostAdminAPI from '@tryghost/admin-api';
import { config } from 'dotenv';

config();

const api = new GhostAdminAPI({
  url: process.env.GHOST_API_URL || '',
  key: process.env.GHOST_ADMIN_API_KEY || '',
  version: 'v5.0',
});

async function checkPost() {
  try {
    // Get the first draft post
    const posts = await api.posts.browse({
      filter: 'status:draft',
      limit: 1,
      formats: ['html'],
    });

    if (posts && posts.length > 0) {
      const post = posts[0];
      console.log('📝 Post:', post.title);
      console.log('🔗 URL:', post.url);
      console.log('\n📊 Stats:');
      console.log('  HTML Length:', post.html?.length || 0);

      const buttonCount = (post.html?.match(/kg-btn/g) || []).length;
      console.log('  Buttons Found:', buttonCount);

      if (buttonCount === 0) {
        console.log('\n⚠️  NO BUTTONS FOUND IN GHOST!');
        console.log('\nFirst 1000 chars of HTML:');
        console.log(post.html?.substring(0, 1000));
      } else {
        console.log('\n✅ Buttons are in Ghost HTML');

        // Extract button HTML
        const buttonMatches = post.html?.match(/<div class="kg-card kg-button-card.*?<\/div>/gs);
        if (buttonMatches) {
          console.log(`\nFound ${buttonMatches.length} button blocks:\n`);
          buttonMatches.forEach((btn, i) => {
            console.log(`Button ${i + 1}:`);
            console.log(btn.substring(0, 200) + '...\n');
          });
        }
      }
    } else {
      console.log('No draft posts found');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkPost();
