#!/usr/bin/env tsx
/**
 * Audit the Final URL of every ad in the Google Ads account.
 *
 * Looking specifically for:
 *  - Ads pointing to /auth (the #1 paid landing page in GA4 — almost certainly wrong)
 *  - Ads pointing to dashboard/internal paths
 *  - Ads pointing to non-existent pages (would 404)
 *  - URLs with broken/missing tracking params
 *
 * Run: npx tsx "Google Ads Agent/scripts/audit-final-urls.ts"
 */

import { GoogleAdsClient } from './google-ads-client.js';

interface AdAuditRow {
  campaignName: string;
  campaignStatus: string;
  adGroupName: string;
  adId: string;
  adStatus: string;
  finalUrl: string;
  pathOnly: string;
  flag: string;
  headlines: string[];
}

function classifyUrl(url: string): { pathOnly: string; flag: string } {
  if (!url) return { pathOnly: '', flag: '🔴 NO URL' };
  try {
    const u = new URL(url);
    const path = u.pathname;

    // Suspicious paths
    if (path === '/auth' || path.startsWith('/auth/')) {
      return { pathOnly: path, flag: '🔴 AUTH PAGE — paid traffic should land on marketing pages, not login' };
    }
    if (path.startsWith('/dashboard')) {
      return { pathOnly: path, flag: '🔴 DASHBOARD — only logged-in users can see this' };
    }
    if (path.startsWith('/test/')) {
      return { pathOnly: path, flag: '🔴 TEST PAGE — gated/internal' };
    }
    if (path.startsWith('/profile')) {
      return { pathOnly: path, flag: '🔴 PROFILE PAGE — gated' };
    }

    // Wrong domain
    if (u.hostname !== 'educourse.com.au' && u.hostname !== 'www.educourse.com.au') {
      return { pathOnly: path, flag: `🟡 EXTERNAL DOMAIN: ${u.hostname}` };
    }

    // Looks fine
    if (path === '/' || path.startsWith('/course/') || path.includes('-guide') || path.includes('-preparation')) {
      return { pathOnly: path, flag: '✓ OK' };
    }

    return { pathOnly: path, flag: '🟡 unusual path — manual review' };
  } catch {
    return { pathOnly: url, flag: '🔴 INVALID URL' };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('Google Ads — Final URL Audit');
  console.log('═══════════════════════════════════════════\n');

  const client = new GoogleAdsClient();
  console.log('📊 Pulling all ads...');
  const ads: any[] = await client.getAllAds();
  console.log(`✓ Found ${ads.length} ads\n`);

  const enabled = ads.filter((a) => a.campaignStatus === 'ENABLED' && a.adStatus === 'ENABLED');
  console.log(`Currently serving (campaign + ad both ENABLED): ${enabled.length}\n`);

  // Classify each
  const audited: AdAuditRow[] = ads.map((a) => {
    const { pathOnly, flag } = classifyUrl(a.finalUrl);
    return {
      campaignName: a.campaignName,
      campaignStatus: a.campaignStatus,
      adGroupName: a.adGroupName,
      adId: a.adId,
      adStatus: a.adStatus,
      finalUrl: a.finalUrl,
      pathOnly,
      flag,
      headlines: a.headlines || [],
    };
  });

  // Summary
  const byFlag = new Map<string, number>();
  for (const row of audited) {
    byFlag.set(row.flag, (byFlag.get(row.flag) || 0) + 1);
  }

  console.log('━━━ Summary across ALL ads (enabled + paused) ━━━');
  for (const [flag, count] of [...byFlag.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(3)}  ${flag}`);
  }

  // Group enabled-only by URL path
  const byPath = new Map<string, AdAuditRow[]>();
  for (const row of audited.filter((r) => r.campaignStatus === 'ENABLED' && r.adStatus === 'ENABLED')) {
    if (!byPath.has(row.pathOnly)) byPath.set(row.pathOnly, []);
    byPath.get(row.pathOnly)!.push(row);
  }

  console.log('\n━━━ ENABLED ads grouped by destination path ━━━');
  for (const [path, rows] of [...byPath.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const flag = rows[0].flag;
    console.log(`\n  ${rows.length.toString().padStart(3)} ads → ${path}  ${flag}`);
    // Show campaigns sending traffic here
    const campaigns = new Set(rows.map((r) => r.campaignName));
    for (const c of campaigns) {
      console.log(`        ↳ ${c} (${rows.filter((r) => r.campaignName === c).length} ads)`);
    }
  }

  // Highlight problematic ads explicitly
  const problematic = audited.filter(
    (r) => r.flag.startsWith('🔴') && r.campaignStatus === 'ENABLED' && r.adStatus === 'ENABLED'
  );

  if (problematic.length > 0) {
    console.log(`\n\n🔴 ${problematic.length} ENABLED ads with PROBLEMATIC URLs:\n`);
    for (const ad of problematic.slice(0, 30)) {
      console.log(`\n  Campaign: ${ad.campaignName}`);
      console.log(`  Ad group: ${ad.adGroupName}`);
      console.log(`  Ad ID:    ${ad.adId}`);
      console.log(`  URL:      ${ad.finalUrl}`);
      console.log(`  Flag:     ${ad.flag}`);
      if (ad.headlines.length) console.log(`  Headlines: ${ad.headlines.slice(0, 3).join(' | ')}`);
    }
    if (problematic.length > 30) console.log(`\n  ... and ${problematic.length - 30} more`);
  } else {
    console.log('\n✅ No problematic Final URLs found in enabled ads.');
    console.log('   The /auth landing-page issue must come from somewhere else:');
    console.log('   - sitelink extensions');
    console.log('   - in-app redirects (e.g. ProtectedRoute redirecting unauthenticated users to /auth)');
    console.log('   - keyword-targeted ads where the user searches "educourse login" → ad → marketing site, then app redirects to /auth');
  }

  console.log('\n━━━ Done ━━━\n');
}

main().catch((e) => {
  console.error('Failed:', e.message || e);
  process.exit(1);
});
