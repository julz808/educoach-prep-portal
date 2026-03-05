import GhostAdminAPI from '@tryghost/admin-api';
import { config } from 'dotenv';

config();

const api = new GhostAdminAPI({
  url: process.env.GHOST_API_URL || '',
  key: process.env.GHOST_ADMIN_API_KEY || '',
  version: 'v5.0',
});

async function viewPost() {
  const posts = await api.posts.browse({
    filter: 'status:draft',
    limit: 1,
    formats: ['html'],
  });

  if (posts && posts.length > 0) {
    console.log('Full HTML:\n');
    console.log(posts[0].html);
  }
}

viewPost();
