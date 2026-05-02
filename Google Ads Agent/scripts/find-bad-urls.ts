import { GoogleAdsApi } from 'google-ads-api';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
});

const statusMap: Record<number, string> = {
  2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED',
};

async function main() {
  console.log('🔍 Finding ALL ads (including paused/disapproved) and their URLs\n');

  const adsQuery = `
    SELECT
      campaign.name,
      campaign.status,
      ad_group.name,
      ad_group.status,
      ad_group_ad.ad.id,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.final_urls,
      ad_group_ad.status,
      ad_group_ad.policy_summary.approval_status,
      ad_group_ad.policy_summary.review_status
    FROM ad_group_ad
    WHERE campaign.status != 'REMOVED'
      AND ad_group_ad.status != 'REMOVED'
  `;

  const ads = await customer.query(adsQuery);
  console.log(`Total ads found: ${ads.length}\n`);

  const badAds: any[] = [];
  const goodAds: any[] = [];

  for (const ad of ads) {
    const urls = ad.ad_group_ad.ad.final_urls || [];
    const hasBadUrl = urls.some((u: string) => u.includes('educoach'));
    const adInfo = {
      ad_id: ad.ad_group_ad.ad.id,
      campaign: ad.campaign.name,
      ad_group: ad.ad_group.name,
      ad_status: statusMap[ad.ad_group_ad.status] || ad.ad_group_ad.status,
      approval_status: ad.ad_group_ad.policy_summary?.approval_status,
      review_status: ad.ad_group_ad.policy_summary?.review_status,
      urls,
      headlines: (ad.ad_group_ad.ad.responsive_search_ad?.headlines || [])
        .map((h: any) => h.text).slice(0, 3).join(' | '),
    };

    if (hasBadUrl) badAds.push(adInfo);
    else goodAds.push(adInfo);
  }

  console.log(`✅ Ads with CORRECT URL (educourse.com.au): ${goodAds.length}`);
  console.log(`❌ Ads with WRONG URL (educoach.com.au): ${badAds.length}\n`);

  if (badAds.length > 0) {
    console.log('━'.repeat(100));
    console.log('❌ BROKEN ADS NEEDING URL FIX:');
    console.log('━'.repeat(100));
    for (const ad of badAds) {
      console.log(`\n Ad ID: ${ad.ad_id}`);
      console.log(`  Campaign:        ${ad.campaign}`);
      console.log(`  Ad Group:        ${ad.ad_group}`);
      console.log(`  Status:          ${ad.ad_status}`);
      console.log(`  Approval:        ${ad.approval_status}`);
      console.log(`  Headlines:       ${ad.headlines}`);
      console.log(`  Current URLs:    ${JSON.stringify(ad.urls)}`);
    }
  }

  // Also check sitelinks / other URL-bearing assets
  console.log('\n' + '━'.repeat(100));
  console.log('🔍 Checking sitelinks and other ad assets for bad URLs...');
  console.log('━'.repeat(100));

  const assetsQuery = `
    SELECT
      asset.id,
      asset.name,
      asset.type,
      asset.final_urls
    FROM asset
    WHERE asset.type IN (1, 2)
  `;
  // type 1 = SITELINK, 2 = CALLOUT, etc.

  try {
    const assets = await customer.query(assetsQuery);
    const badAssets = assets.filter((a: any) =>
      (a.asset.final_urls || []).some((u: string) => u.includes('educoach'))
    );
    console.log(`\nAssets checked: ${assets.length}, with bad URLs: ${badAssets.length}`);
    for (const a of badAssets) {
      console.log(`  Asset ID ${a.asset.id}: ${JSON.stringify(a.asset.final_urls)}`);
    }
  } catch (err: any) {
    console.log('  (asset query failed, skipping):', err.message);
  }

  // Check campaign-level final_url_suffix or tracking template
  console.log('\n' + '━'.repeat(100));
  console.log('🔍 Checking campaign-level URL settings...');
  console.log('━'.repeat(100));

  const campQuery = `
    SELECT
      campaign.name,
      campaign.tracking_url_template,
      campaign.final_url_suffix,
      campaign.url_custom_parameters
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `;

  const camps = await customer.query(campQuery);
  for (const c of camps) {
    const tracking = c.campaign.tracking_url_template || '';
    const suffix = c.campaign.final_url_suffix || '';
    if (tracking.includes('educoach') || suffix.includes('educoach')) {
      console.log(`  ❌ ${c.campaign.name}: tracking="${tracking}" suffix="${suffix}"`);
    } else if (tracking || suffix) {
      console.log(`  ✓ ${c.campaign.name}: tracking="${tracking}" suffix="${suffix}"`);
    }
  }

  // Save bad ads list for the fix script
  const fs = await import('fs');
  fs.writeFileSync(
    path.join(__dirname, '..', 'bad_ads_to_fix.json'),
    JSON.stringify(badAds, null, 2)
  );
  console.log(`\n💾 Saved ${badAds.length} bad ads to bad_ads_to_fix.json\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  });
