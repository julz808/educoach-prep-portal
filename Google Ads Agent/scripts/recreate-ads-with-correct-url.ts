import { GoogleAdsApi, enums } from 'google-ads-api';
import * as dotenv from 'dotenv';

dotenv.config();

const CORRECT_URL = 'https://educourse.com.au/';

async function main() {
  console.log('🔧 Recreating Google Ads with correct URL:', CORRECT_URL);
  console.log('');

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  });

  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  });

  try {
    // Get all ads with broken URLs
    const ads = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.resource_name,
        ad_group_ad.status
      FROM ad_group_ad
      WHERE campaign.status = 'ENABLED'
    `);

    console.log(`Found ${ads.length} ads`);
    console.log('');

    for (const ad of ads) {
      const currentUrl = ad.ad_group_ad.ad.final_urls?.[0];

      console.log(`Campaign: ${ad.campaign.name}`);
      console.log(`Ad Group ID: ${ad.ad_group.id}`);
      console.log(`Ad ID: ${ad.ad_group_ad.ad.id}`);
      console.log(`Current URL: ${currentUrl}`);

      if (currentUrl === CORRECT_URL) {
        console.log('✅ Already has correct URL!\n');
        continue;
      }

      console.log(`\n🔄 Creating new ad with correct URL...`);

      // Create new ad with correct URL
      const newAd = await customer.adGroupAds.create([{
        ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${ad.ad_group.id}`,
        status: enums.AdGroupAdStatus.ENABLED,
        ad: {
          final_urls: [CORRECT_URL],
          responsive_search_ad: {
            headlines: ad.ad_group_ad.ad.responsive_search_ad.headlines,
            descriptions: ad.ad_group_ad.ad.responsive_search_ad.descriptions,
          },
        },
      }]);

      console.log(`✅ Created new ad: ${newAd.results[0].resource_name}`);

      // Pause the old ad
      console.log(`🔄 Pausing old ad...`);

      await customer.adGroupAds.update([{
        resource_name: ad.ad_group_ad.resource_name,
        status: enums.AdGroupAdStatus.PAUSED,
        update_mask: {
          paths: ['status'],
        },
      }]);

      console.log(`✅ Paused old ad with broken URL`);
      console.log('');
    }

    console.log('');
    console.log('✅ All ads recreated successfully!');
    console.log('');
    console.log('Summary:');
    console.log('  - New ads created with https://educourse.com.au/');
    console.log('  - Old ads with broken URL have been paused');
    console.log('  - Google will review the new ads within a few hours');
    console.log('');
    console.log('⏳ Check back in a few hours to verify approval status.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
