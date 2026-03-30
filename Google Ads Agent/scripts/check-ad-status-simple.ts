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

async function checkAdStatus() {
  console.log('🔍 Checking Google Ads Status\n');

  try {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.policy_summary.approval_status,
        ad_group_ad.policy_summary.review_status
      FROM ad_group_ad
      WHERE campaign.status = 'ENABLED'
      LIMIT 50
    `;

    console.log('Fetching ads...\n');
    const ads = await customer.query(query);

    console.log(`Found ${ads.length} ads\n`);

    for (const ad of ads) {
      console.log(`Campaign: ${ad.campaign.name}`);
      console.log(`Ad Group: ${ad.ad_group.name}`);
      console.log(`Ad ID: ${ad.ad_group_ad.ad.id}`);

      const approvalStatus = ad.ad_group_ad.policy_summary?.approval_status || 'UNKNOWN';
      const reviewStatus = ad.ad_group_ad.policy_summary?.review_status || 'UNKNOWN';

      console.log(`Approval: ${approvalStatus}`);
      console.log(`Review: ${reviewStatus}`);

      if (approvalStatus !== 'APPROVED') {
        console.log('⚠️  NOT APPROVED!');

        const headlines = ad.ad_group_ad.ad.responsive_search_ad?.headlines || [];
        const descriptions = ad.ad_group_ad.ad.responsive_search_ad?.descriptions || [];

        console.log('\nHeadlines:');
        headlines.forEach((h: any, idx: number) => {
          console.log(`  ${idx + 1}. "${h.text}"`);
        });

        console.log('\nDescriptions:');
        descriptions.forEach((d: any, idx: number) => {
          console.log(`  ${idx + 1}. "${d.text}"`);
        });
      }

      console.log('-'.repeat(80));
      console.log('');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

checkAdStatus();
