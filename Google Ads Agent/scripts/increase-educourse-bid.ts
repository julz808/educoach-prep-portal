/**
 * Increase Bid on "educourse" Brand Term
 *
 * Data shows educourse converting at $5.56 CAC vs $122.63 average
 * Current bids: $0.56-$6.71
 * New bid: $12 (aggressive but justified by performance)
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

const NEW_BID = 12.00; // $12 - aggressive but justified by $5.56 CAC

async function increaseEducourseBid() {
  console.log('💰 INCREASING BID ON "educourse" BRAND TERM\n');
  console.log(`New bid: $${NEW_BID.toFixed(2)}`);
  console.log(`Reason: Converting at $5.56 CAC vs $122.63 average\n`);
  console.log('═'.repeat(80));

  try {
    // Find all "educourse" keywords
    const query = `
      SELECT
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.cpc_bid_micros,
        ad_group_criterion.status
      FROM ad_group_criterion
      WHERE campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_criterion.keyword.text = 'educourse'
        AND ad_group_criterion.status != 'REMOVED'
    `;

    const results = await customer.query(query);
    const keywords = Array.from(results);

    if (keywords.length === 0) {
      console.log('⚠️  No "educourse" keywords found\n');
      return;
    }

    console.log(`\nFound ${keywords.length} "educourse" keyword(s):\n`);

    for (const row of keywords) {
      const campaignName = row.campaign.name;
      const adGroupId = row.ad_group.id.toString();
      const adGroupName = row.ad_group.name;
      const criterionId = row.ad_group_criterion.criterion_id.toString();
      const currentBid = row.ad_group_criterion.cpc_bid_micros ?
        row.ad_group_criterion.cpc_bid_micros / 1_000_000 : 0;
      const matchType = row.ad_group_criterion.keyword.match_type;
      const status = row.ad_group_criterion.status === 2 ? 'ENABLED' : 'PAUSED';

      console.log(`📊 ${campaignName} > ${adGroupName}`);
      console.log(`   Keyword: "educourse" [${matchType === 2 ? 'EXACT' : matchType === 3 ? 'PHRASE' : 'BROAD'}]`);
      console.log(`   Current bid: $${currentBid.toFixed(2)}`);
      console.log(`   Status: ${status}`);

      try {
        // Update the keyword bid using mutateResources
        const operation: any = {
          entity: 'ad_group_criterion',
          operation: 'update',
          resource: {
            resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroupCriteria/${adGroupId}~${criterionId}`,
            cpc_bid_micros: NEW_BID * 1_000_000,
          },
          update_mask: { paths: ['cpc_bid_micros'] },
        };

        await customer.mutateResources([operation]);

        console.log(`   ✅ Updated to $${NEW_BID.toFixed(2)} (+${((NEW_BID - currentBid) / currentBid * 100).toFixed(0)}%)\n`);

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`   ❌ Failed to update: ${error.message}\n`);
      }
    }

    console.log('═'.repeat(80));
    console.log('\n✅ "educourse" bid increase complete!\n');
    console.log('Expected impact:');
    console.log('  - Higher impression share on brand searches');
    console.log('  - More clicks from high-intent users');
    console.log('  - Maintain $5.56 CAC (well below $122 average)\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

increaseEducourseBid()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
