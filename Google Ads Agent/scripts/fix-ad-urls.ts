import { GoogleAdsApi, resources, enums } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
});

// Map ad IDs to correct URLs
const AD_URL_MAPPING: Record<string, string> = {
  '770799475620': 'https://educourse.com.au/',  // VIC Selective Entry
  '771919746907': 'https://educourse.com.au/',  // NSW Selective Entry
};

async function fixAdUrls() {
  console.log('🔧 Fixing Ad URLs\n');
  console.error('Starting fix-ad-urls script...');

  try {
    console.error('Querying Google Ads API...');
    // First, get all ads with their resource names
    const query = `
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
    `;

    const ads = await customer.query(query);

    const operations = [];

    for (const ad of ads) {
      const adId = String(ad.ad_group_ad.ad.id);
      const resourceName = ad.ad_group_ad.resource_name;
      const currentUrl = ad.ad_group_ad.ad.final_urls[0];
      const newUrl = AD_URL_MAPPING[adId];

      if (!newUrl) {
        console.log(`⚠️  No URL mapping found for ad ${adId}, skipping`);
        continue;
      }

      console.log(`\n📝 Ad ID: ${adId}`);
      console.log(`   Campaign: ${ad.campaign.name}`);
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   New URL: ${newUrl}`);

      if (currentUrl === newUrl) {
        console.log(`   ✅ URL already correct, skipping`);
        continue;
      }

      // Create update operation
      const operation = {
        update_mask: 'ad.final_urls',
        update: {
          resource_name: resourceName,
          ad: {
            final_urls: [newUrl],
            responsive_search_ad: {
              headlines: ad.ad_group_ad.ad.responsive_search_ad.headlines,
              descriptions: ad.ad_group_ad.ad.responsive_search_ad.descriptions,
            },
          },
        },
      };

      operations.push(operation);
      console.log(`   🔄 Will update to: ${newUrl}`);
    }

    if (operations.length === 0) {
      console.log('\n✅ All URLs are already correct!');
      return;
    }

    console.log(`\n📤 Updating ${operations.length} ads...`);

    // Execute updates
    const response = await customer.adGroupAds.update(operations);

    console.log(`\n✅ Successfully updated ${response.results.length} ads!`);

    for (const result of response.results) {
      console.log(`   ✓ ${result.resource_name}`);
    }

    console.log('\n⏳ Note: It may take a few hours for Google to re-review the ads.');
    console.log('   Check back later to see if they are approved.');

  } catch (error: any) {
    console.error('\n❌ Error updating ads:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixAdUrls()
    .then(() => {
      console.log('\n✅ Fix complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fix failed:', error);
      process.exit(1);
    });
}

export { fixAdUrls };
