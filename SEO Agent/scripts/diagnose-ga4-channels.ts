#!/usr/bin/env tsx
/**
 * Diagnose GA4 channel grouping — figure out if "Organic Search" is
 * misclassified or if the GA4↔GSC gap is explainable (Discover, image search, etc).
 *
 * Pulls:
 *  - Source/medium breakdown within each channel
 *  - Top landing pages per channel
 *  - Sessions where sessionDefaultChannelGroup = Direct but referrer suggests email/social
 *
 * Run: npx tsx "SEO Agent/scripts/diagnose-ga4-channels.ts"
 */

import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID!;

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

const today = new Date();
const endDate = today.toISOString().slice(0, 10);
const startDate = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);

async function ga4Run(body: any) {
  const client = await auth.getClient();
  const res = await client.request({
    url: `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    method: 'POST',
    data: body,
  });
  return res.data as any;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('GA4 Channel Grouping Diagnostic');
  console.log(`Window: ${startDate} → ${endDate}`);
  console.log('═══════════════════════════════════════════\n');

  // Source/medium within each channel — this reveals what GA4 is actually counting
  console.log('📊 Pulling source/medium breakdown by channel...');
  const sourceMedium = await ga4Run({
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'sessionDefaultChannelGroup' },
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
    ],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 100,
  });

  // Group by channel
  const byChannel = new Map<string, any[]>();
  for (const r of sourceMedium.rows || []) {
    const channel = r.dimensionValues[0].value;
    const source = r.dimensionValues[1].value;
    const medium = r.dimensionValues[2].value;
    const sessions = Number(r.metricValues[0].value);
    if (!byChannel.has(channel)) byChannel.set(channel, []);
    byChannel.get(channel)!.push({ source, medium, sessions });
  }

  for (const [channel, entries] of byChannel) {
    const total = entries.reduce((s: number, e: any) => s + e.sessions, 0);
    console.log(`\n━━━ ${channel} (${total} sessions) ━━━`);
    for (const e of entries.sort((a: any, b: any) => b.sessions - a.sessions).slice(0, 8)) {
      const pct = ((e.sessions / total) * 100).toFixed(0);
      console.log(`  ${e.sessions.toString().padStart(4)}  ${pct.padStart(3)}%  ${e.source} / ${e.medium}`);
    }
  }

  // Landing page per channel — to find suspicious patterns (e.g. /auth as organic)
  console.log('\n\n📊 Top landing pages per channel...');
  const landingPerChannel = await ga4Run({
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'sessionDefaultChannelGroup' },
      { name: 'landingPagePlusQueryString' },
    ],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 200,
  });

  const landingByChannel = new Map<string, any[]>();
  for (const r of landingPerChannel.rows || []) {
    const channel = r.dimensionValues[0].value;
    const page = r.dimensionValues[1].value;
    const sessions = Number(r.metricValues[0].value);
    if (!landingByChannel.has(channel)) landingByChannel.set(channel, []);
    landingByChannel.get(channel)!.push({ page, sessions });
  }

  for (const channel of ['Organic Search', 'Direct', 'Paid Search', 'Referral']) {
    const entries = landingByChannel.get(channel);
    if (!entries) continue;
    console.log(`\n━━━ ${channel} — top 10 landing pages ━━━`);
    for (const e of entries.sort((a, b) => b.sessions - a.sessions).slice(0, 10)) {
      console.log(`  ${e.sessions.toString().padStart(4)}  ${e.page}`);
    }
  }

  // Email confirmation hypothesis — /auth/callback should be tagged
  console.log('\n\n📊 Auth-flow landing pages by channel (should be tagged separately)...');
  const authLandings = await ga4Run({
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'landingPagePlusQueryString' },
      { name: 'sessionDefaultChannelGroup' },
      { name: 'sessionSource' },
    ],
    metrics: [{ name: 'sessions' }],
    dimensionFilter: {
      filter: {
        fieldName: 'landingPagePlusQueryString',
        stringFilter: { matchType: 'CONTAINS', value: '/auth' },
      },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 30,
  });
  for (const r of authLandings.rows || []) {
    const sessions = Number(r.metricValues[0].value);
    console.log(`  ${sessions.toString().padStart(3)}  [${r.dimensionValues[1].value} via ${r.dimensionValues[2].value}]  ${r.dimensionValues[0].value}`);
  }

  // Save markdown
  const outDir = path.join(process.cwd(), 'docs', '04-analysis');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `GA4_CHANNEL_DIAGNOSTIC_${endDate}.md`);

  let md = `# GA4 Channel Grouping Diagnostic — ${endDate}

**Window:** ${startDate} → ${endDate}
**GA4 Property:** ${GA4_PROPERTY_ID}

---

## Source / medium breakdown by channel

This is the truth. "Organic Search" should be dominated by \`google / organic\`. Anything else in there is either misclassification or non-Google search.

`;

  for (const [channel, entries] of byChannel) {
    const total = entries.reduce((s: number, e: any) => s + e.sessions, 0);
    md += `### ${channel} (${total} sessions)\n\n`;
    md += `| Source | Medium | Sessions | % |\n|---|---|---|---|\n`;
    for (const e of entries.sort((a, b) => b.sessions - a.sessions)) {
      const pct = ((e.sessions / total) * 100).toFixed(1);
      md += `| ${e.source} | ${e.medium} | ${e.sessions} | ${pct}% |\n`;
    }
    md += `\n`;
  }

  md += `---\n\n## Auth-flow landing pages\n\nIf email confirmation links don't carry UTM params, /auth/callback shows up as Direct or random. This pollutes channel attribution.\n\n`;
  md += `| Sessions | Channel | Source | Landing page |\n|---|---|---|---|\n`;
  for (const r of authLandings.rows || []) {
    md += `| ${r.metricValues[0].value} | ${r.dimensionValues[1].value} | ${r.dimensionValues[2].value} | ${r.dimensionValues[0].value} |\n`;
  }

  fs.writeFileSync(outPath, md);
  console.log(`\n✓ Report written: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  if ((e as any).response?.data) console.error(JSON.stringify((e as any).response.data, null, 2));
  process.exit(1);
});
