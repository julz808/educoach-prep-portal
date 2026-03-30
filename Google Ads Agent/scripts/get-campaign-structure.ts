/**
 * Get Campaign Structure Report
 *
 * Shows detailed structure of all campaigns including:
 * - Ad groups (by match type)
 * - Keywords per ad group
 * - Negative keywords
 * - Ads per ad group
 */

import { GoogleAdsApi } from 'google-ads-api';
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

async function getCampaignStructure() {
  console.log('📊 GOOGLE ADS CAMPAIGN STRUCTURE REPORT\n');
  console.log('═'.repeat(80));

  try {
    // Get campaigns
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `;

    const campaigns = await customer.query(campaignQuery);

    for (const campaign of campaigns) {
      const campaignName = campaign.campaign.name;
      const campaignId = campaign.campaign.id.toString();
      const budget = (campaign.campaign_budget.amount_micros / 1_000_000).toFixed(2);
      const status = campaign.campaign.status === 2 ? 'ENABLED' : 'PAUSED';

      console.log(`\n📌 ${campaignName}`);
      console.log(`   Campaign ID: ${campaignId}`);
      console.log(`   Status: ${status}`);
      console.log(`   Daily Budget: $${budget} AUD`);
      console.log('   ─'.repeat(40));

      // Get ad groups for this campaign
      const adGroupQuery = `
        SELECT
          ad_group.id,
          ad_group.name,
          ad_group.status
        FROM ad_group
        WHERE campaign.id = ${campaignId}
          AND ad_group.status != 'REMOVED'
        ORDER BY ad_group.name
      `;

      const adGroups = await customer.query(adGroupQuery);

      for (const adGroup of adGroups) {
        const adGroupName = adGroup.ad_group.name;
        const adGroupId = adGroup.ad_group.id.toString();
        const agStatus = adGroup.ad_group.status === 2 ? 'ENABLED' : 'PAUSED';

        console.log(`\n   📁 Ad Group: ${adGroupName}`);
        console.log(`      Status: ${agStatus}`);

        // Get keywords for this ad group
        const keywordQuery = `
          SELECT
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.status
          FROM ad_group_criterion
          WHERE campaign.id = ${campaignId}
            AND ad_group.id = ${adGroupId}
            AND ad_group_criterion.type = 'KEYWORD'
            AND ad_group_criterion.status != 'REMOVED'
          ORDER BY ad_group_criterion.keyword.match_type
        `;

        const keywords = await customer.query(keywordQuery);
        const keywordList = Array.from(keywords);

        if (keywordList.length > 0) {
          console.log(`      🔑 Keywords (${keywordList.length}):`);

          const byMatchType: any = {
            EXACT: [],
            PHRASE: [],
            BROAD: []
          };

          keywordList.forEach((kw: any) => {
            const text = kw.ad_group_criterion.keyword.text;
            const matchType = kw.ad_group_criterion.keyword.match_type;
            const kwStatus = kw.ad_group_criterion.status === 2 ? 'ENABLED' : 'PAUSED';
            byMatchType[matchType]?.push({ text, status: kwStatus });
          });

          Object.entries(byMatchType).forEach(([matchType, kws]: [string, any]) => {
            if (kws.length > 0) {
              console.log(`         ${matchType}: ${kws.length} keyword(s)`);
              kws.forEach((kw: any) => {
                const statusIcon = kw.status === 'ENABLED' ? '✓' : '⏸';
                console.log(`            ${statusIcon} ${kw.text}`);
              });
            }
          });
        } else {
          console.log(`      🔑 Keywords: None`);
        }

        // Get ads for this ad group
        const adQuery = `
          SELECT
            ad_group_ad.ad.id,
            ad_group_ad.status,
            ad_group_ad.policy_summary.approval_status
          FROM ad_group_ad
          WHERE campaign.id = ${campaignId}
            AND ad_group.id = ${adGroupId}
            AND ad_group_ad.status != 'REMOVED'
        `;

        const ads = await customer.query(adQuery);
        const adList = Array.from(ads);

        const enabledAds = adList.filter((a: any) => a.ad_group_ad.status === 2);
        const pausedAds = adList.filter((a: any) => a.ad_group_ad.status === 3);

        console.log(`      📝 Ads: ${enabledAds.length} enabled, ${pausedAds.length} paused`);
      }

      // Get campaign-level negative keywords
      const negativeKeywordQuery = `
        SELECT
          campaign_criterion.keyword.text,
          campaign_criterion.keyword.match_type
        FROM campaign_criterion
        WHERE campaign.id = ${campaignId}
          AND campaign_criterion.type = 'KEYWORD'
          AND campaign_criterion.negative = true
          AND campaign_criterion.status != 'REMOVED'
      `;

      const negativeKeywords = await customer.query(negativeKeywordQuery);
      const negativeList = Array.from(negativeKeywords);

      if (negativeList.length > 0) {
        console.log(`\n   🚫 Campaign Negative Keywords (${negativeList.length}):`);
        negativeList.forEach((nk: any) => {
          const text = nk.campaign_criterion.keyword.text;
          const matchType = nk.campaign_criterion.keyword.match_type;
          console.log(`      - "${text}" [${matchType}]`);
        });
      }

      console.log('\n' + '═'.repeat(80));
    }

    console.log('\n✅ Report complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

getCampaignStructure()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
