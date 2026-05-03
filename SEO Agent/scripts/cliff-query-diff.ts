#!/usr/bin/env tsx
/**
 * Cliff query/page diff — what specifically did we lose?
 *
 * Compares GSC queries + pages during the SPIKE window (Mar 6-16)
 * vs the POST-CLIFF window (last 30 days). Shows queries/pages
 * we used to rank for and now don't, and biggest position drops.
 *
 * Run: npx tsx "SEO Agent/scripts/cliff-query-diff.ts"
 */

import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const GSC_SITE_URL = process.env.GSC_SITE_URL!;

const SPIKE_START = '2026-03-06';
const SPIKE_END = '2026-03-16';
const POST_START = '2026-04-03';
const POST_END = '2026-05-02';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

async function gscQuery(body: any): Promise<any> {
  const client = await auth.getClient();
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`;
  const res = await client.request({ url, method: 'POST', data: body });
  return res.data;
}

async function pullQueries(start: string, end: string) {
  const data = await gscQuery({
    startDate: start,
    endDate: end,
    dimensions: ['query'],
    rowLimit: 1000,
  });
  return (data.rows || []).map((r: any) => ({
    query: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.position,
  }));
}

async function pullPages(start: string, end: string) {
  const data = await gscQuery({
    startDate: start,
    endDate: end,
    dimensions: ['page'],
    rowLimit: 500,
  });
  return (data.rows || []).map((r: any) => ({
    page: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.position,
  }));
}

function fmt(n: number): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '-';
  return n >= 1000 ? n.toLocaleString('en-AU') : Math.round(n).toString();
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('Cliff Query/Page Diff');
  console.log(`Spike:      ${SPIKE_START} → ${SPIKE_END} (11 days)`);
  console.log(`Post-cliff: ${POST_START} → ${POST_END} (30 days)`);
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 Pulling spike-window queries + pages...');
  const [spikeQueries, spikePages] = await Promise.all([
    pullQueries(SPIKE_START, SPIKE_END),
    pullPages(SPIKE_START, SPIKE_END),
  ]);
  console.log(`✓ Spike: ${spikeQueries.length} queries, ${spikePages.length} pages`);

  console.log('📊 Pulling post-cliff queries + pages...');
  const [postQueries, postPages] = await Promise.all([
    pullQueries(POST_START, POST_END),
    pullPages(POST_START, POST_END),
  ]);
  console.log(`✓ Post:  ${postQueries.length} queries, ${postPages.length} pages\n`);

  // Build maps for lookup
  const postQueryMap = new Map(postQueries.map((q: any) => [q.query, q]));
  const postPageMap = new Map(postPages.map((p: any) => [p.page, p]));

  // Daily averages (so spike's 11 days vs post's 30 days are comparable)
  const spikeQueriesDaily = spikeQueries.map((q: any) => ({
    ...q,
    dailyImpressions: q.impressions / 11,
  }));

  // ===== Lost queries (had impressions during spike, gone or much lower now) =====
  const lostQueries = spikeQueriesDaily
    .map((sq: any) => {
      const pq: any = postQueryMap.get(sq.query);
      const postDailyImpressions = pq ? pq.impressions / 30 : 0;
      const dropDailyImp = sq.dailyImpressions - postDailyImpressions;
      const dropPct = sq.dailyImpressions ? (dropDailyImp / sq.dailyImpressions) * 100 : 0;
      return {
        query: sq.query,
        spikeImpDaily: sq.dailyImpressions,
        postImpDaily: postDailyImpressions,
        dropDailyImp,
        dropPct,
        spikePos: sq.position,
        postPos: pq ? pq.position : null,
        spikeClicks: sq.clicks,
        postClicks: pq ? pq.clicks : 0,
      };
    })
    .filter((r: any) => r.spikeImpDaily >= 2 && r.dropPct > 30) // meaningful volume + drop
    .sort((a: any, b: any) => b.dropDailyImp - a.dropDailyImp)
    .slice(0, 30);

  // ===== Position drops (queries still ranking, but worse) =====
  const positionDrops = spikeQueriesDaily
    .map((sq: any) => {
      const pq: any = postQueryMap.get(sq.query);
      if (!pq) return null;
      const posDelta = pq.position - sq.position; // positive = worse
      return {
        query: sq.query,
        spikePos: sq.position,
        postPos: pq.position,
        posDelta,
        spikeImp: sq.impressions,
        postImp: pq.impressions,
      };
    })
    .filter((r: any) => r && r.spikeImp >= 10 && r.posDelta >= 5)
    .sort((a: any, b: any) => b.posDelta - a.posDelta)
    .slice(0, 20);

  // ===== Lost pages =====
  const spikePagesDaily = spikePages.map((p: any) => ({ ...p, dailyImpressions: p.impressions / 11 }));
  const lostPages = spikePagesDaily
    .map((sp: any) => {
      const pp: any = postPageMap.get(sp.page);
      const postDailyImpressions = pp ? pp.impressions / 30 : 0;
      const dropDailyImp = sp.dailyImpressions - postDailyImpressions;
      const dropPct = sp.dailyImpressions ? (dropDailyImp / sp.dailyImpressions) * 100 : 0;
      return {
        page: sp.page,
        spikeImpDaily: sp.dailyImpressions,
        postImpDaily: postDailyImpressions,
        dropDailyImp,
        dropPct,
        spikePos: sp.position,
        postPos: pp ? pp.position : null,
      };
    })
    .filter((r: any) => r.spikeImpDaily >= 2 && r.dropPct > 30)
    .sort((a: any, b: any) => b.dropDailyImp - a.dropDailyImp)
    .slice(0, 20);

  // ===== Print summary to terminal =====
  console.log('═══════════════════════════════════════════');
  console.log('TOP 15 LOST QUERIES (biggest impression loss)');
  console.log('═══════════════════════════════════════════\n');
  console.log('Query                                       Spike/d  Now/d  Drop  SpikePos  NowPos');
  console.log('─'.repeat(95));
  for (const q of lostQueries.slice(0, 15)) {
    const truncQuery = q.query.padEnd(42).slice(0, 42);
    console.log(
      `${truncQuery}  ${fmt(q.spikeImpDaily).padStart(6)}  ${fmt(q.postImpDaily).padStart(5)}  ${(q.dropPct.toFixed(0) + '%').padStart(4)}  ${(q.spikePos?.toFixed(1) ?? '-').padStart(8)}  ${(q.postPos?.toFixed(1) ?? 'gone').padStart(6)}`
    );
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('TOP 10 LOST PAGES (biggest impression loss)');
  console.log('═══════════════════════════════════════════\n');
  for (const p of lostPages.slice(0, 10)) {
    const shortPage = p.page.replace('https://educourse.com.au', '').replace('https://insights.educourse.com.au', 'blog:').slice(0, 60);
    console.log(`  ${shortPage}`);
    console.log(`    Spike: ${fmt(p.spikeImpDaily)}/day @ pos ${p.spikePos?.toFixed(1)} → Now: ${fmt(p.postImpDaily)}/day @ pos ${p.postPos?.toFixed(1) ?? 'gone'} (-${p.dropPct.toFixed(0)}%)`);
  }

  // ===== Build markdown =====
  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join(process.cwd(), 'docs', '04-analysis');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `CLIFF_QUERY_DIFF_${today}.md`);

  let md = `# Cliff Query/Page Diff — ${today}

**Spike window:** ${SPIKE_START} → ${SPIKE_END} (11 days, peak traffic)
**Post-cliff window:** ${POST_START} → ${POST_END} (30 days, current baseline)
**Site:** ${GSC_SITE_URL}

All numbers are **daily averages** so the windows are comparable.

---

## Lost queries (top 30 by daily-impression drop)

These are search queries you used to get impressions for during the spike, but lost most or all of after the cliff.

| Query | Spike imp/day | Now imp/day | Drop | Spike position | Now position |
|---|---|---|---|---|---|
${lostQueries
  .map(
    (q: any) =>
      `| ${q.query} | ${fmt(q.spikeImpDaily)} | ${fmt(q.postImpDaily)} | ${q.dropPct.toFixed(0)}% | ${q.spikePos?.toFixed(1) ?? '-'} | ${q.postPos?.toFixed(1) ?? '**gone**'} |`
  )
  .join('\n')}

---

## Position drops on still-ranking queries (top 20)

These queries still appear, but at a worse position.

| Query | Spike pos | Now pos | Δ | Spike imp | Now imp |
|---|---|---|---|---|---|
${positionDrops
  .map((q: any) => `| ${q.query} | ${q.spikePos.toFixed(1)} | ${q.postPos.toFixed(1)} | +${q.posDelta.toFixed(1)} | ${q.spikeImp} | ${q.postImp} |`)
  .join('\n')}

---

## Lost pages (top 20 by daily-impression drop)

| Page | Spike imp/day | Now imp/day | Drop | Spike pos | Now pos |
|---|---|---|---|---|---|
${lostPages
  .map(
    (p: any) =>
      `| ${p.page.replace('https://educourse.com.au', '').replace('https://insights.educourse.com.au', 'blog:')} | ${fmt(p.spikeImpDaily)} | ${fmt(p.postImpDaily)} | ${p.dropPct.toFixed(0)}% | ${p.spikePos?.toFixed(1) ?? '-'} | ${p.postPos?.toFixed(1) ?? '**gone**'} |`
  )
  .join('\n')}

---

## How to read this

- **"Gone"** in the Now column = query/page no longer appears in GSC top 1000 results for the post-cliff window
- A query going from position 5 → position 35 is effectively gone (page 4 of search results)
- Look for **patterns**: are most lost queries on the same topic? Same page? Same intent (informational vs commercial)?

To re-run: \`npx tsx "SEO Agent/scripts/cliff-query-diff.ts"\`
`;

  fs.writeFileSync(outPath, md);
  console.log(`\n✓ Report written: ${outPath}`);
}

main().catch((err) => {
  console.error('\n❌ Failed:');
  console.error(err.message || err);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
