#!/usr/bin/env tsx
/**
 * Comprehensive destination audit — pulls EVERY URL that paid traffic could land on:
 *  - All ad types (not just RSA)
 *  - Sitelink extensions
 *  - Performance Max campaign settings (incl. Final URL Expansion)
 *  - Asset Group URLs
 *
 * Goal: explain why /auth is the #1 paid landing page in GA4.
 */

import { GoogleAdsClient } from './google-ads-client.js';
import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, '');

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  });

  const customer = client.Customer({
    customer_id: customerId,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  });

  console.log('═══════════════════════════════════════════');
  console.log('Comprehensive Ad Destination Audit');
  console.log('═══════════════════════════════════════════\n');

  // 1. Active campaigns + types + Final URL Expansion setting
  console.log('━━━ All campaigns and their types ━━━');
  const campaigns: any[] = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.advertising_channel_sub_type
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.advertising_channel_type, campaign.name
  `);

  for (const row of campaigns) {
    const type = row.campaign.advertising_channel_type;
    const subtype = row.campaign.advertising_channel_sub_type;
    console.log(`  [${row.campaign.status}]  ${type}${subtype && subtype !== 'UNKNOWN' ? ` (${subtype})` : ''}  ${row.campaign.name}`);
  }

  // 2. ALL ad types (not just RSA) — get final URLs from any ad type
  console.log('\n\n━━━ All ad types and their final URLs ━━━');
  const allAds: any[] = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.type,
      ad_group_ad.ad.final_urls,
      ad_group_ad.status
    FROM ad_group_ad
    WHERE campaign.status != 'REMOVED'
      AND ad_group_ad.status != 'REMOVED'
    ORDER BY campaign.name, ad_group.name
  `);

  // Count by ad type
  const byType = new Map<string, any[]>();
  for (const r of allAds) {
    const type = r.ad_group_ad.ad.type;
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(r);
  }
  for (const [type, ads] of byType) {
    const enabled = ads.filter((a) => a.campaign.status === 'ENABLED' && a.ad_group_ad.status === 'ENABLED').length;
    console.log(`  ${ads.length} ads of type ${type} (${enabled} fully enabled)`);
  }

  // 3. Look for any URL containing /auth or /dashboard
  console.log('\n\n━━━ ANY ad URL containing suspicious paths ━━━');
  const suspicious: any[] = [];
  for (const r of allAds) {
    const urls: string[] = r.ad_group_ad.ad.final_urls || [];
    for (const u of urls) {
      if (u.includes('/auth') || u.includes('/dashboard') || u.includes('/test/') || u.includes('/profile')) {
        suspicious.push({
          campaign: r.campaign.name,
          campStatus: r.campaign.status,
          adGroup: r.ad_group.name,
          adId: r.ad_group_ad.ad.id,
          adStatus: r.ad_group_ad.status,
          type: r.ad_group_ad.ad.type,
          url: u,
        });
      }
    }
  }
  if (suspicious.length === 0) {
    console.log('  ✓ No ads with /auth, /dashboard, /test, or /profile in their final URL.');
  } else {
    for (const s of suspicious) {
      console.log(`  🔴 [${s.campStatus}/${s.adStatus}] ${s.type}  ${s.campaign}  → ${s.url}`);
    }
  }

  // 4. Sitelink and other ad extensions (assets)
  console.log('\n\n━━━ Sitelink / asset URLs ━━━');
  const assets: any[] = await customer.query(`
    SELECT
      asset.id,
      asset.type,
      asset.sitelink_asset.link_text,
      asset.sitelink_asset.description1,
      asset.final_urls
    FROM asset
    WHERE asset.type = 'SITELINK'
      AND asset.final_urls IS NOT NULL
    LIMIT 200
  `).catch((e) => {
    console.log(`  (could not pull assets: ${e.message})`);
    return [];
  });

  if (assets.length === 0) {
    console.log('  No sitelink assets with final URLs found.');
  } else {
    const susAssets: any[] = [];
    for (const a of assets) {
      const urls: string[] = a.asset.final_urls || [];
      const text = a.asset.sitelink_asset?.link_text || '(no text)';
      for (const u of urls) {
        if (u.includes('/auth') || u.includes('/dashboard') || u.includes('/test/')) {
          susAssets.push({ text, url: u });
        }
      }
    }
    if (susAssets.length === 0) {
      console.log(`  ✓ ${assets.length} sitelinks pulled, none with suspicious URLs.`);
    } else {
      console.log(`  🔴 ${susAssets.length} suspicious sitelinks:`);
      for (const s of susAssets) console.log(`    "${s.text}" → ${s.url}`);
    }
  }

  // 5. Performance Max asset group URLs (different from ad final URLs)
  console.log('\n\n━━━ Performance Max asset group URLs ━━━');
  const assetGroups: any[] = await customer.query(`
    SELECT
      asset_group.id,
      asset_group.name,
      asset_group.final_urls,
      asset_group.status,
      campaign.name
    FROM asset_group
    WHERE campaign.status != 'REMOVED'
  `).catch((e) => {
    console.log(`  (could not pull asset groups: ${e.message})`);
    return [];
  });

  if (assetGroups.length === 0) {
    console.log('  No Performance Max asset groups found.');
  } else {
    for (const ag of assetGroups) {
      const urls = ag.asset_group.final_urls || [];
      const flag = urls.some((u: string) => u.includes('/auth') || u.includes('/dashboard')) ? '🔴 ' : '';
      console.log(`  ${flag}[${ag.asset_group.status}] ${ag.campaign.name} / ${ag.asset_group.name}`);
      for (const u of urls) console.log(`         → ${u}`);
    }
  }

  console.log('\n━━━ Done ━━━\n');
}

main().catch((e) => {
  console.error('Failed:', e.message || e);
  if (e.errors) console.error('Errors:', JSON.stringify(e.errors, null, 2));
  process.exit(1);
});
