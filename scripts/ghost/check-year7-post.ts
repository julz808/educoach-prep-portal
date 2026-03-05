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
    filter: 'status:draft+slug:year-7-naplan-changes',
    limit: 1,
    formats: ['html'],
  });

  if (posts && posts.length > 0) {
    const html = posts[0].html || '';
    
    const buttonCards = (html.match(/kg-button-card/g) || []).length;
    const correctUrls = (html.match(/educourse\.com\.au\/course\/year-7-naplan/g) || []).length;
    
    console.log('Title:', posts[0].title);
    console.log('Button Count:', buttonCards);
    console.log('Correct URLs (educourse.com.au/course/year-7-naplan):', correctUrls);
    
    if (buttonCards === 3 && correctUrls >= 3) {
      console.log('\n✅ All good! 3 buttons with correct URLs');
    } else {
      console.log('\n⚠️  Issues found!');
    }
  } else {
    console.log('Post not found');
  }
}

checkPost();
