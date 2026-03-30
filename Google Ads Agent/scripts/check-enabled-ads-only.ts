import { GoogleAdsApi } from 'google-ads-api';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🔍 Checking ENABLED Ads Only\n');

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
    const ads = await customer.query(`
      SELECT
        campaign.name,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.final_urls,
        ad_group_ad.status,
        ad_group_ad.policy_summary.approval_status,
        ad_group_ad.policy_summary.review_status,
        ad_group_ad.policy_summary.policy_topic_entries
      FROM ad_group_ad
      WHERE campaign.status = 'ENABLED'
        AND ad_group_ad.status = 'ENABLED'
      ORDER BY campaign.name
    `);

    console.log(`Found ${ads.length} ENABLED ads\n`);
    console.log('='.repeat(80));

    const approvalStatusMap: Record<number, string> = {
      0: 'UNSPECIFIED',
      1: 'UNKNOWN',
      2: 'DISAPPROVED',
      3: 'APPROVED_LIMITED',
      4: 'APPROVED',
    };

    for (const ad of ads) {
      const approvalStatus = ad.ad_group_ad.policy_summary?.approval_status;
      const policyTopics = ad.ad_group_ad.policy_summary?.policy_topic_entries || [];

      console.log(`\n📝 Campaign: ${ad.campaign.name}`);
      console.log(`   Ad ID: ${ad.ad_group_ad.ad.id}`);
      console.log(`   Final URL: ${ad.ad_group_ad.ad.final_urls?.[0]}`);
      console.log(`   Status: ENABLED`);
      console.log(`   Approval: ${approvalStatusMap[approvalStatus] || approvalStatus}`);

      if (policyTopics.length > 0) {
        console.log(`   ❌ Has ${policyTopics.length} policy violation(s)`);
        policyTopics.forEach((topic: any) => {
          console.log(`      - ${topic.topic}`);
        });
      } else {
        console.log(`   ✅ No policy violations`);
      }
    }

    console.log('\n' + '='.repeat(80));

    const allApproved = ads.every(ad =>
      ad.ad_group_ad.policy_summary?.approval_status === 4 &&
      (ad.ad_group_ad.policy_summary?.policy_topic_entries?.length || 0) === 0
    );

    if (allApproved) {
      console.log('\n✅ All ENABLED ads are APPROVED with no violations!');
    } else {
      console.log('\n⚠️  Some ads still have issues.');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
  }
}

main();
