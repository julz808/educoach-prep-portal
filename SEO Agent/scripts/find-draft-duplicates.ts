#!/usr/bin/env tsx
/**
 * Find drafts that overlap with already-published posts.
 * Strips the "-2" suffix and any year suffix to find topic matches.
 */

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const GHOST_API_URL = process.env.GHOST_API_URL!;
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY!;

function makeToken(): string {
  const [id, secret] = GHOST_ADMIN_API_KEY.split(':');
  return jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/admin/',
  });
}

async function fetchPosts() {
  const token = makeToken();
  const url = `${GHOST_API_URL.replace(/\/$/, '')}/ghost/api/admin/posts/?limit=all&fields=id,title,slug,status,published_at,visibility,reading_time&order=slug%20ASC`;
  const res = await fetch(url, {
    headers: { Authorization: `Ghost ${token}`, 'Accept-Version': 'v5.0' },
  });
  const data = await res.json();
  return data.posts || [];
}

// Normalize a slug to a topic key — strip "-2", "-2026", "-2027"
function topicKey(slug: string): string {
  return slug
    .replace(/-2$/, '')
    .replace(/-202[3-9]$/, '')
    .replace(/-202[3-9]-/g, '-')
    .toLowerCase();
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('Draft vs Published — duplicate detection');
  console.log('═══════════════════════════════════════════\n');

  const all = await fetchPosts();
  const published = all.filter((p: any) => p.status === 'published');
  const drafts = all.filter((p: any) => p.status === 'draft');

  console.log(`Published: ${published.length}, Drafts: ${drafts.length}\n`);

  // Build a map of topic key → published posts
  const publishedByTopic = new Map<string, any[]>();
  for (const p of published) {
    const key = topicKey(p.slug);
    if (!publishedByTopic.has(key)) publishedByTopic.set(key, []);
    publishedByTopic.get(key)!.push(p);
  }

  // Categorize drafts
  const exactDup: any[] = [];   // draft slug exactly matches a published slug stripped of -2
  const fuzzyDup: any[] = [];   // draft topic key matches a published topic key
  const newTopics: any[] = [];  // no match found

  for (const d of drafts) {
    const key = topicKey(d.slug);
    const matches = publishedByTopic.get(key);
    if (matches && matches.length > 0) {
      // Check if it's the exact "-2 of an existing post" pattern
      const stripped = d.slug.replace(/-2$/, '');
      const exactMatch = matches.find((p: any) => p.slug === stripped);
      if (exactMatch) {
        exactDup.push({ draft: d, published: exactMatch });
      } else {
        fuzzyDup.push({ draft: d, matches });
      }
    } else {
      newTopics.push(d);
    }
  }

  console.log('━━━ A) DRAFTS THAT ARE V2 OF AN ALREADY-PUBLISHED POST ━━━');
  console.log(`(${exactDup.length} drafts — publishing these creates duplicate-content risk)\n`);
  for (const { draft, published: pub } of exactDup) {
    const pubDate = pub.published_at?.slice(0, 10) || '?';
    console.log(`  DRAFT:     ${draft.slug}`);
    console.log(`             "${draft.title}"`);
    console.log(`  ALREADY:   ${pub.slug}  (published ${pubDate})`);
    console.log(`             "${pub.title}"`);
    console.log('');
  }

  if (fuzzyDup.length > 0) {
    console.log('\n━━━ B) DRAFTS THAT MAY OVERLAP (manual check) ━━━\n');
    for (const { draft, matches } of fuzzyDup) {
      console.log(`  DRAFT:    ${draft.slug}  "${draft.title}"`);
      for (const m of matches) {
        console.log(`  similar:  ${m.slug}  "${m.title}"`);
      }
      console.log('');
    }
  }

  console.log(`\n━━━ C) GENUINELY NEW TOPICS (safe to publish) ━━━`);
  console.log(`(${newTopics.length} drafts — no overlap with published content)\n`);
  for (const d of newTopics) {
    console.log(`  ${d.slug}`);
    console.log(`     "${d.title}"`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`  V2 of published (DON'T just publish — replace):  ${exactDup.length}`);
  console.log(`  Possible overlap (manual review):                 ${fuzzyDup.length}`);
  console.log(`  Genuinely new topics (safe to publish):           ${newTopics.length}`);
}

main().catch(console.error);
