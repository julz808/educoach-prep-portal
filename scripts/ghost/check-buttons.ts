import GhostAdminAPI from '@tryghost/admin-api';
import { config } from 'dotenv';

config();

const api = new GhostAdminAPI({
  url: process.env.GHOST_API_URL || '',
  key: process.env.GHOST_ADMIN_API_KEY || '',
  version: 'v5.0',
});

async function checkPost() {
  const posts = await api.posts.browse({
    filter: 'status:draft+slug:acer-test-2026-whats-new-and-changed',
    limit: 1,
    formats: ['html'],
  });

  if (posts && posts.length > 0) {
    const html = posts[0].html || '';
    
    // Count button cards
    const buttonCards = (html.match(/kg-button-card/g) || []).length;
    const h2s = (html.match(/<h2>/g) || []).length;
    
    console.log('Title:', posts[0].title);
    console.log('H2 Count:', h2s);
    console.log('Button Count:', buttonCards);
    console.log('\nExpected: 3 buttons (after H2 #2, #5, and at end)');
    
    if (buttonCards < 3) {
      console.log('\n⚠️  Missing buttons!');
      
      // Show first 2000 chars to see structure
      console.log('\n📄 HTML Preview (first 2000 chars):');
      console.log(html.substring(0, 2000));
    } else {
      console.log('\n✅ All 3 buttons present!');
    }
  } else {
    console.log('Post not found');
  }
}

checkPost();
