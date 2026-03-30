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
  console.log('🔍 Checking Google Ads Status and Policy Violations\n');
  console.log('=' .repeat(80));

  try {
    // Query for all ads with their approval status and policy violations
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
        ad_group_ad.policy_summary.review_status,
        ad_group_ad.policy_summary.policy_topic_entries
      FROM ad_group_ad
      WHERE campaign.status = 'ENABLED'
        AND ad_group.status = 'ENABLED'
        AND ad_group_ad.status = 'ENABLED'
      ORDER BY campaign.name, ad_group.name
    `;

    const ads = await customer.query(query);

    let hasViolations = false;
    let adCount = 0;

    for (const ad of ads) {
      adCount++;
      const campaignName = ad.campaign.name;
      const adGroupName = ad.ad_group.name;
      const adId = ad.ad_group_ad.ad.id;
      const approvalStatus = ad.ad_group_ad.policy_summary?.approval_status || 'UNKNOWN';
      const reviewStatus = ad.ad_group_ad.policy_summary?.review_status || 'UNKNOWN';
      const policyTopics = ad.ad_group_ad.policy_summary?.policy_topic_entries || [];

      const headlines = ad.ad_group_ad.ad.responsive_search_ad?.headlines || [];
      const descriptions = ad.ad_group_ad.ad.responsive_search_ad?.descriptions || [];

      console.log(`\n📝 Ad ID: ${adId}`);
      console.log(`   Campaign: ${campaignName}`);
      console.log(`   Ad Group: ${adGroupName}`);
      console.log(`   Approval Status: ${approvalStatus}`);
      console.log(`   Review Status: ${reviewStatus}`);

      if (approvalStatus !== 'APPROVED' || policyTopics.length > 0) {
        hasViolations = true;
        console.log(`   ⚠️  STATUS: ${approvalStatus === 'APPROVED' ? 'APPROVED BUT HAS POLICY TOPICS' : 'NOT APPROVED'}`);

        // Show headlines
        console.log(`\n   Headlines:`);
        headlines.forEach((h: any, idx: number) => {
          console.log(`     ${idx + 1}. "${h.text}" (${h.text.length} chars)`);
        });

        // Show descriptions
        console.log(`\n   Descriptions:`);
        descriptions.forEach((d: any, idx: number) => {
          console.log(`     ${idx + 1}. "${d.text}" (${d.text.length} chars)`);
        });

        // Show policy violations
        if (policyTopics.length > 0) {
          console.log(`\n   ❌ POLICY VIOLATIONS:`);
          policyTopics.forEach((topic: any, idx: number) => {
            console.log(`\n   Violation ${idx + 1}:`);
            console.log(`     Topic: ${topic.topic || 'N/A'}`);
            console.log(`     Type: ${topic.type || 'N/A'}`);

            if (topic.evidences && topic.evidences.length > 0) {
              console.log(`     Evidences:`);
              topic.evidences.forEach((evidence: any) => {
                if (evidence.website_list) {
                  console.log(`       - Website list issue`);
                }
                if (evidence.destination_text_list) {
                  console.log(`       - Destination texts: ${evidence.destination_text_list.destination_texts?.join(', ')}`);
                }
                if (evidence.destination_mismatch) {
                  console.log(`       - Destination mismatch`);
                }
                if (evidence.text_list) {
                  console.log(`       - Problematic text: "${evidence.text_list.texts?.join('", "')}"`);
                }
              });
            }
          });
        }

        console.log('\n' + '-'.repeat(80));
      } else {
        console.log(`   ✅ STATUS: APPROVED`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal ads checked: ${adCount}`);

    if (!hasViolations) {
      console.log('✅ All ads are approved with no policy violations!');
    } else {
      console.log('⚠️  Some ads have policy violations or are not approved.');
      console.log('\nNext steps:');
      console.log('1. Review the policy violations above');
      console.log('2. Fix the problematic text in headlines/descriptions');
      console.log('3. Update the ads using the Google Ads API');
    }

  } catch (error: any) {
    console.error('❌ Error checking ad status:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAdStatus()
    .then(() => {
      console.log('\n✅ Check complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Check failed:', error);
      process.exit(1);
    });
}

export { checkAdStatus };
