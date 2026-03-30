/**
 * Pause Broken Ads
 *
 * Pauses all ads with broken URLs (https://learning.educoach.com.au)
 * that are showing DESTINATION_NOT_WORKING policy violations
 */

import { GoogleAdsApi, MutateOperation, resources, enums } from 'google-ads-api';
import * as dotenv from 'dotenv';

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

const BROKEN_URL = 'https://learning.educoach.com.au';

async function pauseBrokenAds() {
  console.log('🛑 PAUSING BROKEN ADS\n');
  console.log(`Looking for ads with broken URL: ${BROKEN_URL}\n`);

  try {
    // Get all ENABLED ads
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.final_urls,
        ad_group_ad.status,
        ad_group_ad.policy_summary.approval_status,
        ad_group_ad.policy_summary.policy_topic_entries
      FROM ad_group_ad
      WHERE campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_ad.status = 'ENABLED'
    `;

    const results = await customer.query(query);

    // Filter for ads with broken URL
    const adsToRemove = Array.from(results).filter((row: any) => {
      const finalUrls = row.ad_group_ad.ad.final_urls || [];
      return finalUrls.some((url: string) => url.includes('learning.educoach.com.au'));
    });

    if (adsToRemove.length === 0) {
      console.log('✅ No ads found with broken URL. All clean!\n');
      return;
    }

    console.log(`Found ${adsToRemove.length} ad(s) to pause:\n`);

    for (const row of adsToRemove) {
      const campaignName = row.campaign.name;
      const adGroupName = row.ad_group.name;
      const adId = row.ad_group_ad.ad.id.toString();
      const approvalStatus = row.ad_group_ad.policy_summary?.approval_status || 'UNKNOWN';
      const violations = row.ad_group_ad.policy_summary?.policy_topic_entries || [];

      console.log(`📝 ${campaignName} > ${adGroupName}`);
      console.log(`   Ad ID: ${adId}`);
      console.log(`   Approval: ${approvalStatus}`);

      if (violations.length > 0) {
        console.log(`   Violations: ${violations.map((v: any) => v.type).join(', ')}`);
      }

      try {
        // Pause the ad
        const operation: MutateOperation<resources.IAdGroupAd> = {
          entity: 'ad_group_ad',
          operation: 'update',
          resource: {
            resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroupAds/${row.ad_group.id}~${row.ad_group_ad.ad.id}`,
            status: enums.AdGroupAdStatus.PAUSED,
          },
          update_mask: { paths: ['status'] },
        };

        await customer.mutateResources([operation]);

        console.log(`   ✅ Paused\n`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`   ❌ Failed to pause: ${error.message}\n`);
      }
    }

    console.log('✅ Broken ads cleanup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

pauseBrokenAds()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
