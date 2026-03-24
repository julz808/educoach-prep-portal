import GhostAdminAPI from '@tryghost/admin-api';
import { config } from 'dotenv';

config();

export const ghostApi = new GhostAdminAPI({
  url: process.env.GHOST_API_URL || '',
  key: process.env.GHOST_ADMIN_API_KEY || '',
  version: 'v5.0',
});

export interface GhostPost {
  id?: string;
  title: string;
  slug: string;
  html: string;
  status: 'draft' | 'published';
  meta_title?: string;
  meta_description?: string;
  tags?: Array<{ name: string }>;
  custom_excerpt?: string;
}

export async function createGhostPost(post: GhostPost): Promise<any> {
  return await ghostApi.posts.add(post, { source: 'html' });
}

export async function getAllGhostPosts(filter?: string): Promise<any[]> {
  return await ghostApi.posts.browse({ limit: 'all', filter });
}

export async function getGhostPostBySlug(slug: string): Promise<any | null> {
  const posts = await ghostApi.posts.browse({ filter: `slug:${slug}`, limit: 1 });
  return posts.length > 0 ? posts[0] : null;
}
