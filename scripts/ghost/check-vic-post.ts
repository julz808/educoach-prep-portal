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
    filter: 'status:draft+slug:vic-selective-changes',
    limit: 1,
    formats: ['html'],
  });

  if (posts && posts.length > 0) {
    const html = posts[0].html || '';
    
    // Count button cards
    const buttonCards = (html.match(/kg-button-card/g) || []).length;
    
    // Check URLs
    const correctUrls = (html.match(/educourse\.com\.au\/course\/vic-selective/g) || []).length;
    const oldUrls = (html.match(/educoach\.com\.au\/products/g) || []).length;
    
    console.log('Title:', posts[0].title);
    console.log('Button Count:', buttonCards);
    console.log('Correct URLs (educourse.com.au/course/):', correctUrls);
    console.log('Old URLs (educoach.com.au/products/):', oldUrls);
    
    if (buttonCards === 3 && oldUrls === 0) {
      console.log('\n✅ All good! 3 buttons with correct URLs');
    } else {
      console.log('\n⚠️  Issues found!');
      console.log('\nFirst button HTML:');
      const buttonMatch = html.match(/<div class="kg-card kg-button-card[^>]*>.*?<\/div>/);
      if (buttonMatch) {
        console.log(buttonMatch[0]);
      }
    }
  } else {
    console.log('Post not found');
  }
}

checkPost();
