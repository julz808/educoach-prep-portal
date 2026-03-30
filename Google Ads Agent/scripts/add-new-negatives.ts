/**
 * Add New Negative Keywords
 *
 * Based on search term analysis:
 * - "entrance exam quiz" - $48 wasted
 * - "hscassociate" - $20 wasted
 * - "spectrum tuition" - $14 wasted
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

// New negative keywords to add (PHRASE match to catch variations)
const NEW_NEGATIVES = [
  { keyword: 'entrance exam quiz', reason: '$48.05 wasted, 94 clicks, 0 conversions' },
  { keyword: 'hscassociate', reason: '$20.15 wasted, 3 clicks, 0 conversions (competitor)' },
  { keyword: 'spectrum tuition', reason: '$14.51 wasted, 3 clicks, 0 conversions (competitor)' },
];

async function addNegativeKeywords() {
  console.log('🚫 ADDING NEW NEGATIVE KEYWORDS\n');

  try {
    // Get all campaigns
    const campaignQuery = `
      SELECT campaign.id, campaign.name
      FROM campaign
      WHERE campaign.status != 'REMOVED'
    `;

    const campaigns = await customer.query(campaignQuery);

    console.log(`Adding to ${Array.from(campaigns).length} campaigns:\n`);

    for (const row of campaigns) {
      const campaignId = row.campaign.id.toString();
      const campaignName = row.campaign.name;

      console.log(`📊 ${campaignName}`);

      for (const neg of NEW_NEGATIVES) {
        try {
          const operation: MutateOperation<resources.ICampaignCriterion> = {
            entity: 'campaign_criterion',
            operation: 'create',
            resource: {
              campaign: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
              keyword: {
                text: neg.keyword,
                match_type: enums.KeywordMatchType.PHRASE, // PHRASE to catch variations
              },
              negative: true,
            },
          };

          await customer.mutateResources([operation]);

          console.log(`   ✅ Added "${neg.keyword}" [PHRASE]`);
          console.log(`      Reason: ${neg.reason}`);

          // Small delay
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error: any) {
          if (error.message.includes('DUPLICATE')) {
            console.log(`   ⏭️  "${neg.keyword}" already exists (skipping)`);
          } else {
            console.error(`   ❌ Failed to add "${neg.keyword}": ${error.message}`);
          }
        }
      }

      console.log('');
    }

    console.log('✅ Negative keywords added successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addNegativeKeywords()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
