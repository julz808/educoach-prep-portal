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

async function getPolicyViolations() {
  console.log('🔍 Checking Policy Violations\n');

  try {
    const query = `
      SELECT
        campaign.name,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.policy_summary.approval_status,
        ad_group_ad.policy_summary.review_status,
        ad_group_ad.policy_summary.policy_topic_entries
      FROM ad_group_ad
      WHERE campaign.status = 'ENABLED'
    `;

    const ads = await customer.query(query);

    for (const ad of ads) {
      console.log('='.repeat(80));
      console.log(`\nCampaign: ${ad.campaign.name}`);
      console.log(`Ad Group: ${ad.ad_group.name}`);
      console.log(`Ad ID: ${ad.ad_group_ad.ad.id}`);

      const approvalStatus = ad.ad_group_ad.policy_summary?.approval_status;
      const reviewStatus = ad.ad_group_ad.policy_summary?.review_status;
      const policyTopics = ad.ad_group_ad.policy_summary?.policy_topic_entries || [];

      // Map status codes
      const approvalStatusMap: Record<number, string> = {
        0: 'UNSPECIFIED',
        1: 'UNKNOWN',
        2: 'DISAPPROVED',
        3: 'APPROVED_LIMITED',
        4: 'APPROVED',
      };

      const reviewStatusMap: Record<number, string> = {
        0: 'UNSPECIFIED',
        1: 'UNKNOWN',
        2: 'REVIEWED',
        3: 'UNDER_REVIEW',
        4: 'ELIGIBLE_MAY_SERVE',
      };

      console.log(`\nApproval Status: ${approvalStatusMap[approvalStatus] || approvalStatus}`);
      console.log(`Review Status: ${reviewStatusMap[reviewStatus] || reviewStatus}`);

      const headlines = ad.ad_group_ad.ad.responsive_search_ad?.headlines || [];
      const descriptions = ad.ad_group_ad.ad.responsive_search_ad?.descriptions || [];

      console.log('\nHeadlines:');
      headlines.forEach((h: any, idx: number) => {
        console.log(`  ${idx + 1}. "${h.text}" (${h.text.length} chars)`);
      });

      console.log('\nDescriptions:');
      descriptions.forEach((d: any, idx: number) => {
        console.log(`  ${idx + 1}. "${d.text}" (${d.text.length} chars)`);
      });

      if (policyTopics.length > 0) {
        console.log('\n❌ POLICY VIOLATIONS:');
        console.log(JSON.stringify(policyTopics, null, 2));
      } else {
        console.log('\n✅ No policy topics found');
      }

      console.log('');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

getPolicyViolations();
