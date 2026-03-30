import { GoogleAdsApi } from 'google-ads-api';
import * as dotenv from 'dotenv';

dotenv.config();

const CORRECT_URL = 'https://educourse.com.au/';

async function main() {
  console.log('🔧 Updating Google Ads URLs to:', CORRECT_URL);
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
    // Get all ads
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
        ad_group_ad.resource_name
      FROM ad_group_ad
      WHERE campaign.status = 'ENABLED'
    `);

    console.log(`Found ${ads.length} ads`);
    console.log('');

    for (const ad of ads) {
      const currentUrl = ad.ad_group_ad.ad.final_urls?.[0];

      console.log(`Campaign: ${ad.campaign.name}`);
      console.log(`Ad ID: ${ad.ad_group_ad.ad.id}`);
      console.log(`Current URL: ${currentUrl}`);

      if (currentUrl === CORRECT_URL) {
        console.log('✅ Already correct!\n');
        continue;
      }

      console.log(`🔄 Updating to: ${CORRECT_URL}`);

      // Update the ad
      await customer.adGroupAds.update([{
        resource_name: ad.ad_group_ad.resource_name,
        ad: {
          final_urls: [CORRECT_URL],
          responsive_search_ad: {
            headlines: ad.ad_group_ad.ad.responsive_search_ad.headlines,
            descriptions: ad.ad_group_ad.ad.responsive_search_ad.descriptions,
          },
        },
        update_mask: {
          paths: ['ad.final_urls'],
        },
      }]);

      console.log('✅ Updated!\n');
    }

    console.log('');
    console.log('✅ All ads updated successfully!');
    console.log('');
    console.log('⏳ Google will re-review the ads within a few hours.');
    console.log('   The ads should be approved once they verify the URL is working.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
