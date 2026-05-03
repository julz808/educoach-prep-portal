#!/usr/bin/env tsx
/**
 * Quick check: how many Ghost blog posts are actually published?
 */

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const GHOST_API_URL = process.env.GHOST_API_URL!;
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY!;

if (!GHOST_API_URL || !GHOST_ADMIN_API_KEY) {
  console.error('Missing GHOST_API_URL or GHOST_ADMIN_API_KEY');
  process.exit(1);
}

function makeAdminToken(): string {
  const [id, secret] = GHOST_ADMIN_API_KEY.split(':');
  return jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/admin/',
  });
}

async function fetchPosts(status: 'published' | 'draft' | 'scheduled' | 'all') {
  const token = makeAdminToken();
  const filter = status === 'all' ? '' : `&filter=status:${status}`;
  const url = `${GHOST_API_URL.replace(/\/$/, '')}/ghost/api/admin/posts/?limit=all${filter}&fields=id,title,slug,status,published_at,visibility&order=published_at%20DESC`;
  const res = await fetch(url, {
    headers: { Authorization: `Ghost ${token}`, 'Accept-Version': 'v5.0' },
  });
  if (!res.ok) {
    console.error(`Ghost API error: ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }
  const data = await res.json();
  return data.posts || [];
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('Ghost Blog Post Inventory');
  console.log(`URL: ${GHOST_API_URL}`);
  console.log('═══════════════════════════════════════════\n');

  const all = await fetchPosts('all');
  const published = all.filter((p: any) => p.status === 'published');
  const drafts = all.filter((p: any) => p.status === 'draft');
  const scheduled = all.filter((p: any) => p.status === 'scheduled');

  console.log(`Total posts:      ${all.length}`);
  console.log(`✅ Published:     ${published.length}`);
  console.log(`📝 Drafts:        ${drafts.length}`);
  console.log(`⏰ Scheduled:     ${scheduled.length}`);
  console.log('');

  // Recently published
  const recent = published
    .filter((p: any) => p.published_at)
    .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 15);

  console.log('Most recently published (top 15):');
  console.log('─'.repeat(90));
  for (const p of recent) {
    const date = p.published_at?.slice(0, 10) || '-';
    const vis = p.visibility !== 'public' ? ` [${p.visibility}]` : '';
    console.log(`  ${date}  ${p.slug}${vis}`);
  }
  console.log('');

  // Posts published since March 1
  const sinceMarch = published.filter(
    (p: any) => p.published_at && new Date(p.published_at) >= new Date('2026-03-01')
  );
  console.log(`📅 Published since 2026-03-01: ${sinceMarch.length}`);

  // Public vs members-only check (members-only won't be indexed)
  const nonPublic = published.filter((p: any) => p.visibility !== 'public');
  if (nonPublic.length > 0) {
    console.log(`\n⚠️  ${nonPublic.length} published posts are NOT public (visibility != 'public') — these won't be indexed by Google:`);
    for (const p of nonPublic.slice(0, 10)) {
      console.log(`     [${p.visibility}] ${p.slug}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
