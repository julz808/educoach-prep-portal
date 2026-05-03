#!/usr/bin/env tsx
/**
 * SEO + GA4 Audit — Last 30 Days
 *
 * Pulls organic-search performance from GA4 and Search Console,
 * writes a markdown report to docs/04-analysis/SEO_AUDIT_<date>.md
 *
 * Auth: Application Default Credentials (gcloud auth application-default login)
 * No key file needed.
 *
 * Run: npx tsx "SEO Agent/scripts/audit-30-day.ts"
 */

import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GSC_SITE_URL = process.env.GSC_SITE_URL;

if (!GA4_PROPERTY_ID || !GSC_SITE_URL) {
  console.error('Missing GA4_PROPERTY_ID or GSC_SITE_URL in .env');
  process.exit(1);
}

const auth = new GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

const today = new Date();
const endDate = formatDate(addDays(today, -1)); // GSC has 1-2 day lag; GA4 same-day available
const startDate = formatDate(addDays(today, -30));
const prevEndDate = formatDate(addDays(today, -31));
const prevStartDate = formatDate(addDays(today, -60));

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function pct(n: number, d: number): string {
  if (!d) return '0%';
  return `${((n / d) * 100).toFixed(1)}%`;
}
function fmt(n: number | string | undefined): string {
  if (n === undefined || n === null) return '-';
  if (typeof n === 'string') n = Number(n);
  if (Number.isNaN(n)) return '-';
  if (n >= 1000) return n.toLocaleString('en-AU');
  return n % 1 === 0 ? n.toString() : n.toFixed(2);
}
function delta(curr: number, prev: number): string {
  if (!prev) return curr ? '+∞' : '0';
  const d = ((curr - prev) / prev) * 100;
  const sign = d >= 0 ? '+' : '';
  return `${sign}${d.toFixed(1)}%`;
}

// =====================================================
// GA4 helpers
// =====================================================
async function ga4RunReport(body: any): Promise<any> {
  const client = await auth.getClient();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;
  const res = await client.request({ url, method: 'POST', data: body });
  return res.data;
}

async function pullGA4ChannelBreakdown(start: string, end: string) {
  return ga4RunReport({
    dateRanges: [{ startDate: start, endDate: end }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'engagedSessions' },
      { name: 'averageSessionDuration' },
      { name: 'keyEvents' },
    ],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });
}

