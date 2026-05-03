#!/usr/bin/env tsx
/**
 * Show full details of every ad whose final URL is NOT on educourse.com.au.
 * Read-only — no changes made.
 */

import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

const STATUS_NAMES: Record<number, string> = {
  2: 'ENABLED',
  3: 'PAUSED',
  4: 'REMOVED',
};

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
  console.log('Wrong-domain ad audit (NOT educourse.com.au)');
  console.log('═══════════════════════════════════════════\n');

  const rows: any[] = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      ad_group.id,
      ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.type,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.status
    FROM ad_group_ad
  `);

  const wrong = rows.filter((r) => {
    const urls: string[] = r.ad_group_ad.ad.final_urls || [];
    return urls.some((u) => {
      try {
        const h = new URL(u).hostname;
        return h !== 'educourse.com.au' && h !== 'www.educourse.com.au';
      } catch {
        return true;
      }
    });
  });

  console.log(`Found ${wrong.length} ads on a non-educourse domain:\n`);

  for (const r of wrong) {
    const ad = r.ad_group_ad.ad;
    const rsa = ad.responsive_search_ad;
    console.log('━'.repeat(80));
    console.log(`Campaign:    ${r.campaign.name}  [${STATUS_NAMES[r.campaign.status] || r.campaign.status}]`);
    console.log(`Ad group:    ${r.ad_group.name}`);
    console.log(`Ad ID:       ${ad.id}`);
    console.log(`Ad status:   ${STATUS_NAMES[r.ad_group_ad.status] || r.ad_group_ad.status}`);
    console.log(`Ad type:     RESPONSIVE_SEARCH_AD`);
    console.log(`Final URL:   ${(ad.final_urls || []).join(' | ')}`);
    console.log(`Headlines:`);
    for (const h of rsa?.headlines || []) {
      console.log(`   - "${h.text}"`);
    }
    console.log(`Descriptions:`);
    for (const d of rsa?.descriptions || []) {
      console.log(`   - "${d.text}"`);
    }
    console.log(`\nResource: customers/${customerId}/adGroupAds/${r.ad_group.id}~${ad.id}`);
    console.log('');
  }

  console.log('━'.repeat(80));
  console.log(`\nNext step: review this list, then run the update script with the URL mapping.`);
}

main().catch((e) => {
  console.error('Failed:', e.message || e);
  if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
});
