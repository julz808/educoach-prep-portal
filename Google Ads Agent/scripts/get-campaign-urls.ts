import { GoogleAdsApi } from 'google-ads-api';
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

async function getCampaignUrls() {
  console.log('🔍 Checking Campaign URLs\n');

  try {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.responsive_search_ad.path1,
        ad_group_ad.ad.responsive_search_ad.path2
      FROM ad_group_ad
      WHERE campaign.status = 'ENABLED'
    `;

    const ads = await customer.query(query);

    for (const ad of ads) {
      console.log('='.repeat(80));
      console.log(`Campaign: ${ad.campaign.name}`);
      console.log(`Ad Group: ${ad.ad_group.name}`);
      console.log(`Ad ID: ${ad.ad_group_ad.ad.id}`);
      console.log(`Final URLs: ${JSON.stringify(ad.ad_group_ad.ad.final_urls)}`);
      console.log(`Path1: ${ad.ad_group_ad.ad.responsive_search_ad?.path1 || 'N/A'}`);
      console.log(`Path2: ${ad.ad_group_ad.ad.responsive_search_ad?.path2 || 'N/A'}`);
      console.log('');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

getCampaignUrls();