async function pullGA4OrganicLandingPages(start: string, end: string) {
  return ga4RunReport({
    dateRanges: [{ startDate: start, endDate: end }],
    dimensions: [{ name: 'landingPagePlusQueryString' }],
    metrics: [
      { name: 'sessions' },
      { name: 'engagedSessions' },
      { name: 'keyEvents' },
      { name: 'averageSessionDuration' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'sessionDefaultChannelGroup',
        stringFilter: { matchType: 'EXACT', value: 'Organic Search' },
      },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 25,
  });
}

async function pullGA4ConversionEvents(start: string, end: string) {
  return ga4RunReport({
    dateRanges: [{ startDate: start, endDate: end }],
    dimensions: [{ name: 'eventName' }, { name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'isKeyEvent',
        stringFilter: { matchType: 'EXACT', value: 'true' },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 50,
  });
}

async function pullGA4Totals(start: string, end: string) {
  return ga4RunReport({
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'engagedSessions' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
    ],
  });
}

// =====================================================
// Search Console helpers
// =====================================================
async function gscQuery(body: any): Promise<any> {
  const client = await auth.getClient();
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    GSC_SITE_URL!
  )}/searchAnalytics/query`;
  const res = await client.request({ url, method: 'POST', data: body });
  return res.data;
}

async function pullGSCTotals(start: string, end: string) {
  return gscQuery({
    startDate: start,
    endDate: end,
    dimensions: [],
  });
}

async function pullGSCTopQueries(start: string, end: string, limit = 50) {
  return gscQuery({
    startDate: start,
    endDate: end,
    dimensions: ['query'],
    rowLimit: limit,
  });
}

async function pullGSCTopPages(start: string, end: string, limit = 25) {
  return gscQuery({
    startDate: start,
    endDate: end,
    dimensions: ['page'],
    rowLimit: limit,
  });
}

async function pullGSCQuickWins(start: string, end: string, limit = 100) {
  // Pull broad set, filter in code for position 4-20 with decent impressions
  const data = await gscQuery({
    startDate: start,
    endDate: end,
    dimensions: ['query'],
    rowLimit: 1000,
  });
  const rows = (data.rows || [])
    .filter((r: any) => r.position >= 4 && r.position <= 20 && r.impressions >= 50)
    .sort((a: any, b: any) => b.impressions - a.impressions)
    .slice(0, limit);
  return { rows };
}

async function pullGSCCountrySplit(start: string, end: string) {
  return gscQuery({
    startDate: start,
    endDate: end,
    dimensions: ['country'],
    rowLimit: 10,
  });
}

// =====================================================
// Main
// =====================================================
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('SEO + GA4 Audit — Last 30 Days');
  console.log(`Window: ${startDate} → ${endDate}`);
  console.log(`Comparing to: ${prevStartDate} → ${prevEndDate}`);
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 Pulling GA4 data...');
  const [ga4Totals, ga4TotalsPrev, ga4Channels, ga4ChannelsPrev, ga4Landing, ga4Conversions] =
    await Promise.all([
      pullGA4Totals(startDate, endDate),
      pullGA4Totals(prevStartDate, prevEndDate),
      pullGA4ChannelBreakdown(startDate, endDate),
      pullGA4ChannelBreakdown(prevStartDate, prevEndDate),
      pullGA4OrganicLandingPages(startDate, endDate),
      pullGA4ConversionEvents(startDate, endDate),
    ]);
  console.log('✓ GA4 done');

  console.log('🔍 Pulling Search Console data...');
  const [gscTotals, gscTotalsPrev, gscQueries, gscPages, gscQuickWins, gscCountries] =
    await Promise.all([
      pullGSCTotals(startDate, endDate),
      pullGSCTotals(prevStartDate, prevEndDate),
      pullGSCTopQueries(startDate, endDate),
      pullGSCTopPages(startDate, endDate),
      pullGSCQuickWins(startDate, endDate),
      pullGSCCountrySplit(startDate, endDate),
    ]);
  console.log('✓ Search Console done\n');

  // ===== Build report =====
  const md = buildReport({
    ga4Totals,
    ga4TotalsPrev,
    ga4Channels,
    ga4ChannelsPrev,
    ga4Landing,
    ga4Conversions,
    gscTotals,
    gscTotalsPrev,
    gscQueries,
    gscPages,
    gscQuickWins,
    gscCountries,
  });

  const outDir = path.join(process.cwd(), 'docs', '04-analysis');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `SEO_AUDIT_${formatDate(today)}.md`);
  fs.writeFileSync(outPath, md);

  console.log(`✓ Report written: ${outPath}`);
  console.log(`   ${md.length.toLocaleString()} chars, ${md.split('\n').length} lines`);
}

function buildReport(d: any): string {
  // Totals
  const t = d.ga4Totals.rows?.[0]?.metricValues || [];
  const tp = d.ga4TotalsPrev.rows?.[0]?.metricValues || [];
  const sessions = Number(t[0]?.value || 0);
  const sessionsPrev = Number(tp[0]?.value || 0);
  const users = Number(t[1]?.value || 0);
  const usersPrev = Number(tp[1]?.value || 0);
  const newUsers = Number(t[2]?.value || 0);
  const engagedSessions = Number(t[3]?.value || 0);
  const avgDuration = Number(t[4]?.value || 0);
  const pageViews = Number(t[5]?.value || 0);
  const bounceRate = Number(t[6]?.value || 0);

  // Channel rows
  const channels = (d.ga4Channels.rows || []).map((r: any) => ({
    name: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
    engagedSessions: Number(r.metricValues[2].value),
    avgDuration: Number(r.metricValues[3].value),
    keyEvents: Number(r.metricValues[4].value),
  }));
  const channelsPrev = new Map(
    (d.ga4ChannelsPrev.rows || []).map((r: any) => [
      r.dimensionValues[0].value,
      Number(r.metricValues[0].value),
    ])
  );
  const organic = channels.find((c: any) => c.name === 'Organic Search');
  const organicPrev = Number(channelsPrev.get('Organic Search') || 0);
  const paid = channels.find((c: any) => c.name === 'Paid Search');

  // GSC totals
  const gt = d.gscTotals.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const gtp = d.gscTotalsPrev.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  // Helper: generate the verdict
  let verdict = '';
  if (gt.impressions === 0) {
    verdict = '🔴 **No impressions in Search Console — site is not appearing in Google search at all for this window.** Investigate indexation status urgently.';
  } else if (gt.clicks === 0) {
    verdict = '🔴 **Impressions but zero clicks** — site appears in search but no one clicks. Likely too-low ranking positions or weak titles/descriptions.';
  } else if (organic && organic.sessions > 0) {
    const organicShare = (organic.sessions / sessions) * 100;
    const organicGrowth = organicPrev ? ((organic.sessions - organicPrev) / organicPrev) * 100 : 0;
    if (organicShare > 30 && organicGrowth > 0) {
      verdict = `✅ **Organic is working.** ${organic.sessions.toLocaleString()} organic sessions = ${organicShare.toFixed(1)}% of all traffic, growing ${organicGrowth.toFixed(1)}% vs previous 30 days.`;
    } else if (organicShare > 30) {
      verdict = `🟡 **Organic is established but flat/declining.** ${organicShare.toFixed(1)}% of traffic but ${organicGrowth.toFixed(1)}% vs previous period.`;
    } else if (organicGrowth > 20) {
      verdict = `🟡 **Organic is small but growing fast.** Only ${organicShare.toFixed(1)}% of traffic but ${organicGrowth.toFixed(1)}% growth — early signal worth investing in.`;
    } else {
      verdict = `🔴 **Organic is underperforming.** Only ${organicShare.toFixed(1)}% of traffic, ${organicGrowth.toFixed(1)}% vs previous period. Heavily reliant on paid.`;
    }
  } else {
    verdict = '🔴 **Zero organic sessions in GA4 despite GSC data** — likely a tracking gap. Verify GA4 is firing on landing pages.';
  }

  let md = `# SEO + GA4 Audit — ${formatDate(today)}

**Window:** ${startDate} → ${endDate} (last 30 days)
**Comparison:** ${prevStartDate} → ${prevEndDate} (previous 30 days)
**Site:** ${GSC_SITE_URL}
**GA4 Property:** ${GA4_PROPERTY_ID}

---

## TL;DR

${verdict}

| Metric | Last 30d | Prev 30d | Δ |
|---|---|---|---|
| Total sessions (all sources) | ${fmt(sessions)} | ${fmt(sessionsPrev)} | ${delta(sessions, sessionsPrev)} |
| Total users | ${fmt(users)} | ${fmt(usersPrev)} | ${delta(users, usersPrev)} |
| Organic sessions | ${fmt(organic?.sessions || 0)} | ${fmt(organicPrev)} | ${delta(organic?.sessions || 0, organicPrev)} |
| GSC clicks | ${fmt(gt.clicks)} | ${fmt(gtp.clicks)} | ${delta(gt.clicks, gtp.clicks)} |
| GSC impressions | ${fmt(gt.impressions)} | ${fmt(gtp.impressions)} | ${delta(gt.impressions, gtp.impressions)} |
| GSC avg position | ${gt.position?.toFixed(1) || '-'} | ${gtp.position?.toFixed(1) || '-'} | ${delta(gtp.position || 0, gt.position || 0)} (lower = better) |
| GSC CTR | ${(gt.ctr * 100).toFixed(2)}% | ${(gtp.ctr * 100).toFixed(2)}% | - |

---

## 1. Traffic source breakdown (GA4)

Where your traffic actually comes from. The "Organic Search" row is the SEO answer.

| Channel | Sessions | Users | Engaged | Engagement rate | Avg duration | Conversions | vs Prev |
|---|---|---|---|---|---|---|---|
${channels
  .map((c: any) => {
    const prevSessions = Number(channelsPrev.get(c.name) || 0);
    return `| **${c.name}** | ${fmt(c.sessions)} | ${fmt(c.users)} | ${fmt(c.engagedSessions)} | ${pct(c.engagedSessions, c.sessions)} | ${(c.avgDuration / 60).toFixed(1)}m | ${fmt(c.keyEvents)} | ${delta(c.sessions, prevSessions)} |`;
  })
  .join('\n')}

`;

  // Funnel context
  if (organic && paid) {
    const organicConvRate = pct(organic.keyEvents, organic.sessions);
    const paidConvRate = pct(paid.keyEvents, paid.sessions);
    md += `**Organic vs Paid efficiency:** Organic converts at ${organicConvRate}, Paid at ${paidConvRate}. `;
    if (organic.keyEvents / organic.sessions > paid.keyEvents / paid.sessions) {
      md += `Organic visitors are higher-intent — invest more in SEO.\n\n`;
    } else {
      md += `Paid visitors convert better right now — but SEO is cheaper at scale once it works.\n\n`;
    }
  }

  md += `---

## 2. Search Console — what Google sees

### Top search queries (impressions)

| Query | Impressions | Clicks | CTR | Avg position |
|---|---|---|---|---|
${(d.gscQueries.rows || [])
  .slice(0, 30)
  .map(
    (r: any) =>
      `| ${r.keys[0]} | ${fmt(r.impressions)} | ${fmt(r.clicks)} | ${(r.ctr * 100).toFixed(1)}% | ${r.position.toFixed(1)} |`
  )
  .join('\n')}

### Top landing pages from organic search

| Page | Impressions | Clicks | CTR | Avg position |
|---|---|---|---|---|
${(d.gscPages.rows || [])
  .slice(0, 20)
  .map(
    (r: any) =>
      `| ${r.keys[0].replace('https://educourse.com.au', '').replace('https://insights.educourse.com.au', 'blog:')} | ${fmt(r.impressions)} | ${fmt(r.clicks)} | ${(r.ctr * 100).toFixed(1)}% | ${r.position.toFixed(1)} |`
  )
  .join('\n')}

### 🎯 Quick-win queries (ranking 4-20, ≥50 impressions)

These are queries where you're *almost* on page 1. Small SEO improvements here typically yield the biggest click gains.

| Query | Impressions | Clicks | CTR | Position |
|---|---|---|---|---|
${(d.gscQuickWins.rows || [])
  .slice(0, 25)
  .map(
    (r: any) =>
      `| ${r.keys[0]} | ${fmt(r.impressions)} | ${fmt(r.clicks)} | ${(r.ctr * 100).toFixed(1)}% | ${r.position.toFixed(1)} |`
  )
  .join('\n') || '(none)'}

### Country split

| Country | Impressions | Clicks |
|---|---|---|
${(d.gscCountries.rows || [])
  .map((r: any) => `| ${r.keys[0]} | ${fmt(r.impressions)} | ${fmt(r.clicks)} |`)
  .join('\n')}

---

## 3. Top landing pages from organic (GA4 view)

What organic visitors actually do once they land — this is the bridge from rankings to revenue.

| Landing page | Sessions | Engaged | Engagement rate | Conversions | Avg duration |
|---|---|---|---|---|---|
${(d.ga4Landing.rows || [])
  .map((r: any) => {
    const page = r.dimensionValues[0].value;
    const sess = Number(r.metricValues[0].value);
    const eng = Number(r.metricValues[1].value);
    const conv = Number(r.metricValues[2].value);
    const dur = Number(r.metricValues[3].value);
    return `| ${page} | ${fmt(sess)} | ${fmt(eng)} | ${pct(eng, sess)} | ${fmt(conv)} | ${(dur / 60).toFixed(1)}m |`;
  })
  .join('\n')}

---

## 4. Conversion events by channel

What's actually firing as a "key event" in GA4, broken down by source.

| Event | Channel | Count | Users |
|---|---|---|---|
${(d.ga4Conversions.rows || [])
  .map(
    (r: any) =>
      `| ${r.dimensionValues[0].value} | ${r.dimensionValues[1].value} | ${fmt(r.metricValues[0].value)} | ${fmt(r.metricValues[1].value)} |`
  )
  .join('\n')}

---

## 5. Recommendations

`;

  // Build recommendations programmatically
  const recs: string[] = [];

  if (gt.impressions === 0) {
    recs.push('🔴 **CRITICAL:** Zero impressions in GSC — site may be deindexed. Check `https://www.google.com/search?q=site:educourse.com.au` and GSC Coverage report.');
  }

  if (gt.position && gt.position > 20) {
    recs.push(`🔴 Avg search position is **${gt.position.toFixed(1)}** — most users never see results past position 10. Focus on improving rankings for the queries with highest impressions.`);
  }

  if (gt.ctr && gt.ctr < 0.02) {
    recs.push(`🟡 GSC CTR is **${(gt.ctr * 100).toFixed(2)}%** (industry avg ~3-5%). Likely cause: poor SERP titles/descriptions or low-position rankings. Audit page titles for top-impression queries below.`);
  }

  if ((d.gscQuickWins.rows || []).length >= 5) {
    recs.push(`🟢 You have **${(d.gscQuickWins.rows || []).length} quick-win queries** ranking 4-20 with real impression volume. Each one moved up to position 1-3 typically multiplies clicks 5-10x. Prioritise on-page SEO for the pages targeting these queries.`);
  }

  if (organic && paid && organic.sessions / sessions < 0.2 && paid.sessions / sessions > 0.4) {
    recs.push(`🟡 You're **${pct(paid.sessions, sessions)} reliant on Paid Search**. If you stop paying, traffic collapses. SEO investment is the hedge.`);
  }

  if (organic && organic.keyEvents === 0 && organic.sessions > 50) {
    recs.push(`🔴 **${organic.sessions} organic sessions but ZERO conversions** — either organic visitors aren't converting (CRO problem on landing pages) or conversion events aren't firing for organic traffic (tracking problem).`);
  }

  // Insights subdomain check
  const blogPages = (d.gscPages.rows || []).filter((r: any) => r.keys[0].includes('insights.educourse.com.au'));
  const mainPages = (d.gscPages.rows || []).filter((r: any) => !r.keys[0].includes('insights.educourse.com.au'));
  if (blogPages.length === 0) {
    recs.push(`🟡 **No blog (insights.educourse.com.au) pages appearing in GSC top 25.** Either blog isn't indexed properly, or content isn't ranking. Given you have 50+ unpublished posts (per March audit), this is a missed opportunity.`);
  } else {
    const blogClicks = blogPages.reduce((s: number, r: any) => s + r.clicks, 0);
    const mainClicks = mainPages.reduce((s: number, r: any) => s + r.clicks, 0);
    recs.push(`📊 Blog vs main site clicks: blog **${fmt(blogClicks)}** / main site **${fmt(mainClicks)}**. ${blogClicks > mainClicks ? 'Blog is outperforming main site for organic — double down.' : 'Main site dominates — blog has room to grow.'}`);
  }

  if (recs.length === 0) {
    recs.push('No urgent issues flagged automatically. Review the tables above for opportunities.');
  }

  md += recs.map((r, i) => `${i + 1}. ${r}`).join('\n\n') + '\n\n';

  md += `---

## Methodology

- **GA4 Data API** (\`analyticsdata.googleapis.com\`) for traffic, channel, landing page, and conversion data
- **Search Console API** (\`searchconsole.googleapis.com\`) for impressions, clicks, queries, positions
- **Auth:** Application Default Credentials via gcloud (no key files)
- **Date window:** GSC has ~1-2 day lag, so end date = yesterday
- **"Quick wins":** queries with avg position 4-20 and ≥50 impressions in the window
- **Comparison:** previous 30 days (so day-of-week effects roughly cancel)

To re-run: \`npx tsx "SEO Agent/scripts/audit-30-day.ts"\`
`;

  return md;
}

main().catch((err) => {
  console.error('\n❌ Audit failed:');
  console.error(err.message || err);
  if (err.response?.data) {
    console.error('\nAPI error:', JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
