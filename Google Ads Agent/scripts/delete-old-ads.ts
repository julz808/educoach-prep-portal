import { GoogleAdsApi } from 'google-ads-api';
import * as dotenv from 'dotenv';

dotenv.config();

const OLD_AD_IDS_TO_DELETE = [
  '770799475620',  // VIC old ad with broken URL
  '771919746907',  // NSW old ad with broken URL
];

async function main() {
  console.log('🗑️  Deleting old ads with broken URLs\n');

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
    // Get all ads to find resource names
    const ads = await customer.query(`
      SELECT
        campaign.name,
        ad_group_ad.ad.id,
        ad_group_ad.resource_name,
        ad_group_ad.ad.final_urls,
        ad_group_ad.status
      FROM ad_group_ad
      WHERE campaign.status = 'ENABLED'
    `);

    console.log(`Found ${ads.length} total ads\n`);

    const adsToDelete = ads.filter(ad =>
      OLD_AD_IDS_TO_DELETE.includes(String(ad.ad_group_ad.ad.id))
    );

    if (adsToDelete.length === 0) {
      console.log('✅ No old ads found to delete. Already cleaned up!');
      return;
    }

    console.log(`Deleting ${adsToDelete.length} old ads:\n`);

    for (const ad of adsToDelete) {
      console.log(`Campaign: ${ad.campaign.name}`);
      console.log(`Ad ID: ${ad.ad_group_ad.ad.id}`);
      console.log(`URL: ${ad.ad_group_ad.ad.final_urls?.[0]}`);
      console.log(`Status: ${ad.ad_group_ad.status}`);
      console.log(`Resource: ${ad.ad_group_ad.resource_name}`);

      // Remove the ad
      await customer.adGroupAds.remove([ad.ad_group_ad.resource_name]);

      console.log(`✅ Deleted!\n`);
    }

    console.log('');
    console.log('✅ All old ads deleted successfully!');
    console.log('');
    console.log('Remaining ads:');
    console.log('  - VIC Selective Entry (801955107261) - APPROVED ✅');
    console.log('  - NSW Selective Entry (802069577642) - APPROVED ✅');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
