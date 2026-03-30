/**
 * Add Proven Converting Keywords
 *
 * Based on search term analysis, add these as EXACT match:
 * - "acer scholarship examination" - 16.67% conv rate, $4.31 CAC
 * - "acer year 7 practice test" - 100% conv rate, $0.94 CAC
 * - "excel naplan year 5" - 50% conv rate, $2.24 CAC
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

// New keywords to add (EXACT match for precise targeting)
const NEW_KEYWORDS = [
  {
    campaign: 'ACER Scholarship',
    keyword: 'acer scholarship examination',
    bid: 5.00, // Start conservative, proven 16.67% conv rate at $4.31 CAC
    reason: '16.67% conversion rate, $4.31 CAC'
  },
  {
    campaign: 'ACER Scholarship',
    keyword: 'acer year 7 practice test',
    bid: 2.00, // Start conservative, proven 100% conv rate at $0.94 CAC
    reason: '100% conversion rate, $0.94 CAC'
  },
  {
    campaign: 'Year 5 NAPLAN',
    keyword: 'excel naplan year 5',
    bid: 3.00, // Already exists at $2.24, increase slightly
    reason: '50% conversion rate, $2.24 CAC (already exists, will skip)'
  },
];

async function addWinningKeywords() {
  console.log('🎯 ADDING PROVEN CONVERTING KEYWORDS\n');

  try {
    // Get all campaigns
    const campaignQuery = `
      SELECT campaign.id, campaign.name
      FROM campaign
      WHERE campaign.status != 'REMOVED'
    `;

    const campaigns = await customer.query(campaignQuery);
    const campaignMap = new Map();

    for (const row of campaigns) {
      campaignMap.set(row.campaign.name, row.campaign.id.toString());
    }

    for (const newKw of NEW_KEYWORDS) {
      const campaignId = campaignMap.get(newKw.campaign);

      if (!campaignId) {
        console.log(`⚠️  Campaign "${newKw.campaign}" not found, skipping "${newKw.keyword}"\n`);
        continue;
      }

      console.log(`📊 ${newKw.campaign}`);
      console.log(`   Adding: "${newKw.keyword}" [EXACT] @ $${newKw.bid.toFixed(2)}`);
      console.log(`   Reason: ${newKw.reason}`);

      // Find EXACT match ad group for this campaign
      const adGroupQuery = `
        SELECT ad_group.id, ad_group.name
        FROM ad_group
        WHERE campaign.id = ${campaignId}
          AND ad_group.name LIKE '%EXACT%'
          AND ad_group.status = 'ENABLED'
      `;

      const adGroups = await customer.query(adGroupQuery);
      const adGroupArray = Array.from(adGroups);

      if (adGroupArray.length === 0) {
        console.log(`   ⚠️  No EXACT ad group found in ${newKw.campaign}\n`);
        continue;
      }

      const adGroupId = adGroupArray[0].ad_group.id.toString();
      const adGroupName = adGroupArray[0].ad_group.name;

      console.log(`   Target Ad Group: ${adGroupName}`);

      try {
        const operation: MutateOperation<resources.IAdGroupCriterion> = {
          entity: 'ad_group_criterion',
          operation: 'create',
          resource: {
            ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}`,
            keyword: {
              text: newKw.keyword,
              match_type: enums.KeywordMatchType.EXACT,
            },
            cpc_bid_micros: newKw.bid * 1_000_000, // Convert to micros
            status: enums.AdGroupCriterionStatus.ENABLED,
          },
        };

        await customer.mutateResources([operation]);

        console.log(`   ✅ Added successfully!\n`);

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        if (error.message.includes('DUPLICATE') || error.message.includes('duplicate')) {
          console.log(`   ⏭️  Keyword already exists (skipping)\n`);
        } else {
          console.error(`   ❌ Failed: ${error.message}\n`);
        }
      }
    }

    console.log('✅ Winning keywords added successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addWinningKeywords()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
