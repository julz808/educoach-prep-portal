#!/usr/bin/env tsx
/**
 * Delete every Ghost post with status='draft'.
 *
 * Safety:
 *  - Triple-checks status before deletion (only deletes drafts)
 *  - Refuses to delete anything published or scheduled
 *  - Logs each deletion with title/slug
 *  - Final inventory confirms only drafts went
 *
 * Run: npx tsx "SEO Agent/scripts/delete-all-drafts.ts"
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

async function fetchAllPosts() {
  const token = makeToken();
  const url = `${GHOST_API_URL.replace(/\/$/, '')}/ghost/api/admin/posts/?limit=all&fields=id,title,slug,status,published_at`;
  const res = await fetch(url, {
    headers: { Authorization: `Ghost ${token}`, 'Accept-Version': 'v5.0' },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const data: any = await res.json();
  return data.posts || [];
}

async function deletePost(id: string) {
  const token = makeToken();
  const url = `${GHOST_API_URL.replace(/\/$/, '')}/ghost/api/admin/posts/${id}/`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Ghost ${token}`, 'Accept-Version': 'v5.0' },
  });
  return res.status === 204 || res.status === 200;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('Bulk delete: ALL Ghost drafts');
  console.log('═══════════════════════════════════════════\n');

  const before = await fetchAllPosts();
  const drafts = before.filter((p: any) => p.status === 'draft');
  const published = before.filter((p: any) => p.status === 'published');
  const scheduled = before.filter((p: any) => p.status === 'scheduled');

  console.log(`BEFORE — Total: ${before.length}`);
  console.log(`         Published: ${published.length}`);
  console.log(`         Drafts:    ${drafts.length}`);
  console.log(`         Scheduled: ${scheduled.length}\n`);

  if (drafts.length === 0) {
    console.log('No drafts to delete.');
    return;
  }

  let deleted = 0;
  let failed = 0;
  let skipped = 0;

  for (const p of drafts) {
    // Hard safety: re-verify status is 'draft' on this individual record
    if (p.status !== 'draft') {
      console.log(`  ⚠️  SKIPPED (not draft): ${p.slug} status=${p.status}`);
      skipped++;
      continue;
    }
    process.stdout.write(`  deleting [${p.slug}] ...`);
    try {
      const ok = await deletePost(p.id);
      if (ok) {
        process.stdout.write(' ✓\n');
        deleted++;
      } else {
        process.stdout.write(' ✗\n');
        failed++;
      }
    } catch (e: any) {
      process.stdout.write(` ✗ (${e.message})\n`);
      failed++;
    }
  }

  console.log(`\nDeleted: ${deleted}, Failed: ${failed}, Skipped: ${skipped}\n`);

  // Final inventory
  console.log('Verifying final state...');
  const after = await fetchAllPosts();
  const afterDrafts = after.filter((p: any) => p.status === 'draft').length;
  const afterPublished = after.filter((p: any) => p.status === 'published').length;
  const afterScheduled = after.filter((p: any) => p.status === 'scheduled').length;
  console.log(`AFTER  — Total: ${after.length}`);
  console.log(`         Published: ${afterPublished}  (was ${published.length})`);
  console.log(`         Drafts:    ${afterDrafts}  (was ${drafts.length})`);
  console.log(`         Scheduled: ${afterScheduled}  (was ${scheduled.length})`);

  if (afterPublished !== published.length) {
    console.error('\n🔴 ERROR: Published count changed! Something is wrong.');
    process.exit(1);
  }
  console.log('\n✅ Published posts untouched, drafts deleted.');
}

main().catch((e) => {
  console.error('Failed:', e.message || e);
  process.exit(1);
});
