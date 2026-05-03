#!/usr/bin/env tsx
/**
 * Find the impression cliff — pinpoint when SEO traffic dropped.
 *
 * Pulls 90 days of daily GSC impressions/clicks + GA4 organic sessions,
 * detects the biggest sustained drop, and correlates with git history.
 *
 * Run: npx tsx "SEO Agent/scripts/find-impression-cliff.ts"
 */

import { GoogleAuth } from 'google-auth-library';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID!;
const GSC_SITE_URL = process.env.GSC_SITE_URL!;
const DAYS = 90;

const auth = new GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

const today = new Date();
const endDate = formatDate(addDays(today, -1));
const startDate = formatDate(addDays(today, -DAYS));

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

async function pullGSCDaily() {
  const client = await auth.getClient();
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`;
  const res = await client.request({
    url,
    method: 'POST',
    data: { startDate, endDate, dimensions: ['date'], rowLimit: DAYS + 5 },
  });
  return ((res.data as any).rows || []).map((r: any) => ({
    date: r.keys[0],
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.position,
  }));
}

async function pullGA4OrganicDaily() {
  const client = await auth.getClient();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;
  const res = await client.request({
    url,
    method: 'POST',
    data: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          stringFilter: { matchType: 'EXACT', value: 'Organic Search' },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date', orderType: 'ALPHANUMERIC' } }],
      limit: DAYS + 5,
    },
  });
  return ((res.data as any).rows || []).map((r: any) => {
    // GA4 returns date as YYYYMMDD without dashes
    const raw = r.dimensionValues[0].value;
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    return {
      date,
      sessions: Number(r.metricValues[0].value),
      users: Number(r.metricValues[1].value),
    };
  });
}

// Rolling 7-day average
function rolling7(arr: number[]): number[] {
  return arr.map((_, i) => {
    if (i < 6) return NaN;
    const window = arr.slice(i - 6, i + 1);
    return window.reduce((s, n) => s + n, 0) / 7;
  });
}

// Find the biggest drop: max single-day (rolling-avg) drop
function findCliff(dates: string[], rolling: number[]): { date: string; before: number; after: number; dropPct: number } | null {
  let best = { date: '', before: 0, after: 0, dropPct: 0 };
  for (let i = 7; i < rolling.length; i++) {
    const before = rolling[i - 1];
    const after = rolling[i];
    if (!before || !after) continue;
    const dropPct = ((before - after) / before) * 100;
    if (dropPct > best.dropPct) {
      best = { date: dates[i], before, after, dropPct };
    }
  }
  return best.dropPct > 0 ? best : null;
}

// Find sustained drop: compare each day's 7-day forward avg to its 7-day backward avg
function findSustainedDrop(dates: string[], values: number[]): { date: string; before: number; after: number; dropPct: number } | null {
  let best = { date: '', before: 0, after: 0, dropPct: 0 };
  for (let i = 7; i < values.length - 7; i++) {
    const before = values.slice(i - 7, i).reduce((s, n) => s + n, 0) / 7;
    const after = values.slice(i, i + 7).reduce((s, n) => s + n, 0) / 7;
    if (!before) continue;
    const dropPct = ((before - after) / before) * 100;
    if (dropPct > best.dropPct) {
      best = { date: dates[i], before, after, dropPct };
    }
  }
  return best.dropPct > 0 ? best : null;
}

function getCommitsAroundDate(dateStr: string, daysWindow = 3): string[] {
  const date = new Date(dateStr);
  const since = formatDate(addDays(date, -daysWindow));
  const until = formatDate(addDays(date, daysWindow));
  try {
    const out = execSync(
      `git log --since="${since}" --until="${until} 23:59:59" --pretty=format:"%h|%ai|%s|%an" --no-merges`,
      { cwd: process.cwd(), encoding: 'utf-8' }
    );
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(`Impression Cliff Investigation — last ${DAYS} days`);
  console.log(`Window: ${startDate} → ${endDate}`);
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 Pulling daily data...');
  const [gscDaily, ga4Daily] = await Promise.all([pullGSCDaily(), pullGA4OrganicDaily()]);
  console.log(`✓ GSC: ${gscDaily.length} days`);
  console.log(`✓ GA4: ${ga4Daily.length} days\n`);

  // Merge by date
  const ga4Map = new Map(ga4Daily.map((r: any) => [r.date, r]));
  const merged = gscDaily
    .map((g: any) => ({
      date: g.date,
      gscImpressions: g.impressions,
      gscClicks: g.clicks,
      gscPosition: g.position,
      ga4Sessions: ((ga4Map.get(g.date) as any)?.sessions ?? 0) as number,
    }))
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  const dates = merged.map((m: any) => m.date);
  const impressions = merged.map((m: any) => m.gscImpressions);
  const clicks = merged.map((m: any) => m.gscClicks);

  // Rolling 7-day averages for smoothing
  const impRolling = rolling7(impressions);
  const clickRolling = rolling7(clicks);

  // Find cliff (sustained drop, not a single bad day)
  const impCliff = findSustainedDrop(dates, impressions);
  const clickCliff = findSustainedDrop(dates, clicks);

  // ASCII chart of rolling-7-day impressions
  const maxImp = Math.max(...impRolling.filter((n) => !isNaN(n)));
  const chartLines: string[] = [];
  for (let i = 0; i < merged.length; i++) {
    const date = dates[i];
    const imp = impressions[i];
    const roll = impRolling[i];
    const barWidth = isNaN(roll) ? 0 : Math.round((roll / maxImp) * 50);
    const bar = '█'.repeat(barWidth);
    const rollStr = isNaN(roll) ? '   -' : roll.toFixed(0).padStart(4);
    chartLines.push(`${date}  ${imp.toString().padStart(4)}  ${rollStr}  ${bar}`);
  }

  // Print chart to terminal
  console.log('Daily impressions (7-day rolling avg as bar):');
  console.log('Date        Daily  Roll7');
  console.log('─'.repeat(80));
  for (const line of chartLines) console.log(line);
  console.log('');

  // Cliff analysis
  console.log('═══════════════════════════════════════════');
  console.log('CLIFF ANALYSIS');
  console.log('═══════════════════════════════════════════');
  if (impCliff) {
    console.log(`\n🔴 IMPRESSIONS cliff detected on or near: ${impCliff.date}`);
    console.log(`   Before (7-day avg): ${impCliff.before.toFixed(0)} impressions/day`);
    console.log(`   After  (7-day avg): ${impCliff.after.toFixed(0)} impressions/day`);
    console.log(`   Drop: -${impCliff.dropPct.toFixed(1)}%`);
  }
  if (clickCliff) {
    console.log(`\n🔴 CLICKS cliff detected on or near: ${clickCliff.date}`);
    console.log(`   Before (7-day avg): ${clickCliff.before.toFixed(1)} clicks/day`);
    console.log(`   After  (7-day avg): ${clickCliff.after.toFixed(1)} clicks/day`);
    console.log(`   Drop: -${clickCliff.dropPct.toFixed(1)}%`);
  }

  // Git correlation
  console.log('\n═══════════════════════════════════════════');
  console.log('GIT ACTIVITY AROUND THE CLIFF');
  console.log('═══════════════════════════════════════════');
  if (impCliff) {
    const commits = getCommitsAroundDate(impCliff.date, 3);
    if (commits.length === 0) {
      console.log(`\n(No commits within ±3 days of ${impCliff.date} — drop likely external: algorithm update, GSC reporting change, or pre-existing trend)`);
    } else {
      console.log(`\nCommits within ±3 days of ${impCliff.date} (${commits.length}):\n`);
      for (const c of commits) {
        const [hash, date, subject, author] = c.split('|');
        console.log(`  ${date.slice(0, 10)} ${hash}  ${subject}`);
      }
    }
  }

  // Save markdown report
  const outDir = path.join(process.cwd(), 'docs', '04-analysis');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `IMPRESSION_CLIFF_${formatDate(today)}.md`);
  const md = buildMarkdown({ merged, impCliff, clickCliff, dates, impressions, impRolling });
  fs.writeFileSync(outPath, md);
  console.log(`\n✓ Report written: ${outPath}`);
}

function buildMarkdown(d: any): string {
  let md = `# Impression Cliff Investigation — ${formatDate(today)}

**Window:** ${startDate} → ${endDate} (${DAYS} days)
**Site:** ${GSC_SITE_URL}

---

## Cliff detected

`;
  if (d.impCliff) {
    md += `🔴 **Biggest sustained impression drop:** around **${d.impCliff.date}**\n\n`;
    md += `- 7-day avg before: **${d.impCliff.before.toFixed(0)}** impressions/day\n`;
    md += `- 7-day avg after: **${d.impCliff.after.toFixed(0)}** impressions/day\n`;
    md += `- Drop: **−${d.impCliff.dropPct.toFixed(1)}%**\n\n`;
  } else {
    md += `No clear cliff detected. Drop may be gradual.\n\n`;
  }

  if (d.clickCliff) {
    md += `🔴 **Biggest sustained click drop:** around **${d.clickCliff.date}**\n\n`;
    md += `- 7-day avg before: **${d.clickCliff.before.toFixed(1)}** clicks/day\n`;
    md += `- 7-day avg after: **${d.clickCliff.after.toFixed(1)}** clicks/day\n`;
    md += `- Drop: **−${d.clickCliff.dropPct.toFixed(1)}%**\n\n`;
  }

  md += `---\n\n## Git activity around the cliff\n\n`;
  if (d.impCliff) {
    const commits = getCommitsAroundDate(d.impCliff.date, 5);
    if (commits.length === 0) {
      md += `_No commits within ±5 days of ${d.impCliff.date}._\n\n`;
      md += `**Likely cause:** External (Google algorithm update, GSC reporting/sampling change, manual action, or seasonal trend). Check:\n`;
      md += `- https://status.search.google.com/ — for the cliff date\n`;
      md += `- https://searchengineland.com/library/google/google-algorithm-updates — for algorithm updates around ${d.impCliff.date}\n`;
      md += `- GSC → Manual actions tab — for any penalties\n`;
      md += `- GSC → Coverage report — for indexation issues\n\n`;
    } else {
      md += `Commits within ±5 days of ${d.impCliff.date}:\n\n`;
      md += `| Date | Hash | Subject |\n|---|---|---|\n`;
      for (const c of commits) {
        const [hash, date, subject] = c.split('|');
        md += `| ${date.slice(0, 10)} | \`${hash}\` | ${subject?.replace(/\|/g, '\\|')} |\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n## Daily data (full table)\n\n`;
  md += `| Date | Impressions | Clicks | 7-day avg impressions | GA4 organic sessions |\n|---|---|---|---|---|\n`;
  for (let i = 0; i < d.merged.length; i++) {
    const m = d.merged[i];
    const roll = d.impRolling[i];
    md += `| ${m.date} | ${m.gscImpressions} | ${m.gscClicks} | ${isNaN(roll) ? '-' : roll.toFixed(0)} | ${m.ga4Sessions} |\n`;
  }

  md += `\n---\n\n## Methodology\n\n`;
  md += `- "Sustained drop" = compares 7-day forward avg vs 7-day backward avg at each date; picks the date with the largest decline\n`;
  md += `- Git correlation looks at commits within ±3 days (terminal) / ±5 days (markdown) of the cliff date\n`;
  md += `- Non-merge commits only\n`;
  md += `- To re-run: \`npx tsx "SEO Agent/scripts/find-impression-cliff.ts"\`\n`;

  return md;
}

main().catch((err) => {
  console.error('\n❌ Failed:');
  console.error(err.message || err);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
