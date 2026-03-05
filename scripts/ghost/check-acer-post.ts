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
    const h2s = (html.match(/<h2>/g) || []).length;
    const ctas = (html.match(/━━━━━━━━━━━━━━━━━━━━/g) || []).length;

    console.log('Title:', posts[0].title);
    console.log('H2 Count:', h2s);
    console.log('CTA Count:', ctas);
    console.log('\nExpected: 3 CTAs (after H2 #2, #5, and at end)');

    if (ctas < 3) {
      console.log('\n⚠️  Missing CTAs!');
      console.log('\nH2 positions:');
      const h2Matches = html.match(/<h2>.*?<\/h2>/g);
      if (h2Matches) {
        h2Matches.forEach((h2, i) => {
          console.log(`  ${i + 1}. ${h2.replace(/<\/?h2>/g, '')}`);
        });
      }
    } else {
      console.log('\n✅ All 3 CTAs present!');
    }
  } else {
    console.log('Post not found');
  }
}

checkPost();
