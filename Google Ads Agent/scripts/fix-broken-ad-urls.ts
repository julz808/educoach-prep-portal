import { GoogleAdsApi, enums } from 'google-ads-api';
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

const CAMPAIGN_TO_PRODUCT_URL: Record<string, string> = {
  'Year 5 NAPLAN': 'https://educourse.com.au/course/year-5-naplan',
  'Year 7 NAPLAN': 'https://educourse.com.au/course/year-7-naplan',
  'EduTest Scholarship': 'https://educourse.com.au/course/edutest-scholarship',
  'ACER Scholarship': 'https://educourse.com.au/course/acer-scholarship',
  'VIC Selective Entry': 'https://educourse.com.au/course/vic-selective',
  'NSW Selective Entry': 'https://educourse.com.au/course/nsw-selective',
};

async function main() {
  console.log('🔧 Fixing broken ad URLs (educoach.com.au → product-specific URLs)\n');

  // Find all broken ads
  const brokenAdsQuery = `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group.resource_name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad.responsive_search_ad.path1,
      ad_group_ad.ad.responsive_search_ad.path2,
      ad_group_ad.resource_name,
      ad_group_ad.status
    FROM ad_group_ad
    WHERE campaign.status != 'REMOVED'
      AND ad_group_ad.status != 'REMOVED'
  `;

  const allAds = await customer.query(brokenAdsQuery);
  const brokenAds = allAds.filter((ad: any) =>
    (ad.ad_group_ad.ad.final_urls || []).some((u: string) => u.includes('educoach'))
  );

  console.log(`Found ${brokenAds.length} broken ads to fix\n`);

  for (const ad of brokenAds) {
    const campaignName = ad.campaign.name;
    const newUrl = CAMPAIGN_TO_PRODUCT_URL[campaignName];

    if (!newUrl) {
      console.log(`⚠️  No URL mapping for campaign "${campaignName}" — skipping`);
      continue;
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Campaign:    ${campaignName}`);
    console.log(`Old Ad ID:   ${ad.ad_group_ad.ad.id}`);
    console.log(`Old URL:     ${ad.ad_group_ad.ad.final_urls?.[0]}`);
    console.log(`New URL:     ${newUrl}`);
    console.log('');

    const headlines = ad.ad_group_ad.ad.responsive_search_ad?.headlines || [];
    const descriptions = ad.ad_group_ad.ad.responsive_search_ad?.descriptions || [];
    const path1 = ad.ad_group_ad.ad.responsive_search_ad?.path1;
    const path2 = ad.ad_group_ad.ad.responsive_search_ad?.path2;

    if (headlines.length === 0 || descriptions.length === 0) {
      console.log(`⚠️  Ad missing headlines/descriptions — cannot recreate, skipping`);
      continue;
    }

    // Strip pinned_field if not set (API expects undefined, not 0)
    const cleanHeadlines = headlines.map((h: any) => ({
      text: h.text,
      ...(h.pinned_field ? { pinned_field: h.pinned_field } : {}),
    }));
    const cleanDescriptions = descriptions.map((d: any) => ({
      text: d.text,
      ...(d.pinned_field ? { pinned_field: d.pinned_field } : {}),
    }));

    const newAdPayload: any = {
      ad_group: ad.ad_group.resource_name,
      status: enums.AdGroupAdStatus.ENABLED,
      ad: {
        final_urls: [newUrl],
        responsive_search_ad: {
          headlines: cleanHeadlines,
          descriptions: cleanDescriptions,
          ...(path1 ? { path1 } : {}),
          ...(path2 ? { path2 } : {}),
        },
      },
    };

    try {
      const newAdResult = await customer.adGroupAds.create([newAdPayload]);
      const newResourceName = newAdResult.results[0].resource_name;
      console.log(`✅ Created new ad: ${newResourceName}`);

      // Remove the old broken ad
      await customer.adGroupAds.remove([ad.ad_group_ad.resource_name]);
      console.log(`🗑️  Removed broken ad: ${ad.ad_group_ad.resource_name}`);
      console.log('');
    } catch (err: any) {
      console.error(`❌ Failed for ${campaignName}:`, err.message);
      if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Fix complete.');
  console.log('   Google will review new ads in a few hours.');
  console.log('   Run scripts/find-bad-urls.ts to verify no broken URLs remain.\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  });
